const express = require('express');
const app = express();
const router = express.Router();
const connection = require("../database");

const usefulFunctions = require("../utils");
const queryFunction = usefulFunctions.queryAsync;
const authenticateToken = usefulFunctions.authenticateToken;

app.use(express.urlencoded({ extended: false })); //se ocupa de procesarea datelor trimise in format formular html
app.use(express.json()); //conversie din JSON in obiecte js

//groups
const multer = require('multer')
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})
const upload = multer({ storage })

router.post('/addGroup', authenticateToken, upload.single('photo'), async (req, res) => {

    const imagePath = req?.file?.path;
    const { name } = req.body;
    const userId = req.user.userid;

    if (!name || !userId) {
        return res.status(400).json({ message: 'necessary fields null! name or userId missing' });
    };

    const date = new Date();
    const created_at = date.toISOString().split('T')[0];

    const query = 'INSERT INTO `group` (name, created_by, created_at, imagePath) VALUES (?, ?, ?, ?);'
    const data = [name, userId, created_at, imagePath];

    try {
        const result = await queryFunction(query, data);

        const query2 = 'INSERT INTO groups_members (group_id, user_id, joined_at) VALUES (?, ?, ?);'
        const groupId = result.insertId;
        const data2 = [groupId, userId, created_at];
        const result2 = await queryFunction(query2, data2);

        return res.status(200).json({ message: 'Group added successfully!' });
    } catch (err) {
        console.error("Eroare la executarea interogării:", err);
        return res.status(500).json({ message: "error at posting option" });
    }

});

router.post('/uploadAttachments', authenticateToken, upload.array('photos', 10), async (req, res) => {
    const files = req.files; // array de fișiere
    const { expenseId } = req.body;
    const userId = req.user.userid;
    console.log(files)

    if (!expenseId || !files || files.length === 0) {
        return res.status(400).json({ message: 'Missing expenseId or files' });
    }

    const uploadedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

    try {
        const insertPromises = files.map(file => {
            const fileUrl = file.path;
            const fileType = file.mimetype;

            const query = `
                INSERT INTO expense_attachments (expense_id, file_url, file_type, uploaded_at, id_user)
                VALUES (?, ?, ?, ?, ?)
            `;
            const values = [expenseId, fileUrl, fileType, uploadedAt, userId];
            return queryFunction(query, values);
        });

        await Promise.all(insertPromises);

        return res.status(200).json({ message: 'Files uploaded and saved successfully!' });
    } catch (err) {
        console.error("Error saving attachments:", err);
        return res.status(500).json({ message: "Failed to upload attachments." });
    }
});

router.get("/getImagesExpense/:idExpense", authenticateToken, async (req, res) => {

    const { idExpense } = req.params;

    if (!idExpense)
        return res.status(500).json({ message: "idExpense is null" });

    const query = `SELECT e.expense_id, e.file_url, e.id, u.name, e.uploaded_at, e.file_type
                    FROM expense_attachments e
                    JOIN users u ON e.id_user = u.idusers
                    WHERE expense_id = ? AND id_user;`;

    try {
        const result = await queryFunction(query, [idExpense]);
        return res.status(200).json(result);
    } catch (err) {
        return res.status(500).json({ message: "error at getting expense images" });
    }
});

router.delete("/deleteSharedExpense/:idExpense", authenticateToken, async (req, res) => {

    const idExpense = req.params.idExpense;

    const query = `DELETE FROM expense_shared WHERE id = ?`

    try {
        await queryFunction(query, [idExpense]);
        res.status(200).json({ message: 'Delete shared expense successfully' });

    } catch (err) {
        console.log("Eroare la executarea interogării:", err);
        return res.status(500).json({ message: "error at deleting shared expense" });
    }

});

router.get("/getGroups", authenticateToken, async (req, res) => {

    const userId = req.user.userid;

    if (!userId)
        return res.status(500).json({ message: "user id is null" });

    const query = 'SELECT g.id, g.name, g.created_by, g.created_at, g.imagePath, (SELECT COUNT(*) FROM groups_members gm2 WHERE gm2.group_id = g.id) AS members_count FROM `group` AS g JOIN groups_members AS gm ON gm.group_id = g.id WHERE gm.user_id = ? AND gm.left_at IS NULL GROUP BY group_id;; '

    try {
        const result = await queryFunction(query, [userId]);
        return res.status(200).json(result);
    } catch (err) {
        return res.status(500).json({ message: "error at getting groups" });
    }
});

router.get("/getMembers/:groupId", authenticateToken, async (req, res) => {

    const groupId = req.params.groupId;

    if (!groupId)
        return res.status(500).json({ message: "group id is null" });

    const query = `SELECT u.idusers, u.name, u.username
                  FROM users u
                  JOIN groups_members gm ON gm.user_id = u.idusers
                  WHERE gm.group_id = ? AND gm.left_at IS NULL`

    try {
        const result = await queryFunction(query, [groupId]);
        return res.status(200).json(result);
    } catch (err) {
        return res.status(500).json({ message: err });
    }
});

router.get("/getSharedExpenses/:groupId", authenticateToken, async (req, res) => {

    const groupId = req.params.groupId;
    const userId = req.user.userid;

    if (!groupId)
        return res.status(500).json({ message: "group id is null" });

    const query = `SELECT e.id, u.name, e.name AS expense_name, e.paid_by AS userId_paid_by, amount, split_type, note, created_at, es.is_paid
                  FROM expense_shared e
                  JOIN users u ON u.idusers = e.paid_by
                  JOIN expenses_split es ON es.expense_id = e.id
                  WHERE group_id = ? AND es.user_id = ?
                  ORDER BY created_at desc`

    try {
        const result = await queryFunction(query, [groupId, userId]);
        return res.status(200).json(result);
    } catch (err) {
        return res.status(500).json({ message: err });
    }
});

router.patch("/updatePaid/:expenseId", authenticateToken, async (req, res) => {

    const expenseId = req.params.expenseId;
    const userId = req.user.userid;
    const { is_paid } = req.body;

    if (!expenseId)
        return res.status(500).json({ message: "expenseId    is null" });

    const query = `UPDATE expenses_split SET is_paid = ? WHERE expense_id = ? AND user_id = ?`

    try {
        const result = await queryFunction(query, [is_paid, expenseId, userId]);
        return res.status(200).json(result);
    } catch (err) {
        return res.status(500).json({ message: err });
    }
});

router.get("/getGroupInfo/:groupId", authenticateToken, async (req, res) => {
    const groupId = req.params.groupId;

    if (!groupId)
        return res.status(400).json({ message: "Group ID is missing." });

    const query = `
        SELECT 
            u.idusers AS user_id,
            u.name,
            u.phone,
            gm.joined_at,
            gm.left_at,
            COALESCE(paid.total_paid, 0) AS total_paid,
            COALESCE(owed.total_owed, 0) AS total_owed
        FROM groups_members gm
        JOIN users u ON u.idusers = gm.user_id

        LEFT JOIN (
            SELECT paid_by, SUM(amount) AS total_paid
            FROM expense_shared
            WHERE group_id = ?
            GROUP BY paid_by
        ) AS paid ON paid.paid_by = u.idusers

        LEFT JOIN (
            SELECT es.user_id, SUM(es.owed_amount) AS total_owed
            FROM expenses_split es
            JOIN expense_shared sh ON sh.id = es.expense_id
            WHERE sh.group_id = ? AND is_paid = 0
            GROUP BY es.user_id
        ) AS owed ON owed.user_id = u.idusers

        WHERE gm.group_id = ?
    `;

    try {
        const result = await queryFunction(query, [groupId, groupId, groupId]);

        return res.status(200).json(result);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error", error: err });
    }
});

router.get("/getDetailsExpense/:idExpense", authenticateToken, async (req, res) => {
    const idExpense = req.params.idExpense;

    if (!idExpense) {
        return res.status(400).json({ message: "idExpense is null" });
    }

    try {
        // 1. Detalii despre cheltuiala
        const expenseQuery = `
            SELECT 
                e.id,
                e.name AS expense_name,
                e.amount,
                e.paid_by,
                u.name AS paid_by_name,
                e.split_type,
                e.note,
                e.created_at,
                e.reminder_date
            FROM expense_shared e
            JOIN users u ON u.idusers = e.paid_by
            WHERE e.id = ?
        `;
        const expenseResult = await queryFunction(expenseQuery, [idExpense]);

        if (expenseResult.length === 0) {
            return res.status(404).json({ message: "Expense not found" });
        }

        // 2. Split-ul cheltuielii
        const splitQuery = `
            SELECT 
                es.user_id,
                u.name AS user_name,
                es.owed_amount,
                es.is_paid
            FROM expenses_split es
            JOIN users u ON u.idusers = es.user_id
            WHERE es.expense_id = ?
        `;
        const splitResult = await queryFunction(splitQuery, [idExpense]);

        return res.status(200).json({
            expense: expenseResult[0],
            split: splitResult
        });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});


router.post('/addMember', authenticateToken, async (req, res) => {

    const { name, groupId } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'necessary fields null! missing groupId' });
    };

    const query1 = 'SELECT idusers FROM users WHERE username = ?;'
    const data1 = [name];

    try {
        //cautam id-ul userului cu usernameul cautat
        const result1 = await queryFunction(query1, data1);
        if (result1.length === 0) {
            return res.status(500).json({ message: 'This user does not exist!' });
        }
        const newMemberId = result1[0].idusers;

        //verificam daca userul nu este deja in grup
        const query = 'SELECT * FROM groups_members WHERE user_id = ? AND group_id = ?;'
        const data = [newMemberId, groupId];
        const result = await queryFunction(query, data);
        if (result.length > 0) {
            const existingMember = result[0];
            console.log(existingMember)

            if (!existingMember.left_at) {
                // utilizatorul este deja în grup
                return res.status(500).json({ message: 'This user is already added in the group!' });
            } else {
                // utilizatorul a fost în grup, dar a părăsit – îl reactivăm
                const queryUpdate = 'UPDATE groups_members SET left_at = NULL WHERE user_id = ? AND group_id = ?;';
                await queryFunction(queryUpdate, [newMemberId, groupId]);
                return res.status(200).json({ message: 'User was re-added to the group.' });
            }
        }


        //daca nu e in grup, il adaugam
        const date = new Date();
        const joined_at = date.toISOString().split('T')[0];
        const query2 = 'INSERT INTO `groups_members` (group_id, user_id, joined_at, left_at) VALUES (?, ?, ?, NULL);'
        const data2 = [groupId, newMemberId, joined_at];
        const result2 = await queryFunction(query2, data2);

        return res.status(200).json({ message: 'Member added successfully!' });
    } catch (err) {
        console.error("Eroare la executarea interogării:", err);
        return res.status(500).json({ message: "error at adding member" });
    }

});

const mysql = require('mysql2/promise');
require('dotenv').config();
const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
};
router.post('/addSharedExpense', authenticateToken, async (req, res) => {
    const { groupId, name, amount, paidBy, note, splitType, split, has_reminder, reminder_date } = req.body;
    const userId = req.user.userid;

    if (!groupId || !amount || !paidBy || !splitType) {
        return res.status(400).json({ message: 'Missing necessary fields!' });
    }

    const connection = await mysql.createConnection(config);
    await connection.beginTransaction();

    try {
        // 1. add main expense in expense_shared
        const [expenseResult] = await connection.execute(
            `INSERT INTO expense_shared (group_id, name, amount, paid_by, note, split_type, created_at, reminder_date, has_reminder)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
            [groupId, name, amount, paidBy, note || '', splitType, reminder_date, has_reminder]
        );

        const expenseId = expenseResult.insertId;

        // 2. add what each user owes in expense_split
        //acesta e cazul in care cheltuiala se imparte egal
        if (split.length === 0) {
            // cazul în care se împarte egal
            const [rows] = await connection.execute(
                `SELECT user_id FROM groups_members WHERE group_id = ? AND left_at IS NULL`,
                [groupId]
            );

            if (rows.length === 0) {
                return res.status(500).json({ message: 'No members in this group' });
            }

            const total = parseFloat(amount);
            const perUser = parseFloat((total / rows.length).toFixed(2));

            for (const row of rows) {
                await connection.execute(
                    `INSERT INTO expenses_split (expense_id, user_id, owed_amount)
                 VALUES (?, ?, ?)`,
                    [expenseId, row.user_id, perUser]
                );

                // marchează ca plătit dacă user-ul este cel care a plătit
                if (row.user_id == paidBy) {
                    await connection.execute(
                        `UPDATE expenses_split SET is_paid = TRUE WHERE user_id = ? AND expense_id = ?`,
                        [row.user_id, expenseId]
                    );
                }
            }
        } else {
            // cazul în care se împarte manual
            for (const item of split) {
                const { userId, amount } = item;
                await connection.execute(
                    `INSERT INTO expenses_split (expense_id, user_id, owed_amount)
                 VALUES (?, ?, ?)`,
                    [expenseId, userId, amount]
                );

                if (userId == paidBy) {
                    await connection.execute(
                        `UPDATE expenses_split SET is_paid = TRUE WHERE user_id = ? AND expense_id = ?`,
                        [userId, expenseId]
                    );
                }
            }
        }

        const [members] = await connection.execute(
            `SELECT u.expo_push_token 
            FROM groups_members gm
            JOIN users u ON gm.user_id = u.idusers
            WHERE gm.group_id = ? AND gm.user_id != ? AND u.expo_push_token IS NOT NULL`,
            [groupId, userId]
        );
        console.log("Push tokens:", members.map(m => m.expo_push_token));


        const [rows] = await connection.execute( //array de obiecte
            `SELECT name FROM users WHERE idusers = ?`,
            [userId]
        );

        const nameOfAuthor = rows[0]?.name;

        // 3. notificari push
        const messages = members.map(member => ({
            to: member.expo_push_token,
            sound: 'default',
            title: 'New Shared Expense',
            body: `${name} - ${amount} RON was added to your group by ${nameOfAuthor}.`,
            data: { groupId },
        }));

        if (messages.length > 0) {
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json', //Ce format de raspuns vrei de la server
                    'Accept-Encoding': 'gzip, deflate', //metode de compresie
                    'Content-Type': 'application/json', //ce tip de date trimiti către server
                },
                body: JSON.stringify(messages),
            });
            const responseData = await response.json();
            console.log('Push response:', responseData);
        }

        await connection.commit();
        res.status(201).json({ message: [members] });

    } catch (err) {
        await connection.rollback();
        res.status(500).json({ message: err });
    } finally {
        connection.end();
    }
});

router.post("/leaveGroup/:groupId", authenticateToken, async (req, res) => {

    const groupId = req.params.groupId;
    const userId = req.user.userid;

    const query = `UPDATE groups_members SET left_at = CURDATE() WHERE group_id = ? AND user_id = ?;`;

    try {
        await queryFunction(query, [groupId, userId]);
        res.status(200).json({ message: 'Left group successfully' });

    } catch (err) {
        console.log("Eroare la executarea interogării:", err);
        return res.status(500).json({ message: "error at leaving group" });
    }

});

router.delete("/deleteGroup/:groupId", authenticateToken, async (req, res) => {

    const groupId = req.params.groupId;
    const userId = req.user.userid;

    const query = `
    DELETE FROM \`group\`
    WHERE id = ?
        AND EXISTS (
        SELECT 1 FROM groups_members
        WHERE group_id = ?
            AND user_id = ?
        );
    `;
    try {
        await queryFunction(query, [groupId, groupId, userId]);
        res.status(200).json({ message: 'Delete group successfully' });

    } catch (err) {
        console.log("Eroare la executarea interogării:", err);
        return res.status(500).json({ message: "error at deleting group" });
    }

});

module.exports = router;