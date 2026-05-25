const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   LOGIN
========================= */

app.post("/login", (req,res) => {

  const {
    username,
    password,
    role
  } = req.body;

  db.get(
    `
    SELECT * FROM users
    WHERE username = ?
    AND password = ?
    AND role = ?
    `,
    [username,password,role],
    (err,row) => {

      if(err){
        return res.status(500).json(err);
      }

      if(!row){
        return res.status(401).json({
          message:"Invalid credentials"
        });
      }

      res.json(row);

    }
  );

});

/* =========================
   GET PRODUCTS
========================= */

app.get("/products", (req,res) => {

  db.all(
    `SELECT * FROM products`,
    [],
    (err,rows) => {

      if(err){
        return res.status(500).json(err);
      }

      res.json(rows);

    }
  );

});

/* =========================
   GET USERS
========================= */

app.get("/users", (req,res) => {

  db.all(
    `SELECT * FROM users`,
    [],
    (err,rows) => {

      if(err){
        return res.status(500).json(err);
      }

      res.json(rows);

    }
  );

});

/* =========================
   ADD USER
========================= */

app.post("/users", (req,res) => {

  const {
    username,
    password,
    role
  } = req.body;

  db.run(
    `
    INSERT INTO users (
      username,
      password,
      role
    )

    VALUES (?,?,?)
    `,
    [
      username,
      password,
      role
    ],
    function(err){

      if(err){
        return res.status(500).json(err);
      }

      res.json({
        id:this.lastID,
        username,
        role
      });

    }
  );

});

/* =========================
   DELETE USER
========================= */

app.delete("/users/:id", (req,res) => {

  db.run(
    `
    DELETE FROM users
    WHERE id = ?
    `,
    [req.params.id],
    function(err){

      if(err){
        return res.status(500).json(err);
      }

      res.json({
        deleted:this.changes
      });

    }
  );

});

/* =========================
   ADD PRODUCT
========================= */

app.post("/products", (req,res) => {

  const {
    name,
    price,
    stock,
    delivery_date,
    delivery_receipt,
    expiry_date
  } = req.body;

  db.run(
    `
    INSERT INTO products (
      name,
      price,
      stock,
      delivery_date,
      delivery_receipt,
      expiry_date
    )

    VALUES (?,?,?,?,?,?)
    `,
    [
      name,
      price,
      stock,
      delivery_date,
      delivery_receipt,
      expiry_date
    ],
    function(err){

      if(err){
        return res.status(500).json(err);
      }

      res.json({
        id:this.lastID,
        name,
        price,
        stock,
        delivery_date,
        delivery_receipt,
        expiry_date
      });

    }
  );

});

/* =========================
   DELETE PRODUCT
========================= */

app.delete("/products/:id", (req,res) => {

  db.run(
    `
    DELETE FROM products
    WHERE id = ?
    `,
    [req.params.id],
    function(err){

      if(err){
        return res.status(500).json(err);
      }

      res.json({
        deleted:this.changes
      });

    }
  );

});

/* =========================
   SAVE SALES
========================= */

app.post("/sales", (req,res) => {

  const {
    items,
    total,
    cashier,
    date
  } = req.body;

  db.run(
    `
    INSERT INTO sales (
      items,
      total,
      cashier,
      date
    )

    VALUES (?,?,?,?)
    `,
    [
      JSON.stringify(items),
      total,
      cashier,
      date
    ],
    function(err){

      if(err){
        return res.status(500).json(err);
      }

      res.json({
        id:this.lastID
      });

    }
  );

});

/* =========================
   GET SALES
========================= */

app.get("/sales", (req,res) => {

  db.all(
    `SELECT * FROM sales`,
    [],
    (err,rows) => {

      if(err){
        return res.status(500).json(err);
      }

      res.json(rows);

    }
  );

});

/* =========================
   START SERVER
========================= */

app.listen(3000, () => {
  console.log("Server running on port 3000");
});