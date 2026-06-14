/* =====================================================
   CORE DEPENDENCIES & INITIALIZATION CONFIGURATION
===================================================== */
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, "database.db");

// Enable middleware handling
app.use(cors());
app.use(express.json());
// Serve your frontend layout assets directly out of current workspace folder root
app.use(express.static(__dirname)); 

// Connect directly into your local SQLite data sheet node
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Critical error connecting to local SQLite binary:", err.message);
  } else {
    console.log("SUCCESS: Database engine link established securely at database.db");
  }
});

/* =====================================================
   1. USER AUTHENTICATION & LOGIN MANAGEMENT ENDPOINT
===================================================== */
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Search by credentials directly to avoid dropdown lockout bugs
  const query = `SELECT id, username, role FROM users WHERE username = ? AND password = ?`;
  db.get(query, [username, password], (err, row) => {
    if (err) {
      console.error("Login route compilation error:", err);
      return res.status(500).json({ success: false, message: "Database execution issue." });
    }

    if (row) {
      console.log(`AUTHENTICATED: Operator ${row.username} recognized as role [${row.role}]`);
      res.json({ success: true, user: row });
    } else {
      res.json({ success: false, message: "Invalid credentials." });
    }
  });
});

/* =====================================================
   2. OPERATOR USER PROVISIONING & SECURE REMOVAL
===================================================== */
app.get("/api/users", (req, res) => {
  db.all(`SELECT id, username, role FROM users`, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json(rows);
  });
});

app.post("/api/users", (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ message: "Fields missing." });

  const query = `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`;
  db.run(query, [username, password, role || "Cashier"], function(err) {
    if (err) return res.status(400).json({ success: false, message: "Username already exists." });
    res.status(201).json({ success: true, id: this.lastID });
  });
});

app.delete("/api/users/:id", (req, res) => {
  const targetId = req.params.id;
  const identityHeader = req.headers["current-user"];

  if (!identityHeader) return res.status(401).json({ message: "Unauthorized metadata missing." });

  db.get(`SELECT username FROM users WHERE id = ?`, [targetId], (err, targetUser) => {
    if (err || !targetUser) return res.status(404).json({ message: "User not found." });

    // Server-side safety constraint checking: Block self profile deletion
    if (targetUser.username === identityHeader) {
      return res.status(403).json({ success: false, message: "Self-deletion is strictly blocked by backend rules." });
    }

    db.run(`DELETE FROM users WHERE id = ?`, [targetId], function(err) {
      if (err) return res.status(500).json({ message: "Purge execution failure." });
      res.json({ success: true, message: "User removed cleanly." });
    });
  });
});

/* =====================================================
   3. PRODUCTS MASTER CATALOG PIPELINES
===================================================== */
app.get("/api/products", (req, res) => {
  const query = `SELECT * FROM products ORDER BY id DESC`;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

app.post("/api/products", (req, res) => {
  const { name, price, stock, barcode, category_id, supplier_id, delivery_date, delivery_receipt, expiry_date } = req.body;

  if (!name || price === undefined || stock === undefined) {
    return res.status(400).json({ message: "Required inputs missing." });
  }

  const query = `INSERT INTO products (name, price, stock, barcode, category_id, supplier_id) VALUES (?, ?, ?, ?, ?, ?)`;
  db.run(query, [name, price, stock, barcode, category_id, supplier_id], function(err) {
    if (err) return res.status(500).json({ message: err.message });

    const pId = this.lastID;
    
    // Auto logging batch details inside deliveries register if parameters are available
    if (delivery_date || delivery_receipt || expiry_date) {
      db.run(
        `INSERT INTO deliveries (product_id, supplier_id, quantity, delivery_date, delivery_receipt, expiry_date) VALUES (?, ?, ?, ?, ?, ?)`,
        [pId, supplier_id, stock, delivery_date, delivery_receipt, expiry_date]
      );
    }
    res.status(201).json({ success: true, productId: pId });
  });
});

app.delete("/api/products/:id", (req, res) => {
  db.run(`DELETE FROM products WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ success: true });
  });
});

/* =====================================================
   4. SUPPLIER AND CATEGORY UTILITY ENDPOINTS
===================================================== */
app.get("/api/suppliers", (req, res) => {
  db.all(`SELECT id, company_name FROM suppliers`, [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

app.post("/api/suppliers", (req, res) => {
  const { company_name, contact_person, phone, email } = req.body;
  if (!company_name) return res.status(400).json({ message: "Company name required." });

  db.run(
    `INSERT INTO suppliers (company_name, contact_person, phone, email) VALUES (?, ?, ?, ?)`,
    [company_name, contact_person, phone, email],
    function(err) {
      if (err) return res.status(500).json({ message: err.message });
      res.status(201).json({ success: true, supplierId: this.lastID });
    }
  );
});

app.delete("/api/suppliers/:id", (req, res) => {
  db.run(`DELETE FROM suppliers WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(400).json({ message: "Cannot delete. Dependency element exists." });
    res.json({ success: true });
  });
});

app.get("/api/categories", (req, res) => {
  db.all(`SELECT id, name FROM categories`, [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

app.delete("/api/categories/:id", (req, res) => {
  db.run(`DELETE FROM categories WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(400).json({ message: "Category possesses active dependencies." });
    res.json({ success: true });
  });
});

/* =====================================================
   5. BATCH DELIVERY TRACKING LEDGER ENDPOINTS
===================================================== */
app.get("/api/deliveries", (req, res) => {
  const query = `
    SELECT d.id, p.name AS product_name, s.company_name AS supplier_name, d.quantity, d.delivery_date, d.delivery_receipt, d.expiry_date
    FROM deliveries d
    JOIN products p ON d.product_id = p.id
    LEFT JOIN suppliers s ON d.supplier_id = s.id
    ORDER BY d.id DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

app.put("/api/deliveries/:id", (req, res) => {
  const { delivery_date, delivery_receipt, expiry_date } = req.body;
  const query = `UPDATE deliveries SET delivery_date = ?, delivery_receipt = ?, expiry_date = ? WHERE id = ?`;
  db.run(query, [delivery_date, delivery_receipt, expiry_date, req.params.id], function(err) {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ success: true });
  });
});

/* =====================================================
   6. CASH REGISTER SALES INVOICING PIPELINE
===================================================== */
app.post("/api/sales", (req, res) => {
  const { items, total, cashier } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ message: "No checkout items." });

  // Log summary instance inside the sales sheet ledger
  db.run(`INSERT INTO sales (total, cashier, date) VALUES (?, ?, datetime('now', 'localtime'))`, [total, cashier], function(err) {
    if (err) return res.status(500).json({ message: err.message });

    const saleId = this.lastID;
    
    // Prepare deduction query statements to decrement current stocks balances
    const updateStockStatement = db.prepare(`UPDATE products SET stock = stock - ? WHERE id = ?`);

    items.forEach(item => {
      updateStockStatement.run([item.quantity, item.id]);
    });

    updateStockStatement.finalize();
    console.log(`SALES RECORDED: Reference Invoice ID Key generated: ${saleId}`);
    res.json({ success: true, saleId });
  });
});

app.get("/api/expenses", (req, res) => {
  db.all(`SELECT id, amount FROM expenses`, [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

/* =====================================================
   7. BACKEND ENGINE WORKSPACE LISTENER RUNTIME
===================================================== */
app.listen(PORT, () => {
  console.log(`=====================================================`);
  console.log(` BATCH FLOW BACKEND PIPELINE ACTIVE AND CURRENTLY RUNNING`);
  console.log(` Target Proxy Address URL: http://localhost:${PORT}`);
  console.log(`=====================================================`);
});