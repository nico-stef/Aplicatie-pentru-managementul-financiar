const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
const router = express.Router();

// Servește fișierele statice din public/
app.use(express.static('public'));

// Multer setup
const upload = multer({ dest: 'uploads/' });

const usefulFunctions = require("../utils");
const queryFunction = usefulFunctions.queryAsync;

//pentru tranzactii
const mysql = require('mysql2/promise');
require('dotenv').config();
const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
};


const categorii = [
    {
        nume: 'food',
        cuvinteCheie: [
            'lidl', 'profi', 'auchan', 'carrefour', 'kaufland', 'mega image', 'penny', 'selgros', 'supeco', 'spar', 'minna', 'food'
        ]
    },
    {
        nume: 'transportation',
        cuvinteCheie: ['uber', 'bolt', 'taxi', 'autobuz', 'tramvai', 'metrorex']
    },
    {
        nume: 'car maintenance',
        cuvinteCheie: ['petrom', 'mol', 'omv', 'lukoil', 'rompetrol', 'benzinarie', 'service auto', 'vulcanizare', 'itp']
    },
    {
        nume: 'entertainment',
        cuvinteCheie: ['youtube', 'spotify', 'netflix', 'cinema', 'hbo', 'disney', 'jumbo', 'pepco']
    },
    {
        nume: 'other',
        cuvinteCheie: ['transfer', 'cont propriu', 'raiffeisen', 'banca']
    },
    {
        nume: 'personal care',
        cuvinteCheie: ['emag', 'fashion', 'h&m', 'zara', 'sephora', 'notino', 'douglas', 'dm', 'drogerie']
    },
    {
        nume: 'travel',
        cuvinteCheie: ['airbnb', 'booking', 'hotel', 'wizzair', 'ryanair', 'bilete avion']
    },
    {
        nume: 'health',
        cuvinteCheie: ['farmacie', 'medic', 'clinica', 'analize', 'dentist', 'drm']
    },
    {
        nume: 'education',
        cuvinteCheie: ['alumniversum', 'curs', 'udemy', 'elearning', 'scoala', 'manuale', 'carturesti']
    },
    {
        nume: 'other',
        cuvinteCheie: []
    }
];

function determinaCategoria(detalii) {
    const text = detalii.toLowerCase();
    for (const cat of categorii) {
        if (cat.cuvinteCheie.some(cuv => text.includes(cuv))) {
            return cat.nume;
        }
    }
    return 'other';
}
function formatDate(dateString) {

    const [day, month, year] = dateString.split('.');
    return `${year}-${month}-${day}`;
}

function formatDateBRD(dateString) {

    const [day, month, year] = dateString.split('/');
    return `${year}-${month}-${day}`;
}

const PDFParser = require('pdf2json');

function esteNumarValid(amount) {
    return /^\d+(,\d{3})*(\.\d{2})$|^\d+(\.\d{2})$/.test(amount);
}

function esteNumarValidBRD(text) {
    return /^\d{1,3}(\.\d{3})*,\d{2}$/.test(text);
}


function esteDataValida(data) {
    return /^\d{2}\.\d{2}\.\d{4}$|^\d{2}\/\d{2}\/\d{4}$/.test(data);
}

const IGNORE_TEXTS = [
    'Descrierea tranzac]iei',
    'Data tranzac]iei',
    'Sediul in Cl',
    'Raiffeisen Bank S.A.',
];


router.post('/extrasPDF_Raiffeisen', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Fișierul PDF lipsește' });
    }

    const filePath = req.file.path;
    const accountId = req.body.account_id;

    const parser = new PDFParser();
    let sumExpenses = 0;
    let sumIncomes = 0;

    parser.on('pdfParser_dataReady', async (pdfData) => {

        const transactions = [];
        const pages = pdfData.Pages;
        let currentTransaction = null;
        let detailBuffer = '';

        pages.forEach((page) => {
            page.Texts.forEach((textElement) => {
                const x = textElement.x;
                const y = textElement.y;
                //textul din document este stocat în format URL-encoded, adică fiecare caracter special (spații, diacritice, semne de punctuație etc.) este înlocuit cu un cod procentual
                const text = decodeURIComponent(textElement.R[0].T);

                console.log(x, " ", y, text)

                const COLUMN_RANGES = {
                    dataTranzactieRange: [0, 4],
                    debitRange: [25, 29.5],
                    creditRange: [30, 34]
                };

                if (x >= COLUMN_RANGES.dataTranzactieRange[0] && x <= COLUMN_RANGES.dataTranzactieRange[1]) {
                    // salvam tranzactia daca e completa
                    if (currentTransaction && currentTransaction.amount && currentTransaction.type && currentTransaction.dataTranzactie) {
                        currentTransaction.details = detailBuffer.trim(); //trebuie sa eliminam spatiile albe pt ca metode toLowerCase nu functioneaza pe ele

                        const alreadyExists = transactions.some(t => //stergem dublurile, vedem daca vreo tranzactie deja inregistrata e egala cu currentTransaction
                            t.dataTranzactie === currentTransaction.dataTranzactie &&
                            t.amount === currentTransaction.amount &&
                            t.type === currentTransaction.type &&
                            t.details === currentTransaction.details
                        );

                        if (!alreadyExists) {
                            transactions.push(currentTransaction); //daca nu mai exista deja inregistrarea, o adaugam
                        }
                    }

                    // incepe tranzactia noua daca gasim o data valida
                    if (esteDataValida(text)) {
                        currentTransaction = { dataTranzactie: formatDate(text) };
                        detailBuffer = '';
                    }
                } else if (x >= COLUMN_RANGES.creditRange[0] && x <= COLUMN_RANGES.creditRange[1]) {
                    if (esteNumarValid(text)) {
                        if (currentTransaction) {
                            currentTransaction.type = 'credit';
                            currentTransaction.amount = parseFloat(text.replace(/,/g, ''));
                        }
                    }
                } else if (x >= COLUMN_RANGES.debitRange[0] && x <= COLUMN_RANGES.debitRange[1]) {
                    if (esteNumarValid(text)) {
                        if (currentTransaction) {
                            currentTransaction.type = 'debit';
                            currentTransaction.amount = parseFloat(text.replace(/,/g, '')); // la raiffeisen sumele mai mari de 1000 au 1,200.34, si ca sa functioneze parsefloat trebuie sa elimin ,
                        }                                                                  //g- global, cautam toate aparitiile virgulei

                    }
                } else {
                    // Dacă nu e dată sau sumă, îl tratăm ca detaliu
                    if (!IGNORE_TEXTS.some(fragment => text.includes(fragment))) {//cautam in text daca exista fragment(un element din IGNORE_TEXTS)
                        detailBuffer += text + ' ';
                    }

                }
            });
        });

        transactions.forEach(record => record.category = determinaCategoria(record.details)); //adaugam si categorie la inregistrari

        //tranzactie pt ca daca suma din accounts nu este suficienta, eliminam inregistrarile din expenses/incomes
        const connection = await mysql.createConnection(config);
        try {
            await connection.beginTransaction();

            const queryExpense = `INSERT INTO expenses (amount, date, account_id, category_id)
                                  VALUES(?, ?, ?, (SELECT idcategories FROM categories WHERE category = ? LIMIT 1));`;
            const queryIncome = `INSERT INTO incomes (amount, date, account_id) VALUES(?, ?, ?);`;

            let sumExpenses = 0;
            let sumIncomes = 0;

            for (let i = 0; i < transactions.length; i++) {
                const { type, amount, dataTranzactie, category } = transactions[i];

                if (type === 'debit') {
                    sumExpenses += amount;
                    await connection.execute(queryExpense, [amount, dataTranzactie, accountId, category]);
                } else {
                    sumIncomes += amount;
                    await connection.execute(queryIncome, [amount, dataTranzactie, accountId]);
                }
            }

            const [[result]] = await connection.query('SELECT total FROM accounts WHERE idaccounts = ?', [accountId]);
            const currentTotal = parseFloat(result.total);

            const newTotal = Math.round((currentTotal - sumExpenses + sumIncomes) * 100) / 100;

            if (newTotal < 0) {
                await connection.rollback();
                await connection.end();
                return res.status(400).json("Insufficient funds: this transaction would result in a negative account balance.");
            }

            await connection.query('UPDATE accounts SET total = ? WHERE idaccounts = ?', [newTotal, accountId]);
            await connection.commit();
            await connection.end();

            return res.status(200).json("Transaction completed successfully.");
        } catch (err) {
            await connection.rollback();
            await connection.end();
            return res.status(500).json({ error: "Transaction failed", details: err.message });
        }

    });

    parser.on("pdfParser_dataError", (errData) => {
        console.error(errData.parserError);
        res.status(500).json({ error: 'Eroare la procesarea fișierului PDF' });
    });

    parser.loadPDF(filePath);
});

router.post('/extrasPDF_BRD', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Fișierul PDF lipsește' });
    }

    const filePath = req.file.path;
    const accountId = req.body.account_id;

    const parser = new PDFParser();
    let sumExpenses = 0;
    let sumIncomes = 0;

    parser.on('pdfParser_dataReady', async (pdfData) => {

        const transactions = [];
        const pages = pdfData.Pages;
        let currentTransaction = null;
        let detailBuffer = '';

        let pendingAmount = null;
        let pendingType = null;
        let pendingDetails = '';

        pages.forEach((page) => {
            page.Texts.forEach((textElement) => {
                const x = textElement.x;
                const text = decodeURIComponent(textElement.R[0].T);
                const y = textElement.y;

                const COLUMN_RANGES = {
                    dataTranzactieRange: [0, 3],
                    debitRange: [20, 27],
                    creditRange: [28, 31],
                    dataDecontareRange: [31, 40],
                };

                if (x >= COLUMN_RANGES.creditRange[0] && x <= COLUMN_RANGES.creditRange[1]) {
                    if (esteNumarValidBRD(text)) {
                        pendingAmount = parseFloat(text.replace(/\./g, '').replace(',', '.'));
                        pendingType = 'credit';
                        pendingDetails = '';
                    }
                } else if (x >= COLUMN_RANGES.debitRange[0] && x <= COLUMN_RANGES.debitRange[1]) {
                    if (esteNumarValidBRD(text)) {
                        pendingAmount = parseFloat(text.replace(/\./g, '').replace(',', '.'));
                        pendingType = 'debit';
                        pendingDetails = '';
                    }
                } else if (x >= COLUMN_RANGES.dataTranzactieRange[0] && x <= COLUMN_RANGES.dataTranzactieRange[1]) {
                    if (esteDataValida(text)) {
                        if (pendingAmount && pendingType) {
                            currentTransaction = {
                                dataTranzactie: formatDateBRD(text),
                                amount: pendingAmount,
                                type: pendingType,
                                details: pendingDetails.trim()
                            };
                            pendingAmount = null;
                            pendingType = null;
                            pendingDetails = '';
                        }
                    }
                } else if (x >= COLUMN_RANGES.dataDecontareRange[0] && x <= COLUMN_RANGES.dataDecontareRange[1]) {
                    if (esteDataValida(text) && currentTransaction) {
                        currentTransaction.dataDecontare = formatDateBRD(text);
                    }
                } else {
                    // Adăugăm în bufferul de detalii
                    pendingDetails += text + ' ';
                }

                // Verificare finală dacă tranzacția e completă
                if (currentTransaction &&
                    currentTransaction.amount &&
                    currentTransaction.type &&
                    currentTransaction.dataTranzactie &&
                    currentTransaction.dataDecontare
                ) {
                    const alreadyExists = transactions.some(t =>
                        t.dataTranzactie === currentTransaction.dataTranzactie &&
                        t.amount === currentTransaction.amount &&
                        t.type === currentTransaction.type &&
                        t.details === currentTransaction.details &&
                        t.dataDecontare === currentTransaction.dataDecontare
                    );

                    if (!alreadyExists) {
                        transactions.push(currentTransaction);
                    }

                    currentTransaction = null;
                }
            });
        });

        transactions.forEach(record => record.category = determinaCategoria(record.details)); //adaugam si categorie la inregistrari

        //tranzactie pt ca daca suma din accounts nu este suficienta, eliminam inregistrarile din expenses/incomes
        const connection = await mysql.createConnection(config);
        try {
            await connection.beginTransaction();

            const queryExpense = `INSERT INTO expenses (amount, date, account_id, category_id)
                                  VALUES(?, ?, ?, (SELECT idcategories FROM categories WHERE category = ? LIMIT 1));`;
            const queryIncome = `INSERT INTO incomes (amount, date, account_id) VALUES(?, ?, ?);`;

            let sumExpenses = 0;
            let sumIncomes = 0;

            for (let i = 0; i < transactions.length; i++) {
                const { type, amount, dataTranzactie, category } = transactions[i];

                if (type === 'debit') {
                    sumExpenses += amount;
                    await connection.execute(queryExpense, [amount, dataTranzactie, accountId, category]);
                } else {
                    sumIncomes += amount;
                    await connection.execute(queryIncome, [amount, dataTranzactie, accountId]);
                }
            }

            const [[result]] = await connection.query('SELECT total FROM accounts WHERE idaccounts = ?', [accountId]);
            const currentTotal = parseFloat(result.total);

            const newTotal = parseFloat(currentTotal) - parseFloat(sumExpenses.toFixed(2)) + parseFloat(sumIncomes.toFixed(2));

            if (newTotal < 0) {
                await connection.rollback();
                await connection.end();
                return res.status(400).json("Insufficient funds: this transaction would result in a negative account balance.");
            }

            await connection.query('UPDATE accounts SET total = ? WHERE idaccounts = ?', [newTotal, accountId]);
            await connection.commit();
            await connection.end();

            return res.status(200).json("Transaction completed successfully.");
        } catch (err) {
            await connection.rollback();
            await connection.end();
            return res.status(500).json({ error: "Transaction failed", details: err.message });
        }
    });

    parser.on("pdfParser_dataError", (errData) => {
        console.error(errData.parserError);
        res.status(500).json({ error: 'Eroare la procesarea fișierului PDF' });
    });

    parser.loadPDF(filePath);
});


module.exports = router;
