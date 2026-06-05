(function () {
  "use strict";

  var CART_KEY = "cheezka_cart";
  var API_BASE = "http://localhost:8000/api";

  function parsePrice(raw) {
    var cleaned = (raw || "").replace(/[^0-9]/g, "");
    return cleaned ? parseInt(cleaned, 10) : 0;
  }

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    } catch (err) {
      return [];
    }
  }

  function setCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function addToCart(name, size, price) {
    var cart = getCart();
    var existing = cart.find(function (item) {
      return item.name === name && item.size === size && item.price === price;
    });

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ name: name, size: size, price: price, qty: 1 });
    }

    setCart(cart);
    renderCart();
  }

  function updateQty(index, delta) {
    var cart = getCart();
    if (!cart[index]) return;

    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
      cart.splice(index, 1);
    }

    setCart(cart);
    renderCart();
  }

  function removeItem(index) {
    var cart = getCart();
    cart.splice(index, 1);
    setCart(cart);
    renderCart();
  }

  function renderCart() {
    var cart = getCart();
    var cartItems = document.getElementById("cart-items");
    var cartCount = document.getElementById("cart-count");
    var cartTotal = document.getElementById("cart-total");

    if (!cartItems || !cartCount || !cartTotal) return;

    var totalCount = cart.reduce(function (acc, item) { return acc + item.qty; }, 0);
    var totalAmount = cart.reduce(function (acc, item) { return acc + (item.qty * item.price); }, 0);

    cartCount.textContent = String(totalCount);
    cartTotal.textContent = String(totalAmount);

    if (cart.length === 0) {
      cartItems.innerHTML = '<div class="cart-empty">No items yet. Add your favorite menu items.</div>';
      return;
    }

    cartItems.innerHTML = cart.map(function (item, index) {
      var lineTotal = item.qty * item.price;
      var sizeLabel = item.size ? "Size: " + item.size : "Single item";

      return (
        '<div class="cart-item">' +
          '<p class="cart-item-title">' + escapeHtml(item.name) + '</p>' +
          '<div class="cart-item-size">' + escapeHtml(sizeLabel) + '</div>' +
          '<div class="cart-row">' +
            '<div class="qty-controls">' +
              '<button class="qty-btn" data-action="minus" data-index="' + index + '">-</button>' +
              '<span>' + item.qty + '</span>' +
              '<button class="qty-btn" data-action="plus" data-index="' + index + '">+</button>' +
            '</div>' +
            '<div class="cart-price">Rs. ' + lineTotal + '</div>' +
          '</div>' +
          '<button class="remove-btn" data-action="remove" data-index="' + index + '">Remove</button>' +
        '</div>'
      );
    }).join("");

    cartItems.querySelectorAll("button[data-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var index = parseInt(btn.getAttribute("data-index"), 10);
        var action = btn.getAttribute("data-action");

        if (action === "plus") updateQty(index, 1);
        if (action === "minus") updateQty(index, -1);
        if (action === "remove") removeItem(index);
      });
    });
  }

  function enhanceMenuCards() {
    document.querySelectorAll(".menu-card").forEach(function (card) {
      if (card.getAttribute("data-cart-enhanced") === "1") return;

      var nameEl = card.querySelector(".menu-item-name");
      if (!nameEl) return;
      var itemName = nameEl.textContent.trim();

      var sizeBoxes = card.querySelectorAll(".size-box");
      sizeBoxes.forEach(function (box) {
        var labelEl = box.querySelector(".size-label");
        var priceEl = box.querySelector(".size-price");
        if (!priceEl) return;

        var size = labelEl ? labelEl.textContent.trim() : "Single";
        var price = parsePrice(priceEl.textContent);

        var btn = document.createElement("button");
        btn.className = "menu-add-btn";
        btn.type = "button";
        btn.textContent = "Add " + size + " (Rs. " + price + ")";
        btn.addEventListener("click", function () {
          addToCart(itemName, size, price);
          showStatus("Added to cart: " + itemName + " (" + size + ")", false);
        });

        box.appendChild(btn);
      });

      card.setAttribute("data-cart-enhanced", "1");
    });
  }

  function enhanceListRows() {
    document.querySelectorAll(".item-row").forEach(function (row) {
      if (row.getAttribute("data-cart-enhanced") === "1") return;

      var nameEl = row.querySelector(".item-row-name");
      var priceEl = row.querySelector(".item-row-price");
      if (!nameEl || !priceEl) return;

      var name = nameEl.textContent.trim();
      var price = parsePrice(priceEl.textContent);

      var addBtn = document.createElement("button");
      addBtn.className = "list-add-btn";
      addBtn.type = "button";
      addBtn.textContent = "Add";
      addBtn.addEventListener("click", function () {
        addToCart(name, "Regular", price);
        showStatus("Added to cart: " + name, false);
      });

      row.appendChild(addBtn);
      row.setAttribute("data-cart-enhanced", "1");
    });
  }

  function toggleCart(open) {
    var drawer = document.getElementById("cart-drawer");
    var backdrop = document.getElementById("cart-backdrop");
    if (!drawer || !backdrop) return;

    if (open) {
      drawer.classList.add("open");
      backdrop.classList.add("open");
      document.body.classList.add("ck-no-scroll");
    } else {
      drawer.classList.remove("open");
      backdrop.classList.remove("open");
      document.body.classList.remove("ck-no-scroll");
    }
  }

  function showStatus(message, isError) {
    var box = document.getElementById("order-status");
    if (!box) return;

    box.textContent = message;
    box.classList.toggle("ck-status--error", !!isError);
    box.classList.toggle("ck-status--ok", !isError);
  }

  function getLoggedInUser() {
    try {
      return JSON.parse(localStorage.getItem("cheezka_user") || "null");
    } catch (err) {
      return null;
    }
  }

  function updatePlaceOrderAccess() {
    var placeBtn = document.getElementById("place-order-btn");
    if (!placeBtn) return;

    var user = getLoggedInUser();
    if (user && user.email) {
      placeBtn.disabled = false;
      placeBtn.textContent = "Place Online Order";
      return;
    }

    placeBtn.disabled = true;
    placeBtn.textContent = "Login Required";
    showStatus("Please login first to place an order.", true);
  }

  function placeOrder() {
    var user = getLoggedInUser();
    if (!user || !user.email) {
      showStatus("Please login first to place an order. Redirecting...", true);
      setTimeout(function () {
        window.location.href = "login.html";
      }, 900);
      return;
    }

    var cart = getCart();
    var name = (document.getElementById("customer-name") || {}).value || "";
    var phone = (document.getElementById("customer-phone") || {}).value || "";
    var address = (document.getElementById("customer-address") || {}).value || "";
    var paymentMethod = (document.getElementById("payment-method") || {}).value || "Cash on Delivery";
    var notes = (document.getElementById("order-notes") || {}).value || "";

    if (cart.length === 0) {
      showStatus("Cart is empty. Add items first.", true);
      return;
    }
    if (!name.trim() || !phone.trim() || !address.trim()) {
      showStatus("Please fill name, phone, and address.", true);
      return;
    }

    var total = cart.reduce(function (acc, item) { return acc + item.qty * item.price; }, 0);

    var placeBtn = document.getElementById("place-order-btn");
    if (placeBtn) {
      placeBtn.disabled = true;
      placeBtn.textContent = "Placing...";
    }

    fetch(API_BASE + "/orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        customer_address: address.trim(),
        payment_method: paymentMethod,
        notes: notes.trim(),
        items: cart,
        total: total
      })
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (err) {
            throw new Error((err && err.detail) || "Could not place order");
          });
        }
        return response.json();
      })
      .then(function (savedOrder) {
        localStorage.removeItem(CART_KEY);
        localStorage.removeItem("cheezka_checkout_form");

        (document.getElementById("customer-name") || {}).value = "";
        (document.getElementById("customer-phone") || {}).value = "";
        (document.getElementById("customer-address") || {}).value = "";
        (document.getElementById("order-notes") || {}).value = "";

        showStatus("Order placed successfully. Order ID: " + savedOrder.order_id, false);
        renderCart();
      })
      .catch(function (err) {
        showStatus("Order failed: " + err.message, true);
      })
      .finally(function () {
        if (placeBtn) {
          placeBtn.disabled = false;
          placeBtn.textContent = "Place Online Order";
        }
      });
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function saveCheckoutFormToStorage() {
    var formData = {
      name: (document.getElementById("customer-name") || {}).value || "",
      phone: (document.getElementById("customer-phone") || {}).value || "",
      address: (document.getElementById("customer-address") || {}).value || "",
      paymentMethod: (document.getElementById("payment-method") || {}).value || "Cash on Delivery",
      notes: (document.getElementById("order-notes") || {}).value || ""
    };
    localStorage.setItem("cheezka_checkout_form", JSON.stringify(formData));
  }

  function restoreCheckoutFormFromStorage() {
    try {
      var saved = JSON.parse(localStorage.getItem("cheezka_checkout_form") || "{}");
      if (saved.name) (document.getElementById("customer-name") || {}).value = saved.name;
      if (saved.phone) (document.getElementById("customer-phone") || {}).value = saved.phone;
      if (saved.address) (document.getElementById("customer-address") || {}).value = saved.address;
      if (saved.paymentMethod) (document.getElementById("payment-method") || {}).value = saved.paymentMethod;
      if (saved.notes) (document.getElementById("order-notes") || {}).value = saved.notes;
    } catch (err) {
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    enhanceMenuCards();
    enhanceListRows();
    renderCart();
    updatePlaceOrderAccess();

    var openBtn = document.getElementById("open-cart-btn");
    var closeBtn = document.getElementById("close-cart-btn");
    var backdrop = document.getElementById("cart-backdrop");
    var placeBtn = document.getElementById("place-order-btn");

    if (openBtn) {
      openBtn.addEventListener("click", function () {
        toggleCart(true);
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        toggleCart(false);
      });
    }
    if (backdrop) {
      backdrop.addEventListener("click", function () {
        toggleCart(false);
      });
    }
    if (placeBtn) {
      placeBtn.addEventListener("click", placeOrder);
    }

    var checkoutInputs = [
      "customer-name",
      "customer-phone",
      "customer-address",
      "payment-method",
      "order-notes"
    ];

    checkoutInputs.forEach(function (inputId) {
      var input = document.getElementById(inputId);
      if (input) {
        input.addEventListener("keydown", function (e) {
          if (e.key === "Enter" && input.tagName !== "TEXTAREA") {
            e.preventDefault();
            return false;
          }
        });

        input.addEventListener("change", function () {
          saveCheckoutFormToStorage();
        });
        input.addEventListener("input", function () {
          saveCheckoutFormToStorage();
        });
      }
    });

    restoreCheckoutFormFromStorage();

    var query = new URLSearchParams(window.location.search);
    if (query.get("cart") === "1" || query.get("checkout") === "1") {
      toggleCart(true);
      if (query.get("checkout") === "1") {
        var input = document.getElementById("customer-name");
        if (input) {
          setTimeout(function () { input.focus(); }, 120);
        }
      }
    }
  });
})();
