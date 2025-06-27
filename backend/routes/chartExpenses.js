const express = require('express');
const app = express();
const router = express.Router();
const connection = require("../database");

const usefulFunctions = require("../utils");
const queryFunction = usefulFunctions.queryAsync;

app.use(express.urlencoded({ extended: false })); //se ocupa de procesarea datelor trimise in format formular html
app.use(express.json()); //conversie din JSON in obiecte js

router.get("/getExpensesPerCateogory", async (req, res) => {

    const { date, account_id, week_start, week_end, period, month, year, id_user } = req.query;
    const acc = account_id == 'total' ? null : account_id; //daca vrem sa stim totalul inlocuim cu null ca sa ia toate accounts in considereare

    const queryToday = `SELECT c.category, SUM(e.amount) AS total 
                    FROM expenses e
                    JOIN categories c ON c.idcategories = e.category_id
                    JOIN accounts a ON a.idaccounts = e.account_id
                    WHERE e.date = ? AND a.id_user = ?
                    GROUP BY c.category;`;

    const queryDay = `SELECT c.category, SUM(e.amount) AS total 
                    FROM expenses e
                    JOIN categories c ON c.idcategories = e.category_id
                    JOIN accounts a ON a.idaccounts = e.account_id
                    WHERE e.date = ? AND a.id_user = ? AND (a.idaccounts = ? OR ? IS NULL)
                    GROUP BY c.category;`;

    const queryWeek = `SELECT c.category, SUM(e.amount) AS total 
                    FROM expenses e
                    JOIN categories c ON c.idcategories = e.category_id
                    JOIN accounts a ON a.idaccounts = e.account_id
                    WHERE e.date >= ? AND e.date <= ? AND a.id_user = ? AND (a.idaccounts = ? OR (? IS NULL))
                    GROUP BY c.category;`;

    const queryMonth = `SELECT c.category, SUM(e.amount) AS total 
                    FROM expenses e
                    JOIN categories c ON c.idcategories = e.category_id
                    JOIN accounts a ON a.idaccounts = e.account_id
                    WHERE MONTH(e.date) = ? AND YEAR(e.date) = ? AND a.id_user = ? AND (a.idaccounts = ? OR ? IS NULL)
                    GROUP BY c.category;`;

    const queryYear = `SELECT c.category, SUM(e.amount) AS total 
                    FROM expenses e
                    JOIN categories c ON c.idcategories = e.category_id
                    JOIN accounts a ON a.idaccounts = e.account_id
                    WHERE YEAR(e.date) = ? AND a.id_user = ? AND (a.idaccounts = ? OR ? IS NULL)
                    GROUP BY c.category;`;

    try {
        switch (period) {
            case "today":
                const resultToday = await queryFunction(queryDay, [date, id_user, acc, acc]); //array de obiecte cu categoriile
                return res.status(200).json(resultToday);
            case "day":
                const resultDay = await queryFunction(queryDay, [date, id_user, acc, acc]); //array de obiecte cu categoriile
                return res.status(200).json(resultDay);
            case "week":
                const resultWeek = await queryFunction(queryWeek, [week_start, week_end, id_user, acc, acc]);
                return res.status(200).json(resultWeek);
            case "month":
                const resultMonth = await queryFunction(queryMonth, [month, year, id_user, acc, acc]);
                return res.status(200).json(resultMonth);
            case "year":
                const resultYear = await queryFunction(queryYear, [year, id_user, acc, acc]);
                return res.status(200).json(resultYear);
        }

    } catch (err) {
        console.error("Eroare la executarea interogării:", err);
        return res.status(500).json({ message: "error at getting expenses" });
    }

});

function generateTendenciesMessages(data) {

    if (!Array.isArray(data) || data.length < 2) {
        return [`Add more expenses over time to get personalized tips :)`];
    }

    const parsedData = data.map(d => ({
        ...d,
        total: parseFloat(d.total)
    }));

    const values = parsedData.map(d => d.total);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);

    let maxMonth = parsedData.find(d => d.total === maxVal)?.month;
    let minMonth = parsedData.find(d => d.total === minVal)?.month;

    let lastMonth = parsedData[parsedData.length - 1];
    let prevMonth = parsedData[parsedData.length - 2];

    const messages = [];
    console.log("average is: ", avg, maxVal)

    // Insights
    if (lastMonth.total < avg * 0.5) {
        messages.push("You spent significantly less than your average last month. Great job staying frugal!");
    } else if (lastMonth.total > avg * 1.5) {
        messages.push("Your spending last month was much higher than usual. Review your expenses.");
    }

    // compare last two months
    if (lastMonth.total > prevMonth.total) {
        messages.push("Your spending increased compared to the previous month.");
    } else if (lastMonth.total < prevMonth.total) {
        messages.push("Your spending decreased compared to the previous month.");
    } else {
        messages.push("Your spending remained the same as the previous month.");
    }

    // Advice
    if (maxVal > avg * 2) {
        messages.push(`You had a significant spike in ${maxMonth}. Check for unusual or one-time expenses.`);
    }

    maxMonth = maxMonth + "-01";
    maxMonth = new Date(maxMonth);
    minMonth = minMonth + "-01";
    minMonth = new Date(minMonth);

    messages.push(`Your highest spending was in ${maxMonth.toLocaleString("en-US", { month: "long" })} ${maxMonth.getFullYear()}, with ${maxVal.toFixed(2)} RON.`);
    messages.push(`Your lowest spending was in ${minMonth.toLocaleString("en-US", { month: "long" })} ${minMonth.getFullYear()}, with ${minVal.toFixed(2)} RON.`);
    messages.push(`Your average monthly spending is ${avg.toFixed(2)} RON.`);

    return messages;
}


router.get("/getExpenseTendencies/:userId", async (req, res) => {

    const { userId } = req.params;

    const query = `SELECT DATE_FORMAT(e.date, '%Y-%m') AS month, SUM(e.amount) AS total 
                    FROM expenses e
                    JOIN accounts a ON a.idaccounts = e.account_id
                    WHERE a.id_user = ? AND e.date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                    GROUP BY month
                    ORDER BY month;`;

    try {
        const result = await queryFunction(query, [userId]); //array de obiecte
        let messages = '';
        if (result)
            messages = generateTendenciesMessages(result);
        console.log(messages)
        return res.status(200).json({ result: result, messages: messages });

    } catch (err) {
        console.error("Eroare la executarea interogării:", err);
        return res.status(500).json({ message: "error at getting expense tendencies" });
    }

});

function generateBudgetAdvice(data) {
    const { expensesMonthly, adjustedBudgets } = data;
    if(expensesMonthly.length === 0)
        return ["You haven't added any expenses in the past 6 months. Start tracking your spending to get insights."];
    if(adjustedBudgets.length === 0)
        return ["You haven't set any budgets yet. Set monthly budgets to better understand and control your expenses."];

    const expensesMap = Object.fromEntries(
        expensesMonthly.map(e => [e.month, parseFloat(e.totalSpent)])
    );

    const budgetsMap = Object.fromEntries(
        adjustedBudgets.map(b => [b.month, parseFloat(b.total_budget)])
    );

    const messages = [];

    for (const month of Object.keys(expensesMap)) {
        if (budgetsMap[month]) {
            const spent = expensesMap[month];
            const budget = budgetsMap[month];
            const percent = (spent / budget) * 100;

            const date = new Date(month + "-01");
            const label = date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

            if (percent < 50) {
                messages.push(`In ${label}, you spent only ${percent.toFixed(1)}% of your budget. Great job staying frugal!`);
            } else if (percent >= 50 && percent <= 100) {
                messages.push(`In ${label}, you used ${percent.toFixed(1)}% of your budget. You're staying within your limits.`);
            } else {
                messages.push(`In ${label}, you exceeded your budget by spending ${percent.toFixed(1)}%. Consider reviewing your expenses.`);
            }
        }
    }

    if (messages.length === 0) {
        messages.push("Not enough data to generate insights. Please add budgets and expenses to get personalized advice.");
    }

    return messages;
}


router.get("/budgetComparisson/:userId", async (req, res) => {

    const { userId } = req.params;

    const query = `SELECT DATE_FORMAT(e.date, '%Y-%m') AS month, SUM(e.amount) AS totalSpent
                    FROM expenses e
                    JOIN budgets b ON b.idbudgets = e.budget_id
                    WHERE b.user_id = ? AND e.date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) AND DATE_FORMAT(e.date, '%Y-%m') = DATE_FORMAT(b.month, '%Y-%m')
                    GROUP BY DATE_FORMAT(e.date, '%Y-%m')
                    ORDER BY month;`;

    const query2 = `SELECT DATE_FORMAT(month, '%Y-%m') AS monthBudget, SUM(amount) AS total_budget
                    FROM budgets
                    WHERE user_id = ? AND frequency != 2
                    AND month >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                    GROUP BY monthBudget
                  `;

    const query3 = `SELECT SUM(amount) AS recurring_total
                    FROM budgets
                    WHERE user_id = ? AND frequency = 2`;

    try {
        const expensesMonthly = await queryFunction(query, [userId]);

        const monthlyBudgets = await queryFunction(query2, [userId]);

        const recurringTotal = await queryFunction(query3, [userId]);


        const recurringSum = recurringTotal[0].recurring_total || 0;

        const adjustedBudgets = monthlyBudgets.map(b => ({
            month: b.monthBudget,
            total_budget: parseFloat(b.total_budget) + parseFloat(recurringSum)
        }));

        const messages = generateBudgetAdvice({expensesMonthly, adjustedBudgets});
        console.log(expensesMonthly, adjustedBudgets);

        return res.status(200).json({ expensesMonthly, adjustedBudgets, messages: messages });

    } catch (err) {
        console.error("Eroare la executarea interogării:", err);
        return res.status(500).json({ message: "error at getting budget comparisson data" });
    }

});

module.exports = router;