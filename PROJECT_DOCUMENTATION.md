# Cheezka - Project Documentation

This document describes the application flow, project structure, and key development information for the Cheezka Food Ordering System.

---

## 1. Application Flow

Cheezka is a MERN Stack Food Ordering System with Role-Based Access Control (RBAC) supporting four roles: **Customer**, **Admin**, **Employee**, and **Rider**.

### A. Customer Flow
1. **Browse Menu**: Customers visit the home page (`/`) or shop page (`/shop`) to view available categories (Burgers, Pizza, Pasta, Drinks) and active items.
2. **Manage Cart**: 
   - Customers add items, choose sizes, and select quantities.
   - The Cart Drawer displays the **Subtotal**, dynamic **Delivery Charges**, calculated **Tax**, and **Grand Total**.
3. **Checkout**: 
   - Customers input their **Name**, **Phone**, and **Delivery Address**.
   - They choose a payment option:
     - **Cash on Delivery (COD)**.
     - **Online Payment**: Instructions display configuration details of bank accounts where they transfer money and upload a receipt screenshot.
4. **Order Status Tracking**: 
   - Once submitted, customers track their order status live (e.g., *Pending*, *Preparing*, *Out for Delivery*, *Delivered*).

### B. Admin & Staff Flow
1. **Login**: Admins/staff log in to the management dashboard.
2. **Dashboard Overview**: Access sales figures, customer metrics, inventory status, and order counters.
3. **Order Management**: 
   - Review pending orders, verify transaction IDs/screenshots for online payments, and change order states.
   - Assign orders to registered Riders.
4. **Menu & Categories**: Create, toggle status, modify pricing/images, or delete products and categories.
5. **Settings Management**: Set global variables like **Tax Percentage** and **Base Delivery Charges**.

### C. Rider Flow
1. **Assignments**: Riders check their dashboard for assigned orders.
2. **Delivery updates**: Mark deliveries as "Out for Delivery" and finally "Delivered" once dropped off.

---

## 2. Project Structure

The project is structured into a separate frontend client (React + Vite) and backend server (Node + Express).

```
Cheezka/
├── client/                     # Frontend Application (React + Vite)
│   ├── public/                 # Static files (fallback scripts, raw css, default images)
│   │   ├── css/                # Extracted layout stylesheets
│   │   └── js/                 # Pure JS files (e.g. cart.js fallback)
│   ├── src/                    # Source files
│   │   ├── components/         # Reusable UI widgets
│   │   ├── pages/              # View pages (ShopPage, CheckoutPage, OrderTrackingPage, etc.)
│   │   ├── shared/             # Configurations shared globally
│   │   │   └── services/       # api.js (Axios instance configured dynamically)
│   │   ├── storefront/         # Frontend templates & controller hooks
│   │   │   ├── hooks/          # pageHooks.js (Links templates to React state)
│   │   │   ├── templates/      # Raw HTML layouts (shop.html, index.html)
│   │   │   └── utils/          # API utility functions (api.js)
│   │   ├── App.jsx             # React router configuration
│   │   └── main.jsx            # React root mount
│   ├── package.json            # Client dependencies and npm scripts
│   └── vite.config.js          # Vite compilation config
│
└── server/                     # Backend API Application (Node.js + Express)
    ├── config/                 # DB configuration (database.js)
    ├── controllers/            # Controller endpoints containing route logic
    ├── middleware/             # Role verification, file uploads, error handlers
    ├── models/                 # Database Mongoose Schemas (User, Order, Product, etc.)
    ├── routes/                 # API endpoint mappings
    ├── utils/                  # Centralized logger, mail, error handlers
    ├── index.js                # Server entry point
    └── package.json            # Server configurations and runner scripts
```

---

## 3. Project Credits & Technical Details

- **Project Name**: **Cheezka** (Single-branch Food Ordering System).
- **Developer / Creator (Git Author)**: **Muhammad Mohsin** (GitHub username: **Muhammad-Mohsin66**).
- **AI Pair Programming Assistant**: **Antigravity** (built by the Google DeepMind team).
