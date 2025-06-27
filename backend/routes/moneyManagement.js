const express = require('express');
const app = express();
const router = express.Router();
const connection = require("../database");

const usefulFunctions = require("../utils");
const queryFunction = usefulFunctions.queryAsync;
const authenticateToken = usefulFunctions.authenticateToken;

app.use(express.urlencoded({ extended: false })); //se ocupa de procesarea datelor trimise in format formular html
app.use(express.json()); //conversie din JSON in obiecte js

router.get("/getCategories", authenticateToken, async (req, res) => {

    const query = `SELECT * FROM categories;`;

    try {
        const result = await queryFunction(query, ''); //array de obiecte cu categoriile
        return res.status(200).json(result);
    } catch (err) {
        console.error("Eroare la executarea interogării:", err);
        return res.status(500).json({ message: "error at getting categories" });
    }

});

router.get('/getAccounts/:id_user', authenticateToken, async (req, res) => {

    const { id_user } = req.params;

    if (!id_user) {
        return res.status(400).json({ error: 'id_user null!' });
    };

    const query = `SELECT * FROM accounts WHERE id_user = ?;`;
    const data = [id_user];

    try {
        const result = await queryFunction(query, data); //array de obiecte cu conturile
        return res.status(200).json(result);
    } catch (err) {
        console.error("Eroare la executarea interogării:", err);
        return res.status(500).json({ message: "error at getting categories" });
    }
});

router.post('/addExpense', authenticateToken, async (req, res) => {

    const { id_user, amount, date, category_id, account_id, tags, note, budget_id } = req.body;

    if (!id_user || !amount || !date || !category_id || !account_id) {
        return res.status(400).json({ error: 'null fields!' });
    };

    const connection = await mysql.createConnection(config);
    await connection.beginTransaction();
    try {
        const dateExtracted = date.split('T')[0];
        const data1 = [amount, dateExtracted, note, category_id, account_id, budget_id];
        await connection.query(`INSERT INTO expenses (amount, date, note, category_id, account_id, budget_id) VALUES(?, ?, ?, ?, ?, ?);`, data1);

        const [result2] = await connection.query('SELECT total FROM accounts WHERE idaccounts = ?', [account_id]);
        //la un camp de tip DECIMAL, FLOAT sau DOUBLE, rezultatul poate fi returnat sub forma de string în JS,
        //mai ales daca sunt folosite librarii precum mysql sau mysql2
        const newTotal = parseFloat(result2[0].total) - parseFloat(amount);

        if (newTotal < 0) {
            await connection.rollback();
            return res.status(400).json("Insufficient funds!");
        }

        await connection.query('UPDATE accounts SET total = ? WHERE idaccounts = ?', [newTotal, account_id]);

        await connection.commit();
        return res.status(200).json("Expense succesfully added");
    } catch (err) {
        await connection.rollback(); //daca nu sunt successfull toate query-urile, dam rollback si nu avem nicio inregistrare noua
        console.error('Transaction Failed:', err);
    } finally {
        await connection.end();
    }
});


//facem tranzactie datorita faptului ca este o unitate atomica,si ne asiguram ca operatiile se realizeaza
//in totalitate sau nu se realizeaza deloc
//pentru tranzactie avem nevoie de 'mysql2/promise'
const mysql = require('mysql2/promise');
require('dotenv').config();
const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
};
router.post('/addIncome', authenticateToken, async (req, res) => {

    const { id_user, amount, date, account_id, note } = req.body;

    if (!id_user || !amount || !date || !account_id) {
        return res.status(400).json({ error: 'null fields!' });
    };

    const dateExtracted = date.split('T')[0];

    const connection = await mysql.createConnection(config);
    await connection.beginTransaction();
    try {
        const [result1] = await connection.query('INSERT INTO incomes SET ?', { amount: amount, date: dateExtracted, note: note, account_id });

        const [result2] = await connection.query('SELECT total FROM accounts WHERE idaccounts = ?', [account_id]);
        //la un camp de tip DECIMAL, FLOAT sau DOUBLE, rezultatul poate fi returnat sub forma de string în JS,
        //mai ales daca sunt folosite librarii precum mysql sau mysql2
        const newTotal = parseFloat(result2[0].total) + parseFloat(amount);

        const [result3] = await connection.query('UPDATE accounts SET total = ? WHERE idaccounts = ?', [newTotal, account_id]);

        await connection.commit();
        return res.status(200).json("Income succesfully added");
    } catch (err) {
        await connection.rollback(); //daca nu sunt successfull toate query-urile, dam rollback si nu avem nicio inregistrare noua
        console.error('Transaction Failed:', err);
    } finally {
        await connection.end();
    }
});


//BUDGETS

router.post('/addBudget', authenticateToken, async (req, res) => {

    const { id_user, name, amount, date, freq, note } = req.body;

    if (!id_user || !name || !amount || !date) {
        return res.status(400).json({ error: 'necessary fields null!' });
    };

    let monthFormated = date.month.toString().padStart(2, '0');
    let dateFormated = `${date.year}-${monthFormated}-01`;
    console.log(dateFormated);

    const query = `INSERT INTO budgets (name, amount, month, frequency, note, user_id) VALUES(?, ?, ?, ?, ?, ?);`;
    const data = [name, amount, dateFormated, freq, note, id_user];

    try {
        await queryFunction(query, data);
        return res.status(200).json("Row has been inserted into budgets");
    } catch (err) {
        console.error("Eroare la executarea interogării:", err);
        return res.status(500).json({ message: "error add into budgets" });
    }
});

router.get('/getBudgetsOptions/:id_user', authenticateToken, async (req, res) => {

    const { id_user } = req.params;

    const query = `SELECT * FROM budgets WHERE user_id = ?;`;
    const data = [id_user]

    try {
        const result = await queryFunction(query, data);
        return res.status(200).json(result);
    } catch (err) {
        console.error("Eroare la executarea interogării:", err);
        return res.status(500).json({ message: "error at getting categories" });
    }

});

router.get('/getBudgets/:id_user', authenticateToken, async (req, res) => {

    const { id_user } = req.params;
    const month = parseInt(req.query.month);
    const year = parseInt(req.query.year);

    const dateLimit = new Date(year, month - 1, 1);
    const formattedDate = dateLimit.toISOString().split('T')[0]; // '2025-05-01'

    const query1 = `SELECT b.idbudgets, b.name, b.amount, SUM(e.amount) AS total, frequency, end_date
                  FROM budgets b
                  LEFT JOIN expenses e ON e.budget_id = b.idbudgets AND MONTH(e.date) = ? AND YEAR(e.date) = ?
                  WHERE b.user_id = ? AND ((b.frequency = 2 AND b.end_date > ? AND b.month < ? OR(b.frequency = 2 AND b.end_date IS NULL AND b.month < ?) ) OR (MONTH(b.month) = ? AND YEAR(b.month) = ?))
                  GROUP BY b.idbudgets;` //deci alegem bugetele care sunt recurente inchise intre luna de definire si inchidere, si daca nu e inchis, bugetele recurente se afiseaza incepand cu luna in care au fost create

    const data = [month, year, id_user, formattedDate, formattedDate, formattedDate, month, year]

    try {
        const result = await queryFunction(query1, data);
        return res.status(200).json(result);
    } catch (err) {
        console.error("Eroare la executarea interogării:", err);
        return res.status(500).json({ message: "error at getting budgets" });
    }

});

router.put('/stopBudget/:id', authenticateToken, async (req, res) => {

    const budgetId = req.params.id;

    const query = `UPDATE budgets SET end_date = ? WHERE idbudgets = ? AND frequency = 2;`;
    const today = new Date().toISOString().split('T')[0];
    const data = [today, budgetId];

    try {
        const result = await queryFunction(query, data);
        return res.status(200).json("Budget stopped succesfully");
    } catch (err) {
        console.error("Eroare la executarea interogării:", err);
        return res.status(500).json({ message: "error at put budget" });
    }

});

router.delete("/deleteBudget/:idBudget", authenticateToken, async (req, res) => {

    const idBudget = parseInt(req.params.idBudget, 10);

    const query1 =  `DELETE FROM budgets WHERE idbudgets = ?;`;

    try {
        const result = await queryFunction(query1, [idBudget]);
        res.status(200).json({ message: 'Budget deleted successfully' });
    } catch (err) {
        console.error("Eroare la executarea interogării:", err);
        return res.status(500).json({ message: "error at deleting objective" });
    }

});

router.patch("/updateBudget/:idBudget", authenticateToken, async (req, res) => {

    const idBudget = parseInt(req.params.idBudget, 10);
    const { name, amount } = req.body;

    const query1 =  `UPDATE budgets SET name = ?, amount = ? WHERE idbudgets = ?;`;

    try {
        const result = await queryFunction(query1, [name, amount, idBudget]);
        res.status(200).json({ message: 'Budget updated successfully' });
    } catch (err) {
        console.error("Eroare la executarea interogării:", err);
        return res.status(500).json({ message: "error at updating budget" });
    }

});

router.get("/getDetailsBalance", authenticateToken, async (req, res) => {

    const userId = req.user.userid;

    if (!userId)
        return res.status(500).json({ message: "userId is null" });

    const query = `SELECT SUM(total) as totalBalance
                    FROM accounts
                    WHERE id_user = ?;`;
    
    const query2 = `SELECT SUM(amount) as totalSpent
                    FROM expenses e
                    JOIN accounts a ON a.idaccounts = e.account_id
                    WHERE MONTH(date) = MONTH(CURDATE()) AND id_user = ?;`;
    
    const query3 = `SELECT *
                    FROM (SELECT e.idexpenses, e.amount, e.date, e.note, "expense" AS type
                        FROM expenses e
                        JOIN accounts a ON a.idaccounts = e.account_id
                        WHERE MONTH(e.date) = MONTH(CURDATE()) 
                        AND YEAR(e.date) = YEAR(CURDATE()) 
                        AND a.id_user = ?
                        
                        UNION ALL
                        
                        SELECT i.idincomes, i.amount, i.date, i.note, "income" AS type
                        FROM incomes i
                        JOIN accounts a ON a.idaccounts = i.account_id
                        WHERE MONTH(i.date) = MONTH(CURDATE()) 
                        AND YEAR(i.date) = YEAR(CURDATE()) 
                        AND a.id_user = ?
                        ) AS combined
                    ORDER BY combined.date DESC
                    LIMIT 10;
`

    try {
        const result = await queryFunction(query, [userId]);
        const result2 = await queryFunction(query2, [userId]);
        const result3 = await queryFunction(query3, [userId, userId]);
        return res.status(200).json({totalBalance: result[0].totalBalance, totalSpent: result2[0].totalSpent, latestRecords: result3});
    } catch (err) {
        return res.status(500).json({ message: "error at getting details", err });
    }
});

module.exports = router;
    