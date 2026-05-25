/* =========================
   SESSION
========================= */

let session =
  JSON.parse(localStorage.getItem("session"))
  || null;

/* =========================
   USERS
========================= */

const users = [

  {
    username:"Jasmine",
    password:"V9llester0s",
    role:"Admin"
  },

  {
    username:"Alison",
    password:"1905",
    role:"Cashier"
  }

];

/* =========================
   PRODUCTS
========================= */

let products =
  JSON.parse(localStorage.getItem("products"))
  || [

    {
      id:1,
      name:"Rice",
      price:60,
      stock:10
    },

    {
      id:2,
      name:"Milk",
      price:90,
      stock:8
    },

    {
      id:3,
      name:"Bread",
      price:50,
      stock:15
    }

];

/* =========================
   SALES
========================= */

let sales =
  JSON.parse(localStorage.getItem("sales"))
  || [];

/* =========================
   CART
========================= */

let cart = [];

/* =========================
   DELETE SELECTION
========================= */

let selectedProducts = [];

/* =========================
   AUTO LOGIN
========================= */

window.onload = () => {

  if(session){
    enterApp();
  }

};

/* =========================
   LOGIN
========================= */

async function login(){

  const username =
    document.getElementById("username").value;

  const password =
    document.getElementById("password").value;

  const role =
    document.getElementById("roleSelect").value;

  const res = await fetch(
    "http://localhost:3000/login",
    {
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        username,
        password,
        role
      })
    }
  );

  if(!res.ok){

    alert("Invalid credentials");
    return;
  }

  const user = await res.json();

  session = {

    user:user.username,
    role:user.role

  };

  localStorage.setItem(
    "session",
    JSON.stringify(session)
  );

  enterApp();
}

/* =========================
   ENTER APP
========================= */

function enterApp(){

  document.getElementById("loginScreen")
    .style.display = "none";

  document.getElementById("app")
    .style.display = "block";

  document.getElementById("userInfo")
    .innerText =
      `👤 ${session.user} (${session.role})`;

      /* HIDE ADMIN ACTIONS FOR CASHIER */

if(session.role !== "Admin"){

  document.querySelector(".admin-actions")
    .style.display = "none";
}

 loadProducts();
  renderCart();
  renderHistory();
}

/* =========================
   LOGOUT
========================= */

function logout(){

  localStorage.removeItem("session");

  location.reload();
}

/* =========================
   SAVE PRODUCTS
========================= */

function saveProducts(){

  localStorage.setItem(
    "products",
    JSON.stringify(products)
  );
}

/* =========================
   PRODUCT MODAL
========================= */

function openAddModal(){

  if(session.role !== "Admin") return;

  document.getElementById("productModal")
    .style.display = "flex";
}

function closeProductModal(){

  document.getElementById("productModal")
    .style.display = "none";
}

/* =========================
   ADD PRODUCT
========================= */

async function addProduct(){

  if(session.role !== "Admin") return;

  const name =
    document.getElementById("pname").value;

  const price =
    Number(
      document.getElementById("pprice").value
    );

  const stock =
    Number(
      document.getElementById("pstock").value
    );

  const delivery_date =
    document.getElementById("pdeliverydate").value;

  const delivery_receipt =
    document.getElementById("pdeliveryreceipt").value;

  const expiry_date =
    document.getElementById("pexpirydate").value;

  const res = await fetch(
    "http://localhost:3000/products",
    {
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        name,
        price,
        stock,
        delivery_date,
        delivery_receipt,
        expiry_date
      })
    }
  );

  const newProduct =
    await res.json();

  products.push(newProduct);

  renderProducts();

  closeProductModal();
}

/* CLEAR INPUTS */

document.getElementById("pname").value = "";
document.getElementById("pprice").value = "";
document.getElementById("pstock").value = "";

closeProductModal();


/* =========================
   PRODUCTS
========================= */

function renderProducts(){

  const list =
    document.getElementById("productList");

  list.innerHTML = "";

  products.forEach(product => {

    const div =
      document.createElement("div");

    div.className = "product";

    const today =
  new Date();

const expiry =
  new Date(product.expiry_date);

if(product.expiry_date){

  const diff =
    (expiry - today) /
    (1000 * 60 * 60 * 24);

  if(diff <= 0){

    div.classList.add("expired");

  }else if(diff <= 7){

    div.classList.add("expiring-soon");
  }

}

    div.innerHTML = `

      ${
        session.role === "Admin"
        ? `
          <input
            type="checkbox"
            class="product-checkbox"
            onchange="toggleProductSelection(${product.id}, this.checked)"
          >
        `
        : ""
      }

      <h3>${product.name}</h3>

      <p>₱${product.price}</p>

      <p class="stock">
  Stock: ${product.stock}
</p>

<p class="stock">
  Delivery: ${
    product.delivery_date || "N/A"
  }
</p>

<p class="stock">
  DR #: ${
    product.delivery_receipt || "N/A"
  }
</p>

<p class="stock">
  Expiry: ${
    product.expiry_date || "N/A"
  }
</p>

      <div style="
        display:flex;
        gap:10px;
        margin-top:15px;
      ">

        <button
          onclick="addToCart(${product.id})"
          ${product.stock <= 0 ? "disabled" : ""}
        >
          Add to Cart
        </button>

      </div>
    `;

    list.appendChild(div);
  });

  saveProducts();
}

/* =========================
   SELECT PRODUCTS
========================= */

function toggleProductSelection(id,checked){

  if(checked){

    selectedProducts.push(id);

  }else{

    selectedProducts =
      selectedProducts.filter(p => p !== id);
  }
}

/* =========================
   DELETE PRODUCTS
========================= */

function deleteSelectedProducts(){

  if(session.role !== "Admin") return;

  products = products.filter(product =>
    !selectedProducts.includes(product.id)
  );

  selectedProducts = [];

  saveProducts();

  renderProducts();
}

/* =========================
   ADD TO CART
========================= */

function addToCart(id){

  const product =
    products.find(p => p.id === id);

  if(!product || product.stock <= 0)
    return;

  const existing =
    cart.find(c => c.id === id);

  if(existing){

    existing.qty++;

  }else{

    cart.push({
      ...product,
      qty:1
    });

  }

  product.stock--;

  renderProducts();

  renderCart();
}

/* =========================
   CHANGE QUANTITY
========================= */

function changeQty(id, amount){

  const item =
    cart.find(c => c.id === id);

  const product =
    products.find(p => p.id === id);

  if(!item || !product) return;

  if(amount > 0){

    if(product.stock <= 0) return;

    item.qty++;
    product.stock--;

  }else{

    item.qty--;
    product.stock++;

    if(item.qty <= 0){

      removeItem(id);
      return;
    }
  }

  renderProducts();
  renderCart();
}

/* =========================
   SET QUANTITY
========================= */

function setQty(id, value){

  const item =
    cart.find(c => c.id === id);

  const product =
    products.find(p => p.id === id);

  if(!item || !product) return;

  let newQty = Number(value);

  if(newQty < 1){

    removeItem(id);
    return;
  }

  const difference =
    newQty - item.qty;

  if(difference > 0){

    if(product.stock < difference){

      alert("Not enough stock");
      return;
    }

    product.stock -= difference;

  }else{

    product.stock += Math.abs(difference);
  }

  item.qty = newQty;

  renderProducts();
  renderCart();
}

/* =========================
   REMOVE ITEM
========================= */

function removeItem(id){

  const index =
    cart.findIndex(c => c.id === id);

  const item = cart[index];

  const product =
    products.find(p => p.id === id);

  product.stock += item.qty;

  cart.splice(index,1);

  renderProducts();

  renderCart();
}

/* =========================
   CART
========================= */

function renderCart(){

  const cartDiv =
    document.getElementById("cart");

  cartDiv.innerHTML = "";

  let subtotal = 0;

  cart.forEach(item => {

    subtotal +=
      item.price * item.qty;

    const div =
      document.createElement("div");

    div.className = "cart-item";

    div.innerHTML = `

      <div style="
        display:flex;
        flex-direction:column;
        gap:8px;
      ">

        <strong>${item.name}</strong>

        <div style="
          display:flex;
          align-items:center;
          gap:10px;
        ">

          <label>Qty:</label>

          <input
            type="number"
            min="1"
            value="${item.qty}"
            onchange="updateQuantity(${item.id}, this.value)"
            style="
              width:70px;
              padding:8px;
              border:none;
              border-radius:10px;
              text-align:center;
            "
          >

        </div>

      </div>

      <div style="
        display:flex;
        flex-direction:column;
        align-items:flex-end;
        gap:10px;
      ">

        <strong>
          ₱${item.price * item.qty}
        </strong>

        <button
          onclick="removeItem(${item.id})"
        >
          Remove
        </button>

      </div>
    `;

    cartDiv.appendChild(div);
  });

  updateTotals(subtotal);
}

/* =========================
   UPDATE QUANTITY
========================= */

function updateQuantity(id, value){

  const item =
    cart.find(c => c.id === id);

  const product =
    products.find(p => p.id === id);

  if(!item || !product) return;

  const newQty = Number(value);

  if(newQty <= 0){

    removeItem(id);
    return;
  }

  const difference =
    newQty - item.qty;

  if(difference > product.stock){

    alert("Not enough stock");

    renderCart();
    return;
  }

  item.qty = newQty;

  product.stock -= difference;

  renderProducts();

  renderCart();
}

/* =========================
   TOTALS
========================= */

function updateTotals(subtotal){

  const discount =
    Number(
      document.getElementById("discount")
      .value
    ) || 0;

  const discounted =
    subtotal -
    (subtotal * discount / 100);

  const tax =
    discounted * 0.12;

  const total =
    discounted + tax;

  document.getElementById("subtotal")
    .innerText =
      subtotal.toFixed(2);

  document.getElementById("tax")
    .innerText =
      tax.toFixed(2);

  document.getElementById("total")
    .innerText =
      total.toFixed(2);
}

/* =========================
   25% DISCOUNT
========================= */

function apply25Discount(){

  document.getElementById("discount")
    .value = 25;

  renderCart();
}

/* =========================
   CHECKOUT
========================= */

function checkout(){

  if(cart.length === 0){

    alert("Cart empty");
    return;
  }

  const total =
    Number(
      document.getElementById("total")
      .innerText
    );

  const sale = {

    items:[...cart],
    total,
    cashier:session.user,
    date:new Date().toLocaleString()

  };

  sales.push(sale);

  localStorage.setItem(
    "sales",
    JSON.stringify(sales)
  );

  showReceipt(sale);

  cart = [];

  renderCart();

  renderHistory();
}

/* =========================
   RECEIPT
========================= */

function showReceipt(sale){

  const receipt =
    document.getElementById("receipt");

  let html = `

    <h3>Enterprise Retail POS</h3>

    <hr><br>

    <ul>
  `;

  sale.items.forEach(item => {

    html += `
      <li>
        ${item.name}
        x${item.qty}
        - ₱${item.price * item.qty}
      </li>
    `;
  });

  html += `

    </ul>

    <br><hr><br>

    <h3>Total: ₱${sale.total}</h3>

    <p>Cashier: ${sale.cashier}</p>

    <p>${sale.date}</p>
  `;

  receipt.innerHTML = html;

  document.getElementById("modal")
    .style.display = "flex";
}

/* =========================
   CLOSE RECEIPT
========================= */

function closeModal(){

  document.getElementById("modal")
    .style.display = "none";
}

/* =========================
   PRINT RECEIPT
========================= */

function printReceipt(){

  window.print();
}

/* =========================
   HISTORY
========================= */

function renderHistory(){

  const history =
    document.getElementById("history");

  history.innerHTML = "";

  sales
    .slice(-5)
    .reverse()
    .forEach(sale => {

      const div =
        document.createElement("div");

      div.innerHTML = `
        ₱${sale.total}
        - ${sale.cashier}
      `;

      history.appendChild(div);
    });

  updateSalesToday();
}

/* =========================
   DAILY SALES
========================= */

function updateSalesToday(){

  const today =
    new Date().toLocaleDateString();

  const total =
    sales
      .filter(s =>
        s.date.includes(today)
      )
      .reduce((sum,s) =>
        sum + s.total,0);

  document.getElementById("salesToday")
    .innerText =
      total.toFixed(2);
}

/* =========================
   SEARCH + DISCOUNT
========================= */

document.addEventListener("input", e => {

  if(e.target.id === "search"){

    const value =
      e.target.value.toLowerCase();

    document
      .querySelectorAll(".product")
      .forEach(product => {

        product.style.display =

          product.innerText
            .toLowerCase()
            .includes(value)

              ? "block"
              : "none";
      });
  }

  if(e.target.id === "discount"){

    let subtotal = 0;

    cart.forEach(item => {

      subtotal +=
        item.price * item.qty;
    });

    updateTotals(subtotal);
  }

});

async function loadProducts(){

  const res =
    await fetch(
      "http://localhost:3000/products"
    );

  products = await res.json();

  renderProducts();
}

/* =========================
   USER MODAL
========================= */

function openUserModal(){

  if(session.role !== "Admin") return;

  document.getElementById("userModal")
    .style.display = "flex";

  loadUsers();
}

function closeUserModal(){

  document.getElementById("userModal")
    .style.display = "none";
}

/* =========================
   LOAD USERS
========================= */

async function loadUsers(){

  const res =
    await fetch("http://localhost:3000/users");

  const users =
    await res.json();

  const list =
    document.getElementById("userList");

  list.innerHTML = "";

  users.forEach(user => {

    const div =
      document.createElement("div");

    div.style.marginTop = "10px";

    div.style.padding = "10px";

    div.style.borderRadius = "10px";

    div.style.background =
      "rgba(255,255,255,0.08)";

    div.innerHTML = `

      <strong>${user.username}</strong>
      (${user.role})

      <button
        style="
          float:right;
        "
        onclick="deleteUser(${user.id})"
      >
        Delete
      </button>
    `;

    list.appendChild(div);

  });

}

/* =========================
   ADD USER
========================= */

async function addUser(){

  const username =
    document.getElementById("newUsername").value;

  const password =
    document.getElementById("newPassword").value;

  const role =
    document.getElementById("newRole").value;

  if(!username || !password){

    alert("Fill all fields");
    return;
  }

  await fetch(
    "http://localhost:3000/users",
    {
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        username,
        password,
        role
      })
    }
  );

  document.getElementById("newUsername")
    .value = "";

  document.getElementById("newPassword")
    .value = "";

  loadUsers();
}

/* =========================
   DELETE USER
========================= */

async function deleteUser(id){

  if(!confirm("Delete this user?"))
    return;

  await fetch(
    `http://localhost:3000/users/${id}`,
    {
      method:"DELETE"
    }
  );

  loadUsers();
}