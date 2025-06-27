const express = require('express');
const app = express();
const router = express.Router();
const connection = require("../database");

const usefulFunctions = require("../utils");
const queryFunction = usefulFunctions.queryAsync;
const authenticateToken = usefulFunctions.authenticateToken;

app.use(express.urlencoded({ extended: false })); //se ocupa de procesarea datelor trimise in format formular html
app.use(express.json()); //conversie din JSON in obiecte js

router.get("/expenses", authenticateToken, async (req, res) => {

    const { account_id, userid, category_id, budget_id } = req.query; //daca vrem toate accounts, nu transmitem account_id in query. sau transmitem valori falsy

    const acc = account_id === "total" ? null : account_id; //daca vrem sa stim totalul inlocuim cu null ca sa ia toate accounts in considereare
    const cat = category_id === "all" ? null : category_id;
    const bud = budget_id === "all" ? null : budget_id;

    const query = `SELECT e.amount, e.date, c.category, e.note, icon, idexpenses, e.budget_id, b.name AS budget_name
                    FROM expenses e
                    JOIN accounts a ON a.idaccounts = e.account_id
                    JOIN categories c ON c.idcategories = e.category_id
                    LEFT JOIN budgets b ON e.budget_id = b.idbudgets
                    WHERE (a.idaccounts = ? OR ? IS NULL)
                    AND a.id_user = ?
                    AND ((e.category_id = ? OR ? IS NULL))
                    AND ((e.budget_id = ? OR ? IS NULL))
                    ORDER BY date DESC;`;

    try {
        const result = await queryFunction(query, [acc, acc, userid, cat, cat, bud, bud]); //array de obiecte cu categoriile
        return res.status(200).json(result);
    } catch (err) {
        console.error("Eroare la executarea interogării:", err);
        return res.status(500).json({ message: "error at getting expenses records" });
    }

})

router.get("/incomes", authenticateToken, async (req, res) => {

    const { account_id, userid } = req.query; //daca vrem toate accounts, nu transmitem account_id in query. sau transmitem valori falsy

    const acc = account_id === "total" ? null : account_id; //daca vrem sa stim totalul inlocuim cu null ca sa ia toate accounts in considereare

    const query = `SELECT amount, date, note, idincomes
                    FROM incomes i
                    JOIN accounts a ON a.idaccounts = i.account_id
                    WHERE (a.idaccounts = ? OR ? IS NULL) AND a.id_user = ?
                    ORDER BY date DESC;`;

    try {
        const result = await queryFunction(query, [acc, acc, userid]); //array de obiecte cu categoriile
        return res.status(200).json(result);
    } catch (err) {
        console.error("Eroare la executarea interogării:", err);
        return res.status(500).json({ message: "error at getting incomes records" });
    }

})

router.patch("/expenses/update/:idexpense", authenticateToken, async (req, res) => {

    const idexpense = parseInt(req.params.idexpense, 10);
    console.log(idexpense)
    const { date, amount, category, note, budget_id } = req.body;

    const query1 = `SELECT idcategories FROM categories WHERE category = ?;`;

    const query2 = `UPDATE expenses
                    SET category_id = ?, date = ?, amount = ?, note = ?, budget_id = ?
                    WHERE idexpenses = ?`

    try {
        const category_id = await queryFunction(query1, [category]); //cautam id-ul categorieib

        const [result1] = await queryFunction('SELECT account_id, amount FROM expenses WHERE idexpenses = ?', [idexpense]);
        const idAccount = result1.account_id; //luam id-account al acestui expense
        const oldValueExpense = result1.amount;

        const [result2] = await queryFunction('SELECT total FROM accounts WHERE idaccounts = ?', [idAccount]);
        const totalAccount = result2.total;

        const newTotalAccount = parseFloat(totalAccount) + parseFloat(oldValueExpense) - parseFloat(amount);

        if (parseFloat(totalAccount) + parseFloat(oldValueExpense) - parseFloat(amount) > 0) {
            const dateExtracted = date.split('T')[0];
            await queryFunction(query2, [category_id[0].idcategories, dateExtracted, amount, note, budget_id, idexpense]); //adaugam noul expense
            await queryFunction('UPDATE accounts SET total = ? WHERE idaccounts = ?', [newTotalAccount, idAccount]);
            res.status(200).json({ message: 'Expense updated successfully' });
        }
        else {
            console.log(parseFloat(totalAccount) + parseFloat(oldValueExpense) - parseFloat(amount))
            res.status(500).json({ message: 'Inssufficient funds!' });
        }

    } catch (err) {
        return res.status(500).json({ message: "error at updating expense record" });
    }

})

router.delete("/expenses/delete/:idexpense", authenticateToken, async (req, res) => {

    const idexpense = parseInt(req.params.idexpense, 10);

    const query1 = `DELETE FROM expenses WHERE idexpenses = ?;`;

    try {
        const [result1] = await queryFunction('SELECT account_id, amount FROM expenses WHERE idexpenses = ?', [idexpense]);
        const idAccount = result1.account_id; //luam id-account al acestui expense
        const oldValueExpense = result1.amount;

        const [result2] = await queryFunction('SELECT total FROM accounts WHERE idaccounts = ?', [idAccount]);
        const totalAccount = result2.total; //luam totalul din account

        const newTotalAccount = parseFloat(totalAccount) + parseFloat(oldValueExpense);

        await queryFunction(query1, [idexpense]);

        await queryFunction('UPDATE accounts SET total = ? WHERE idaccounts = ?', [newTotalAccount, idAccount]);
        res.status(200).json({ message: 'Expense updated successfully' });

    } catch (err) {
        console.error("Eroare la executarea interogării:", err);
        return res.status(500).json({ message: "error at deleting expense record" });
    }

});

router.patch("/incomes/update/:idincome", authenticateToken, async (req, res) => {

    const idincome = parseInt(req.params.idincome, 10);
    const { date, amount, note } = req.body;

    const query2 = `UPDATE incomes
                    SET date = ?, amount = ?, note = ?
                    WHERE idincomes = ?`

    try {
        const [result1] = await queryFunction('SELECT account_id, amount FROM incomes WHERE idincomes = ?', [idincome]);
        const idAccount = result1.account_id; //luam id-account al acestui income
        const oldValueIncome = result1.amount;

        const [result2] = await queryFunction('SELECT total FROM accounts WHERE idaccounts = ?', [idAccount]);
        const totalAccount = result2.total; //luam totalul din account

        const newTotalAccount = parseFloat(totalAccount) - parseFloat(oldValueIncome) + parseFloat(amount);

        await queryFunction('UPDATE accounts SET total = ? WHERE idaccounts = ?', [newTotalAccount, idAccount]);

        const dateExtracted = date.split('T')[0];
        await queryFunction(query2, [dateExtracted, amount, note, idincome]);
        res.status(200).json({ message: 'Income updated successfully' });
    } catch (err) {
        console.error("Eroare la executarea interogării:", err);
        return res.status(500).json({ message: "error at updating income record" });
    }

});

router.delete("/incomes/delete/:idincome", authenticateToken, async (req, res) => {

    const idincome = parseInt(req.params.idincome, 10);

    const query1 = `DELETE FROM incomes WHERE idincomes = ?;`;

    try {
        const [result1] = await queryFunction('SELECT account_id, amount FROM incomes WHERE idincomes = ?', [idincome]);
        const idAccount = result1.account_id; //luam id-account al acestui income
        const valueIncome = result1.amount;

        const [result2] = await queryFunction('SELECT total FROM accounts WHERE idaccounts = ?', [idAccount]);
        const totalAccount = result2.total; //luam totalul din account

        const newTotalAccount = parseFloat(totalAccount) - parseFloat(valueIncome);

        await queryFunction(query1, [idincome]);

        await queryFunction('UPDATE accounts SET total = ? WHERE idaccounts = ?', [newTotalAccount, idAccount]);
        res.status(200).json({ message: 'Income deleted successfully' });

    } catch (err) {
        console.error("Eroare la executarea interogării:", err);
        return res.status(500).json({ message: "error at deleting income record" });
    }

});

module.exports = router;