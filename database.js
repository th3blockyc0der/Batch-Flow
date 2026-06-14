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

    barcode TEXT,

    category_id INTEGER,
    supplier_id INTEGER,

    delivery_date TEXT,
    delivery_receipt TEXT,
    expiry_date TEXT,

    FOREIGN KEY(category_id)
      REFERENCES categories(id),

    FOREIGN KEY(supplier_id)
      REFERENCES suppliers(id)
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

  /* CATEGORIES */

db.run(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  )
`);

/* SUPPLIERS */

db.run(`
  CREATE TABLE IF NOT EXISTS suppliers (

    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT

  )
`, (err) => {

  if(err){

    console.log(err.message);

  }else{

    console.log(
      "Suppliers table ready"
    );

  }

});

/* DELIVERIES */

db.run(`
  CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    supplier_id INTEGER,
    quantity INTEGER,
    delivery_date TEXT,
    delivery_receipt TEXT,
    expiry_date TEXT,

    FOREIGN KEY(product_id)
      REFERENCES products(id),

    FOREIGN KEY(supplier_id)
      REFERENCES suppliers(id)
  )
`);

/* INVENTORY LOGS */

db.run(`
  CREATE TABLE IF NOT EXISTS inventory_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    action TEXT,
    quantity INTEGER,
    username TEXT,
    date TEXT,

    FOREIGN KEY(product_id)
      REFERENCES products(id)
  )
`);

/* EXPENSES */

db.run(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    amount REAL,
    category TEXT,
    date TEXT
  )
`);

/* RETURNS */

db.run(`
  CREATE TABLE IF NOT EXISTS returns_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    reason TEXT,
    date TEXT,

    FOREIGN KEY(product_id)
      REFERENCES products(id),

    FOREIGN KEY(sale_id)
      REFERENCES sales(id)
  )
`);

/* ACTIVITY LOGS */

db.run(`
  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    action TEXT,
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

        ('My admin','V9llester0s','Admin'),
        ('cash grabber 43','1905','Cashier')
      `);

      console.log("Default users inserted.");
    }

  }
);

module.exports = db;