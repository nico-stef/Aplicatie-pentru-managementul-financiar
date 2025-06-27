const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const router = express.Router();

const app = express();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const usefulFunctions = require("../utils");
const queryFunction = usefulFunctions.queryAsync;

const categorii = [
  {
    nume: 'food',
    cuvinteCheie: [
      'lidl', 'profi', 'auchan', 'carrefour', 'kaufland', 'mega image', 'penny', 'selgros', 'cora', 'billa', 'dm drogerie', 'supeco', 'spar'
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
    cuvinteCheie: ['youtube', 'spotify', 'netflix', 'cinema', 'hbo', 'disney']
  },
  {
    nume: 'other',
    cuvinteCheie: ['transfer', 'cont propriu', 'raiffeisen', 'banca']
  },
  {
    nume: 'personal care',
    cuvinteCheie: ['emag', 'fashion', 'h&m', 'zara', 'sephora', 'notino', 'douglas']
  },
  {
    nume: 'travel',
    cuvinteCheie: ['airbnb', 'booking', 'hotel', 'wizzair', 'ryanair', 'bilete avion']
  },
  {
    nume: 'health',
    cuvinteCheie: ['farmacie', 'medic', 'clinica', 'analize', 'dentist']
  },
  {
    nume: 'education',
    cuvinteCheie: ['alumniversum', 'curs', 'udemy', 'elearning', 'scoala', 'manuale']
  },
  {
    nume: 'other',
    cuvinteCheie: []
  }
];

function ExcelDateToISOString(serial) {
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const jsDate = new Date(excelEpoch.getTime() + serial * 86400 * 1000);
  const date = jsDate.toISOString(); // returnează stringul gen "2025-11-03T22:00:24.000Z"
  const datePart = date.split('T')[0];

  return datePart;
}


function isValidDateFormat(value) {
  if (Number.isFinite(value)) {
    value = ExcelDateToISOString(value);

  }
  console.log(value)
  const dateRegex = /^(?:\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})$/;
  return dateRegex.test(value);
}

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
  if (Number.isFinite(dateString)) {
    dateString = ExcelDateToISOString(dateString);
  }
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }

  const [day, month, year] = dateString.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}


router.post('/tranzactiiExtrasCSV', upload.single('file'), async (req, res) => {
  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    const accountId = req.body.account_id;

    let results = [];
    let startParsing = false;

    jsonData.forEach((row, index) => {
      if (!startParsing && row[0] === 'Data inregistrare') {
        startParsing = true;
        return;
      }

      if (startParsing && row[0]) {
        if (!isValidDateFormat(row[0]))
          return;
        results.push({
          ceva: row[0],
          dataTranzactie: row[1],
          debit: parseFloat(row[2]),
          credit: parseFloat(row[3]),
          detalii: row[11],
          categorie: determinaCategoria(row[11])
        });
      }
    });

    queryExpense = `INSERT INTO expenses (amount, date, account_id, category_id) VALUES(?, ?, ?, (SELECT idcategories FROM categories WHERE category = ? LIMIT 1));`
    queryIncome = `INSERT INTO incomes (amount, date, account_id) VALUES(?, ?, ?);`
    for (i = 0; i < results.length - 1; i++)
      if (!isNaN(results[i].debit)) {
        const amount = results[i].debit;
        const date = formatDate(results[i].dataTranzactie);
        const category = results[i].categorie;
        // await queryFunction(queryExpense, [amount, date, accountId, category]);
      } else {
        const amount = results[i].credit;
        const date = formatDate(results[i].dataTranzactie);
        // await queryFunction(queryIncome, [amount, date, accountId]);
      }

    console.log(results)
    console.log("lungime", results.length)
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

module.exports = router;
