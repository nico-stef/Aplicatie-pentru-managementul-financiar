require('dotenv').config();
const mysql = require('mysql2')

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

connection.connect(function(err) {
    if (err) {
        console.log("Eroare la conectare la baza de date");
    } else {
        console.log("Conectarea la baza de date MySQL a fost realizata cu succes");
    }
});

module.exports = connection;