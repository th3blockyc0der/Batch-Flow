/* =====================================================
   GLOBAL CONFIGURATION & CONSTANTS
===================================================== */
const API = "http://localhost:3000";
let cart = [];

/* =====================================================
   1. AUTHENTICATION & ACCESS CONTROL SYSTEM
===================================================== */
async function login(){
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role })
    });

    const data = await res.json();
    console.log(data);

    if(data.success){
      /* SAVE USER ACCOUNT SESSION */
      localStorage.setItem("loggedInUser", JSON.stringify(data.user));

      /* REDIRECT ACCESS RULES */
      if(data.user.role === "Admin" || data.user.role === "Manager"){
        window.location.href = "management.html";
      } else {
        window.location.href = "index.html";
      }
    } else {
      alert("Invalid login credentials provided. Try again.");
    }
  } catch(error) {
    console.error("Login application exception encountered:", error);
    alert("Could not establish a connection to the authentication server.");
  }
}

function logout(){
  localStorage.removeItem("loggedInUser");
  window.location.href = "login.html";
}

function loadTopUser(){
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if(!user) return;

  const tUsername = document.getElementById("topUsername");
  const tRole = document.getElementById("topUserRole");
  const tAvatar = document.getElementById("topUserAvatar");

  if(tUsername) tUsername.innerText = user.username;
  if(tRole) tRole.innerText = user.role;
  if(tAvatar && user.username) tAvatar.innerText = user.username.charAt(0).toUpperCase();
}

/* =====================================================
   2. MANAGEMENT METRICS & BUSINESS OVERVIEW
===================================================== */
async function loadDashboardMetrics() {
  try {
    const [pRes, eRes, sRes, cRes] = await Promise.all([
      fetch(`${API}/api/products`),
      fetch(`${API}/api/expenses`),
      fetch(`${API}/api/suppliers`),
      fetch(`${API}/api/categories`)
    ]);

    const products = await pRes.json();
    const expenses = await eRes.json();
    const suppliers = await sRes.json();
    const categories = await cRes.json();

    const tP = document.getElementById("totalProducts");
    const tE = document.getElementById("totalExpenses");
    const tS = document.getElementById("totalSuppliers");
    const tC = document.getElementById("totalCategories");

    if (tP) tP.innerText = products.length;
    if (tS) tS.innerText = suppliers.length;
    if (tC) tC.innerText = categories.length;
    
    if (tE) {
      const totalSum = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      tE.innerText = `₱${totalSum.toFixed(2)}`;
    }
  } catch (err) {
    console.error("Failed compiling dashboard statistics summaries:", err);
  }
}

/* =====================================================
   3. RESOURCE LOADERS (INVENTORY TABLES & SELECTIONS)
===================================================== */
async function loadProducts(){
  const productList = document.getElementById("productList");
  if(!productList) return;

  try {
    const res = await fetch(`${API}/api/products`);
    const products = await res.json();
    productList.innerHTML = "";

    if (products.length === 0) {
      productList.innerHTML = `<p style="padding: 20px; color: var(--muted);">No products found in directory.</p>`;
      return;
    }

    products.forEach(product => {
      productList.innerHTML += `
        <div class="product-card" onclick="addToCart(${product.id}, '${product.name}', ${product.price}, ${product.stock})">
          <h3>${product.name}</h3>
          <p class="price">₱${Number(product.price).toFixed(2)}</p>
          <p class="stock">Remaining Stock: <strong>${product.stock}</strong></p>
          ${product.barcode ? `<span class="barcode-tag">📋 ${product.barcode}</span>` : ""}
        </div>
      `;
    });
  } catch(error) {
    console.error("Error drawing products system interface grid:", error);
  }
}

async function loadCategories(){
  try {
    const response = await fetch(`${API}/api/categories`);
    const categories = await response.json();

    const categorySelect = document.getElementById("pcategory");
    if(categorySelect){
      categorySelect.innerHTML = `<option value="">Select Category</option>`;
      categories.forEach(category => {
        categorySelect.innerHTML += `<option value="${category.id}">${category.name}</option>`;
      });
    }
  } catch(error) {
    console.error("Category select load processing issue:", error);
  }
}

async function loadSuppliers(){
  try {
    const response = await fetch(`${API}/api/suppliers`);
    const suppliers = await response.json();

    const supplierSelect = document.getElementById("psupplier");
    if(supplierSelect){
      supplierSelect.innerHTML = `<option value="">Select Supplier</option>`;
      suppliers.forEach(supplier => {
        supplierSelect.innerHTML += `<option value="${supplier.id}">${supplier.company_name}</option>`;
      });
    }
  } catch(error) {
    console.error("Supplier dropdown choice mapping issue:", error);
  }
}

async function loadDeliveries(){
  try {
    const res = await fetch(`${API}/api/deliveries`);
    const deliveries = await res.json();
    const list = document.getElementById("deliveryList");

    if(!list) return;
    list.innerHTML = "";

    const today = new Date().toISOString().split("T")[0];

    deliveries.forEach(delivery => {
      const expired = delivery.expiry_date && delivery.expiry_date <= today;

      list.innerHTML += `
        <tr class="${expired ? "expired-row" : ""}">
          <td style="padding: 12px; border-bottom: 1px solid var(--border);">${delivery.product_name}</td>
          <td style="padding: 12px; border-bottom: 1px solid var(--border);">${delivery.supplier_name || "Direct Logged Item"}</td>
          <td style="padding: 12px; border-bottom: 1px solid var(--border);">${delivery.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid var(--border);">${delivery.delivery_date || "N/A"}</td>
          <td style="padding: 12px; border-bottom: 1px solid var(--border);">${delivery.delivery_receipt || "N/A"}</td>
          <td style="padding: 12px; border-bottom: 1px solid var(--border);">
            ${expired ? `<span style="color: var(--danger); font-weight: bold;">Expired</span>` : `<span style="color: var(--success);">Good</span>`}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid var(--border); text-align: center;">
            <button class="nav-btn" style="padding: 4px 8px; font-size: 12px;" onclick="editDelivery(${delivery.id}, '${delivery.delivery_date || ""}', '${delivery.delivery_receipt || ""}', '${delivery.expiry_date || ""}')">
              ✍ Edit
            </button>
          </td>
        </tr>
      `;
    });
  } catch(error) {
    console.error("Delivery list rendering workflow fault:", error);
  }
}

/* =====================================================
   4. DATA ADDITION PIPELINES (POST DATA INTERFACES)
===================================================== */
async function addProduct() {
  const name = document.getElementById("pname").value;
  const price = document.getElementById("pprice").value;
  const stock = document.getElementById("pstock").value;
  const barcode = document.getElementById("pbarcode").value;
  const category_id = document.getElementById("pcategory").value;
  const supplier_id = document.getElementById("psupplier").value;
  const delivery_date = document.getElementById("pdeliverydate").value;
  const delivery_receipt = document.getElementById("preceipt").value;
  const expiry_date = document.getElementById("pexpiry").value;

  if (!name || !price || !stock) {
    alert("Please fill in all mandatory product information fields marked with (*).");
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  if (delivery_date && delivery_date > today) {
    alert("Invalid entry: Delivery verification data cannot reside in a future date.");
    return;
  }
  if (expiry_date && expiry_date <= today) {
    alert("Invalid entry: Cannot register items that are already past their expiration threshold.");
    return;
  }
  if (delivery_date && expiry_date && expiry_date <= delivery_date) {
    alert("Logistical error: Expiration timeline target must extend beyond the initial receipt delivery date.");
    return;
  }
  if (Number(price) <= 0 || Number(stock) <= 0) {
    alert("Value constraints violated: Catalog price points and base quantities must exceed zero.");
    return;
  }

  try {
    const res = await fetch(`${API}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        price: Number(price),
        stock: Number(stock),
        barcode,
        category_id: category_id ? Number(category_id) : null,
        supplier_id: supplier_id ? Number(supplier_id) : null,
        delivery_date,
        delivery_receipt,
        expiry_date
      })
    });

    if (res.ok) {
      alert("Product successfully added to master data node catalog!");
      closeAddModal();
      
      // Clear forms
      ["pname", "pprice", "pstock", "pbarcode", "pcategory", "psupplier", "preceipt", "pdeliverydate", "pexpiry"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });

      loadProducts();
      loadDeliveries();
      loadDashboardMetrics();
    } else {
      alert("Database error: Could not append record entry.");
    }
  } catch (error) {
    console.error("Failed logging standard catalog data parameters:", error);
  }
}

async function addUser() {
  const username = document.getElementById("newUsername").value;
  const password = document.getElementById("newPassword").value;
  const role = document.getElementById("newRole").value;

  if (!username || !password) {
    alert("Operator profiles require username and master security key credentials.");
    return;
  }

  try {
    const res = await fetch(`${API}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role })
    });

    if (res.ok) {
      alert("User operator profile active in system directories!");
      document.getElementById("newUsername").value = "";
      document.getElementById("newPassword").value = "";
      loadUsers();
    } else {
      alert("Provision denied: Profile configuration parameters matching credentials conflict.");
    }
  } catch (error) {
    console.error("Error committing operator profile entry adjustments:", error);
  }
}



/* =====================================================
   5. EDIT MODIFICATIONS SYSTEM
===================================================== */
async function editDelivery(id, currentDate, currentReceipt, currentExpiry) {
  const newDate = prompt("Enter New Delivery Date (YYYY-MM-DD):", currentDate);
  if (newDate === null) return; 

  const newReceipt = prompt("Enter New Delivery Receipt Number:", currentReceipt);
  if (newReceipt === null) return;

  const newExpiry = prompt("Enter New Expiry Date (YYYY-MM-DD):", currentExpiry);
  if (newExpiry === null) return;

  try {
    const res = await fetch(`${API}/api/deliveries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        delivery_date: newDate,
        delivery_receipt: newReceipt,
        expiry_date: newExpiry
      })
    });

    if (res.ok) {
      alert("Delivery tracking parameter definitions updated successfully.");
      loadDeliveries();
    } else {
      alert("Failed to modify target data matrix attributes.");
    }
  } catch (error) {
    console.error("Error editing delivery details row indices:", error);
  }
}

/* =====================================================
   6. CASH REGISTER UTILITIES & BASKET MATHEMATICS
===================================================== */
let activeDiscountPercentage = 0;

function addToCart(id, name, price, stock) {
  if (stock <= 0) {
    alert("This product is currently out of stock.");
    return;
  }

  const existingItem = cart.find(item => item.id === id);
  if (existingItem) {
    if (existingItem.quantity >= stock) {
      alert(`Cannot add more items. Only ${stock} units are available in inventory stock.`);
      return;
    }
    existingItem.quantity++;
  } else {
    cart.push({ id, name, price: Number(price), quantity: 1 });
  }
  renderCart();
}

function apply25Discount() {
  activeDiscountPercentage = 25;
  const discountInput = document.getElementById("discount");
  if (discountInput) discountInput.value = 25;
  renderCart();
}

document.addEventListener("DOMContentLoaded", () => {
  const discountInput = document.getElementById("discount");
  if (discountInput) {
    discountInput.addEventListener("input", (e) => {
      let val = Number(e.target.value) || 0;
      if (val < 0) val = 0;
      if (val > 100) val = 100;
      activeDiscountPercentage = val;
      renderCart();
    });
  }
});

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const subtotalElem = document.getElementById("subtotal");
  const taxElem = document.getElementById("tax");
  const totalElem = document.getElementById("total");

  if (!cartItems) return;
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = `<div style="text-align:center; padding:40px; color:var(--muted);">Basket is currently empty</div>`;
    if (subtotalElem) subtotalElem.innerText = "0.00";
    if (taxElem) taxElem.innerText = "0.00";
    if (totalElem) totalElem.innerText = "0.00";
    return;
  }

  let subtotal = 0;
  cart.forEach(item => {
    subtotal += item.price * item.quantity;
    cartItems.innerHTML += `
      <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; background:rgba(255,255,255,0.05); padding:10px; border-radius:8px;">
        <div>
          <strong style="color:var(--cream); display:block; margin-bottom:2px;">${item.name}</strong>
          <p style="font-size:13px; color:var(--muted);">₱${item.price.toFixed(2)} x ${item.quantity}</p>
        </div>
        <button onclick="removeFromCart(${item.id})" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:16px; padding:0 8px;">❌</button>
      </div>
    `;
  });

  let discountAmount = subtotal * (activeDiscountPercentage / 100);
  let baseAmount = subtotal - discountAmount;
  let taxAmount = baseAmount * 0.12; 
  let total = baseAmount + taxAmount;

  if (subtotalElem) subtotalElem.innerText = subtotal.toFixed(2);
  if (taxElem) taxElem.innerText = taxAmount.toFixed(2);
  if (totalElem) totalElem.innerText = total.toFixed(2);
}

function removeFromCart(id) {
  const index = cart.findIndex(item => item.id === id);
  if (index !== -1) {
    if (cart[index].quantity > 1) {
      cart[index].quantity--;
    } else {
      cart.splice(index, 1);
    }
  }
  renderCart();
}

/* =====================================================
   7. CHECKOUT TRANSACTION SUBMISSION & RECEIPTS
===================================================== */
async function checkout() {
  if (cart.length === 0) {
    alert("Cannot process checkout with an empty basket.");
    return;
  }

  const totalAmount = Number(document.getElementById("total").innerText);
  const sessionUser = JSON.parse(localStorage.getItem("loggedInUser")) || { username: "Cashier" };

  const payload = {
    items: cart.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    })),
    total: totalAmount,
    cashier: sessionUser.username
  };

  try {
    const res = await fetch(`${API}/api/sales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok && data.success !== false) {
      alert("Transaction successfully recorded!");
      cart = []; 
      activeDiscountPercentage = 0;
      if (document.getElementById("discount")) document.getElementById("discount").value = 0;
      
      renderCart(); 
      loadProducts(); 
    } else {
      alert("Transaction rejected by database: " + (data.message || "Unknown error"));
    }
  } catch (error) {
    console.error("Network submission error:", error);
    alert("Could not reach backend service pipeline.");
  }
}

function printReceipt() {
  if (cart.length === 0) {
    alert("Please add products to your active order before printing.");
    return;
  }

  const subtotal = document.getElementById("subtotal").innerText;
  const tax = document.getElementById("tax").innerText;
  const total = document.getElementById("total").innerText;
  const sessionUser = JSON.parse(localStorage.getItem("loggedInUser")) || { username: "Cashier" };

  let receiptWindow = window.open("", "PRINT", "height=500,width=400");
  let itemsHtml = cart.map(i => `
    <tr>
      <td style="padding:5px 0;">${i.name} x${i.quantity}</td>
      <td style="text-align:right; padding:5px 0;">₱${(i.price * i.quantity).toFixed(2)}</td>
    </tr>
  `).join("");

  receiptWindow.document.write(`
    <html>
      <head>
        <title>Transaction Receipt</title>
        <style>
          body { font-family: 'Courier New', monospace; padding: 20px; color: #000; font-size: 14px; line-height: 1.4; }
          .center { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          hr { border-top: 1px dashed #000; border-bottom: 0; margin: 10px 0; }
        </style>
      </head>
      <body>
        <h3 class="center" style="margin-bottom:2px;">BATCH FLOW POS</h3>
        <p class="center" style="font-size:11px; margin-top:0;">Bake Better, Manage Easier</p>
        <p style="font-size:12px;">Date: ${new Date().toLocaleString()}<br>Operator ID: ${sessionUser.username}</p>
        <hr>
        <table><tbody>${itemsHtml}</tbody></table>
        <hr>
        <p>Subtotal: <span style="float:right;">₱${subtotal}</span></p>
        <p>Discount: <span style="float:right;">${activeDiscountPercentage}%</span></p>
        <p>VAT (12%): <span style="float:right;">₱${tax}</span></p>
        <h3 style="margin-top:15px; font-size:16px;">TOTAL DUE: <span style="float:right;">₱${total}</span></h3>
        <hr>
        <p class="center" style="margin-top:25px; font-size:12px;">Thank you for your purchase!</p>
      </body>
    </html>
  `);

  receiptWindow.document.close();
  receiptWindow.focus();
  setTimeout(() => { receiptWindow.print(); receiptWindow.close(); }, 250);
}

/* =====================================================
   8. DATA PURGING SELECTION MANAGEMENT ROUTERS
===================================================== */
function openAddModal() { 
  const modal = document.getElementById("addModal");
  if(modal) {
    modal.style.display = "block"; 
    loadCategories(); 
    loadSuppliers(); 
  }
}
function closeAddModal() { const m = document.getElementById("addModal"); if(m) m.style.display = "none"; }

function openUserModal() { const m = document.getElementById("userModal"); if(m) { m.style.display = "block"; loadUsers(); } }
function closeUserModal() { const m = document.getElementById("userModal"); if(m) m.style.display = "none"; }

function closeDeleteModal() { const m = document.getElementById("deleteModal"); if(m) m.style.display = "none"; }

async function openDeletePanel() {
  const type = document.getElementById("deleteType").value;
  const modal = document.getElementById("deleteModal");
  const title = document.getElementById("deleteTitle");
  const list = document.getElementById("deleteList");

  if (!modal || !list) return;

  modal.style.display = "block";
  title.innerText = `Manage Removal Target: ${type.toUpperCase()}`;
  list.innerHTML = `<p style="color:var(--muted)">Scanning database entities...</p>`;

  try {
    const res = await fetch(`${API}/api/${type}`);
    const data = await res.json();
    list.innerHTML = "";

    if (data.length === 0) {
      list.innerHTML = `<p style="padding:20px; text-align:center; color:var(--muted);">No matching database records available for data removal.</p>`;
      return;
    }

    data.forEach(item => {
      let label = item.name || item.company_name || item.title || item.username || `Record Index Key ID: ${item.id}`;
      const row = document.createElement("div");
      row.style = "display:flex; justify-content:space-between; padding:12px 8px; border-bottom:1px solid var(--border); align-items:center;";
      row.innerHTML = `
        <span style="color:var(--cream); font-size:14px;">${label}</span>
        <button class="danger-btn" style="padding:5px 12px; font-size:13px;" onclick="executeDirectDelete('${type}', ${item.id})">Permanent Purge</button>
      `;
      list.appendChild(row);
    });
  } catch (err) {
    console.error("Error logging contextual content data maps indices:", err);
    list.innerHTML = `<p style="color:var(--danger)">Error querying targeted collection table components matrix.</p>`;
  }
}

async function executeDirectDelete(table, id) {
  if (!confirm(`Warning: You are about to permanently purge this entry record from ${table}. Continue?`)) return;

  try {
    const res = await fetch(`${API}/api/${table}/${id}`, { method: "DELETE" });
    if (res.ok) {
      alert("Asset tracking row successfully purged from node directories.");
      openDeletePanel(); 
      loadDashboardMetrics();
      loadProducts();
      loadDeliveries();
    } else {
      alert("Operation rejected: Database constraints prevent manual removal of this entry dependency item.");
    }
  } catch (err) {
    console.error("System interface encountered interruption on targeted database delete:", err);
  }
}

/* =====================================================
   PROVISION OPERATOR & SECURE USER CLEANUP
===================================================== */
async function loadUsers() {
  const list = document.getElementById("userList");
  if (!list) return;

  // Retrieve the currently active administrator session account
  const currentUserSession = JSON.parse(localStorage.getItem("loggedInUser")) || {};

  try {
    const res = await fetch(`${API}/api/users`);
    const users = await res.json();
    list.innerHTML = "";

    users.forEach(u => {
      const div = document.createElement("div");
      div.style = "display:flex; justify-content:space-between; align-items:center; padding:10px; margin-bottom:8px; background:rgba(255,255,255,0.04); border-radius:8px;";
      
      // Determine if the record row matches the current logged-in user
      const isSelf = (u.username === currentUserSession.username);

      div.innerHTML = `
        <div>
          <strong style="color:var(--cream);">${u.username} ${isSelf ? '<span style="color:var(--accent); font-size:12px;">(You)</span>' : ''}</strong>
          <span style="font-size:12px; margin-left:10px; padding:2px 6px; background:var(--bg-light); border-radius:4px; color:var(--muted);">${u.role}</span>
        </div>
        ${isSelf 
          ? `<span style="padding:5px 12px; font-size:12px; background:rgba(255,255,255,0.05); color:var(--muted); border-radius:var(--radius-sm);">Protected</span>`
          : `<button class="danger-btn" style="padding:5px 12px; font-size:12px;" onclick="deleteUser(${u.id}, '${u.username}')">🗑 Delete</button>`
        }
      `;
      list.appendChild(div);
    });
  } catch (err) {
    console.error("Error running operator list synchronization cycles:", err);
  }
}

async function deleteUser(id, targetUsername) {
  const currentUserSession = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!currentUserSession) {
    alert("Authentication validation failed. Access session timeout.");
    return;
  }

  // Frontend safety check constraint step
  if (currentUserSession.username === targetUsername) {
    alert("Operation rejected: You cannot delete your own active operational profile account.");
    return;
  }

  if (!confirm(`Are you absolutely sure you want to permanently delete user account "${targetUsername}"?`)) return;

  try {
    const res = await fetch(`${API}/api/users/${id}`, {
      method: "DELETE",
      headers: { 
        "Content-Type": "application/json",
        "current-user": currentUserSession.username // Pass current operator context up to the server
      }
    });

    const data = await res.json();

    if (res.ok && data.success !== false) {
      alert(`User profile "${targetUsername}" successfully removed from directory.`);
      loadUsers(); // Refresh display loops inside active workspace
    } else {
      alert("Operation failed: " + (data.message || "Database execution constraints blocked request."));
    }
  } catch (error) {
    console.error("User removal request pipeline execution failure:", error);
    alert("Network communication error during profile purge sequence.");
  }
}

/* =====================================================
   9. CORE APPLICATION LIFECYCLE INITIALIZER HANDLERS
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  loadTopUser();
  loadProducts();
  
  if (document.getElementById("totalProducts")) {
    loadDashboardMetrics();
    loadDeliveries();
  }
  renderCart();
});

/* =====================================================
   SUPPLIER MANAGEMENT ROUTINES
===================================================== */
function openSupplierModal() {
  const m = document.getElementById("supplierModal");
  if(m) m.style.display = "block";
}
function closeSupplierModal() {
  const m = document.getElementById("supplierModal");
  if(m) m.style.display = "none";
}

async function addSupplier() {
  const company_name = document.getElementById("scompany").value;
  const contact_person = document.getElementById("scontact").value;
  const phone = document.getElementById("sphone").value;
  const email = document.getElementById("semail").value;

  if (!company_name) {
    alert("Company Name is a mandatory field.");
    return;
  }

  try {
    const res = await fetch(`${API}/api/suppliers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_name, contact_person, phone, email })
    });

    if (res.ok) {
      alert("Supplier profile added successfully!");
      closeSupplierModal();

      // Clear input fields safely
      ["scompany", "scontact", "sphone", "semail"].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = "";
      });

      // Instantly refresh variables on the layout panels
      loadDashboardMetrics();
      loadSuppliers(); // Re-populates product generation choices dropdown
    } else {
      alert("Failed to record supplier entity row inside database logs.");
    }
  } catch (error) {
    console.error("Error dispatching supplier registration pipeline:", error);
    alert("Could not reach background communication channels.");
  }
}

/* =====================================================
   ISOLATED SUPPLIER LIFECYCLE MANAGEMENT ROUTINES
===================================================== */
function openSupplierModal() {
  const m = document.getElementById("supplierModal");
  if(m) m.style.display = "block";
}
function closeSupplierModal() {
  const m = document.getElementById("supplierModal");
  if(m) m.style.display = "none";
}

async function addSupplier() {
  const company_name = document.getElementById("scompany").value;
  const contact_person = document.getElementById("scontact").value;
  const phone = document.getElementById("sphone").value;
  const email = document.getElementById("semail").value;

  if (!company_name) {
    alert("Company Name is required.");
    return;
  }

  try {
    const res = await fetch(`${API}/api/suppliers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_name, contact_person, phone, email })
    });

    if (res.ok) {
      alert("Supplier profile added successfully!");
      closeSupplierModal();

      // Clear standalone fields
      ["scompany", "scontact", "sphone", "semail"].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = "";
      });

      // Update counters and selections dynamically
      if (typeof loadDashboardMetrics === "function") loadDashboardMetrics();
      if (typeof loadSuppliers === "function") loadSuppliers();
    } else {
      alert("Failed to record supplier entity row inside database logs.");
    }
  } catch (error) {
    console.error("Error dispatching supplier registration pipeline:", error);
    alert("Could not reach background communication channels.");
  }
}