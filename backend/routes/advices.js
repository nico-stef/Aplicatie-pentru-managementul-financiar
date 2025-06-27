const express = require('express');
const app = express();
const router = express.Router();
const connection = require("../database");

const usefulFunctions = require("../utils");
const queryFunction = usefulFunctions.queryAsync;
const authenticateToken = usefulFunctions.authenticateToken;

app.use(express.urlencoded({ extended: false })); //se ocupa de procesarea datelor trimise in format formular html
app.use(express.json()); //conversie din JSON in obiecte js

//open ai api
const dotenv = require('dotenv');
const OpenAI = require('openai');
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_KEY,
});

console.log("api key: ", process.env.OPEN_AI_KEY)

function expandRecurringBudgets(budgets, currentDate = new Date()) {
    const result = [];

    budgets.forEach(budget => {
        const frequency = parseInt(budget.frequency);

        if (frequency === 1) {
            result.push({
                name: budget.name,
                amount: budget.amount,
                month: budget.month
            });
        } else if (frequency === 2) {
            const start = new Date(budget.month + '-02T00:00:00');
            const end = budget.endDate
                ? new Date(budget.endDate + '-02T00:00:00')
                : new Date(currentDate.getFullYear(), currentDate.getMonth(), 2);

            const temp = new Date(start);

            while (temp <= end) {
                const monthStr = temp.toISOString().slice(0, 7); // ex: 2025-05

                result.push({
                    name: budget.name,
                    amount: budget.amount,
                    month: monthStr
                });

                temp.setMonth(temp.getMonth() + 1);
            }
        }
    });

    return result;
}


router.get("/getAdvices", authenticateToken, async (req, res) => {
    const userId = req.user.userid;

    let { amount, months } = req.query;

    // transformă în numere dacă e necesar
    amount = parseFloat(amount);
    months = parseInt(months);

    const query = `SELECT SUM(amount) as income, DATE_FORMAT(i.date, '%Y-%m') AS monthIncome
                    FROM incomes i
                    JOIN accounts a ON a.idaccounts = i.account_id
                    WHERE a.id_user = ?  AND i.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
                    GROUP BY DATE_FORMAT(i.date, '%Y-%m');`;

    const queryExpensesCategories = `SELECT c.category, SUM(e.amount) AS total, DATE_FORMAT(e.date, '%Y-%m') AS monthExpenses
                    FROM expenses e
                    JOIN categories c ON c.idcategories = e.category_id
                    JOIN accounts a ON a.idaccounts = e.account_id
                    WHERE a.id_user = ? AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
                    GROUP BY c.category, DATE_FORMAT(e.date, '%Y-%m');`;

    const queryBudget = `SELECT b.name, b.amount, DATE_FORMAT(b.month, '%Y-%m') AS month, frequency, DATE_FORMAT(b.end_date, '%Y-%m') AS endDate
                        FROM budgets b
                        WHERE b.user_id = ?
                        AND (
                            (
                            b.frequency = 1 
                            AND b.month >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m-01')
                            )
                            OR
                            (
                            b.frequency = 2
                            AND (
                                b.end_date IS NULL OR b.end_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
                            )
                            AND b.month <= LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 0 MONTH))
                            )
                        );
                        `;

    const queryExpenses = `SELECT c.category, e.amount, e.date, e.note, b.name as budget_name
                    FROM expenses e
                    JOIN categories c ON c.idcategories = e.category_id
                    JOIN budgets b ON b.idbudgets = e.budget_id
                    JOIN accounts a ON a.idaccounts = e.account_id AND e.date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
                    WHERE a.id_user = ?;`;

    try {
        const result1 = await queryFunction(query, [userId]);
        const result2 = await queryFunction(queryExpensesCategories, [userId]);
        const result3 = await queryFunction(queryBudget, [userId]);
        const result4 = await queryFunction(queryExpenses, [userId]);
        const newBudgets = expandRecurringBudgets(result3);

        const dataToSend = JSON.stringify({
            incomes: result1,
            expenses: result2,
            budgets: result3,
            expenses: result4
        }, null, 2);

        const responseOpenAI = await openai.chat.completions.create({
            model: 'gpt-4-turbo',
            messages: [
                { role: 'system', content: 'Ești un asistent util.' },
                {
                    role: 'user',
                    content: `
                    Based on my financial data for the past 3 months, including my income patterns, fixed and flexible expenses, and current budgets, help me create a smart and realistic savings plan to accumulate ${amount} RON within the next ${months} months.

                    Please consider:
                    - at budgets 1 means it is established only in that month, 2 means recurrent. if it has an end date, the recurrency ended in that month.
                    - That my income varies month to month.
                    - Which expense categories are easiest to reduce without heavily affecting my lifestyle.
                    - Fixed expanes;
                    - Possible unexpected expenses that might occur.
                    - How to adjust the plan if my income is lower in any month.
                    -write in english

                    Provide a detailed and adaptive plan with concrete suggestions for each month, including how much I should save and from where, how to track my progress, and tips for staying on track. Avoid simplistic fixed division of the total amount.

                    Also, propose a spending plan for the next month based on my habits, highlighting priorities to balance spending and saving effectively.

DO NOT use Markdown formatting (e.g. no "**", no headers like ###, no bold text). Only use plain text.
DO NOT mention budgeting apps.

FORMATTING RULES:
- Use numbered points for monthly plans. Example: "1. Month 1: ..."
- Use bullet points for categories to cut down. Example:
  1. Entertainment: ...
  2. Travel: ...
- Separate each paragraph with TWO newline characters (\\n\\n).
- Do NOT use asterisks or symbols for emphasis.
- Do NOT use headers or section titles in Markdown.
- Keep the structure clean, plain, and readable. The output will be split using "\\n\\n", so avoid any visual clutter or nested formatting.

Here is the data: ${dataToSend}
      `
                }
            ],
        });

        console.log(responseOpenAI.choices[0].message.content)
        return res.status(200).json(responseOpenAI.choices[0].message.content);
        // return res.status(200).json({ incomes: result1, expenses: result2, budgets: newBudgets, expenses: result4 });
    } catch (err) {
        console.error("Eroare la executarea interogării:", err);
        return res.status(500).json({ message: "error at getting objectives" });
    }

});

module.exports = router;