const express = require('express');
const app = express();
const router = express.Router();
const bcrypt = require("bcryptjs");
const connection = require("../database");
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

app.use(express.urlencoded({ extended: false })); //se ocupa de procesarea datelor trimise in format formular html
app.use(express.json()); //conversie din JSON in obiecte js

const googleOAuthClientID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(googleOAuthClientID); //pentru a valida clientul google
// console.log("client:", client);

router.post("/register", async (req, res) => {
    const { username, password, name, phone } = req.body;
    const saltRounds = 10;
    var hashedPassword = '';

    if (!username || !password || !name || !phone) {
        return res.status(400).json({ error: 'Toate campurile sunt obligatorii!' });
    };

    //check if user with the same username already exists
    const query1 = `SELECT * FROM users WHERE username = ?;`;
    const data1 = [username];

    const result = await queryAsync(query1, data1);
    if (result.length > 0)
        return res.status(500).json({ message: 'User with this username already exists' });

    const query2 = `SELECT * FROM users WHERE phone = ?;`;
    const data2 = [phone];
    const result2 = await queryAsync(query2, data2);

    if (result2.length > 0) {
        return res.status(500).json({ message: 'This phone number is used by another user!' });
    }

    // Dacă nu există, continui cu înregistrarea userului

    //continue with generating hashed password
    try {
        //generating the salt
        const salt = await bcrypt.genSalt(saltRounds);
        //hashing the password
        hashedPassword = await bcrypt.hash(password, salt);
    } catch (e) {
        console.log("Eroare la criptarea parolei: ", e);
        res.status(500).send('Eroare la criptarea parolei');
    }

    const data = [username, hashedPassword, name, phone];
    const query = `INSERT INTO users (username, password, name, phone) VALUES(?, ?, ?, ?);`;

    connection.query(query, data, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Eroare la inserarea înregistrării');
        }
        res.status(200).send('Utilizator înregistrat cu succes!');
    });
});

//functie necesara pentru login ca sa gestionam mai usor mai multe functii async
const queryAsync = (query, values) => {
    return new Promise((resolve, reject) => {
        connection.query(query, values, (err, result) => { //functia de callback primeste eroarea si rezultatul executiei query-ului
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

const bcryptCompareAsync = async (password, hashedPassword) => {
    try {
        const result = await bcrypt.compare(password, hashedPassword);
        return result; //true daca parolele coincid
    } catch (err) {
        throw new Error('Eroare la compararea parolei');
    }
};

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    let hashedPassword = '';

    //verificam daca parola introdusa de utilizator este aceeasi cu cea din baza de date
    if (!username || !password) {
        return res.status(400).json({ error: 'Campurile sunt goale!' });
    };

    const query = `SELECT * FROM users WHERE username = ?;`;
    const data = [username];

    const result = await queryAsync(query, data);
    if (result.length === 0)
        return res.status(500).json({ message: 'User does not exist' });

    hashedPassword = result[0].password;//result returneaza un array de obiecte asa ca luam primul obiect(si singurul)

    const equalPasswords = await bcryptCompareAsync(password, hashedPassword);

    if (!equalPasswords) {
        return res.status(401).json({ message: 'Incorrect password' });
    }

    //generare de tokenuri
    const user = { name: username, userid: result[0].idusers };
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

    //introducere a refresh token in baza de date. daca e successful, returnam token-urile
    const dataforRefreshToken = [refreshToken, username];
    const queryRefreshToken = `UPDATE users SET refreshToken = ? WHERE username = ?;`;

    connection.query(queryRefreshToken, dataforRefreshToken, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Eroare la inserarea înregistrării');
        }
        return res.json({ accessToken: accessToken, refreshToken: refreshToken });
    });

});

router.post("/loginGoogle", async (req, res) => {
    const token = req.body.token;

    if (!token) {
        return res.status(400).json({ error: 'Token-ul este gol!' });
    }

    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: googleOAuthClientID
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    // verificam daca userul exista
    const query = `SELECT * FROM users WHERE username = ?;`;
    const data = [email];
    const result = await queryAsync(query, data);

    let userId;

    if (!result[0]) {
        const insertQuery = `INSERT INTO users (username, password, name, phone) VALUES (?, ?, ?, ?)`;
        const insertData = [email, "-", name, "-"];
        const insertResult = await queryAsync(insertQuery, insertData);
        userId = insertResult.insertId;
    } else {
        userId = result[0].idusers;
    }

    const user = { name: email, userid: userId };
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

    const dataforRefreshToken = [refreshToken, email];
    const queryRefreshToken = `UPDATE users SET refreshToken = ? WHERE username = ?;`;

    connection.query(queryRefreshToken, dataforRefreshToken, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Eroare la inserarea înregistrării');
        }
        return res.json({ accessToken: accessToken, refreshToken: refreshToken });
    });
});


router.delete("/logout", async (req, res) => {
    const username = req.body.username;

    const query = `UPDATE users SET refreshToken = NULL WHERE username = ?`;
    const data = [username];

    try {
        await queryAsync(query, data);
        return res.status(200).send('Logout cu success');
    } catch (err) {
        return res.status(500).send('Eroare la stergerea înregistrării');
    }
});

const usefulFunctions = require("../utils");
const queryFunction = usefulFunctions.queryAsync;
const authenticateToken = usefulFunctions.authenticateToken;

router.post('/addPushToken', authenticateToken, async (req, res) => {
    const userId = req.user.userid;
    const { expoPushToken } = req.body;
    console.log("Body primit:", req.body);

    if (!expoPushToken) {
        return res.status(400).json({ message: 'expoPushToken is required' });
    }

    try {
        const query = `UPDATE users SET expo_push_token = ? WHERE idusers = ?`;
        await queryFunction(query, [expoPushToken, userId]);
        return res.status(200).json({ message: 'Push token saved' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Failed to save push token' });
    }
});


module.exports = router;