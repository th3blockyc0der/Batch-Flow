const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.db", (err) => {

  if(err){
    console.error(err.message);
  }else{
    console.log("Connected to SQLite database.");
  }

});

/* =========================
   CREATE TABLES
========================= */

db.serialize(() => {

  /* USERS */

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      password TEXT,
      role TEXT
    )
  `);

  /* PRODUCTS */

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      price REAL,
      stock INTEGER,
      delivery_date TEXT,
      delivery_receipt TEXT,
      expiry_date TEXT
    )
  `);

  /* SALES */

  db.run(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      items TEXT,
      total REAL,
      cashier TEXT,
      date TEXT
    )
  `);

});

/* =========================
   DEFAULT USERS
========================= */

db.get(
  `SELECT COUNT(*) AS count FROM users`,
  (err,row) => {

    if(row.count === 0){

      db.run(`
        INSERT INTO users
        (username,password,role)

        VALUES

        ('Jasmine','V9llester0s','Admin'),
        ('Kate','1905','Cashier')
      `);

      console.log("Default users inserted.");
    }

  }
);

module.exports = db;