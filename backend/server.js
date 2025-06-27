require('dotenv').config();
const express = require('express');
const app = express();
const connection = require('./database');
const port = 3000;
const jwt = require('jsonwebtoken');
const path = require('path');
const cron = require('node-cron')


//configuram rutele importand fisierul de rute
const configureRoutes = require('./routes/allRoutes');
configureRoutes(app);

//generarea de nou access token daca avem un refresh token
app.post('/refreshToken', (req, res) => {
  const refreshToken = req.body.token;
  console.log("refresh toke ", refreshToken)

  if (refreshToken == '') //daca refresh token e null
    return res.status(401).json({ message: 'refresh token null' });

  const data = [refreshToken];
  const query = `SELECT username, idusers from users WHERE refreshToken = ?;`;

  connection.query(query, data, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).send('Eroare la executarea query-ului');
    }

    if (result.length > 0) { //refresh token trimis de user corespunde cu cel din baza de date

      jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {//verificam daca refresh tokenul mai este valid
        if (err)
          return res.sendStatus(403);

        const accessToken = jwt.sign({ name: user.name, userid: user.userid }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' }); //nu putem sa punem direct user pt ca
        // acum contine si alte date. cream obiectul {name: user.name}
        return res.json({ accessToken: accessToken });
      })
    }
    else { //refresh token trimis de user NU corespunde cu cel din baza de date
      return res.status(500).json({ message: 'Nu s-a gasit refresh token-ul in baza de date' });
    }

  });
});

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const mysql = require('mysql2/promise');
require('dotenv').config();
const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
};
cron.schedule('0 12 * * *', async () => {
  console.log('Ruleaza zilnic la ora 12 dimineata');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1); //getDate retruneaza ziua, iar setDate seteaza ziua
  const yyyy_mm_dd = tomorrow.toISOString().split('T')[0]; // ex: '2025-06-11'

  // Fetch all shared expenses care au reminder set pentru mâine
  const connection = await mysql.createConnection(config);
  const [reminders] = await connection.execute(`
    SELECT es.id, es.reminder_date, es.has_reminder, es.name, es.amount, u2.expo_push_token as expo_push_token, es.group_id
    FROM expense_shared es
    JOIN groups_members gm ON es.group_id = gm.group_id
    JOIN users u2 ON gm.user_id = u2.idusers
    WHERE es.has_reminder = TRUE AND es.reminder_date = ?
  `, [yyyy_mm_dd]);

  const messages = reminders
    .filter(reminder => !!reminder.expo_push_token) //la cei care nu avem token nu trimitem notif
    .map(reminder => ({
      to: reminder.expo_push_token,
      sound: 'default',
      title: 'Expense Reminder',
      body: `Reminder: ${reminder.name} is due tomorrow.`,
      data: { groupId: reminder.group_id },
    }));

  //si daca sunt mai multe remindere pt maine, se trimit
  if (messages.length > 0) {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
    const responseData = await response.json();
    console.log('Reminder push response:', responseData);
  } else {
    console.log('No reminders for tomorrow.');
  }
});


app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`);
});
