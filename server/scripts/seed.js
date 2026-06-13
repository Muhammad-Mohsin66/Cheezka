require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Deal = require('../models/Deal');
const DeliveryZone = require('../models/DeliveryZone');
const BankAccount = require('../models/BankAccount');
const SystemSetting = require('../models/SystemSetting');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Refund = require('../models/Refund');
const InventoryLog = require('../models/InventoryLog');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cheezka';

const seedDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB!');

    // Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Deal.deleteMany({}),
      DeliveryZone.deleteMany({}),
      BankAccount.deleteMany({}),
      SystemSetting.deleteMany({}),
      Order.deleteMany({}),
      Payment.deleteMany({}),
      Refund.deleteMany({}),
      InventoryLog.deleteMany({}),
      AuditLog.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log('Database cleared!');

    // 1. Seed Users
    console.log('Seeding Users...');
    const users = await User.create([
      {
        name: 'Cheezka Admin',
        email: 'admin@cheezka.com',
        phone: '03032793109',
        password: 'admin123',
        role: 'admin',
        isEmailVerified: true,
        isActive: true,
      },
      {
        name: 'Cheezka Employee',
        email: 'employee@cheezka.com',
        phone: '03032444109',
        password: 'employee123',
        role: 'employee',
        isEmailVerified: true,
        isActive: true,
      },
      {
        name: 'Rider John',
        email: 'rider1@cheezka.com',
        phone: '03112223334',
        password: 'rider123',
        role: 'rider',
        isEmailVerified: true,
        isActive: true,
      },
      {
        name: 'Rider Smith',
        email: 'rider2@cheezka.com',
        phone: '03445556667',
        password: 'rider123',
        role: 'rider',
        isEmailVerified: true,
        isActive: true,
      },
      {
        name: 'Customer Alice',
        email: 'customer1@cheezka.com',
        phone: '03778889990',
        password: 'customer123',
        role: 'customer',
        isEmailVerified: true,
        isActive: true,
      },
      {
        name: 'Customer Bob',
        email: 'customer2@cheezka.com',
        phone: '03112233445',
        password: 'customer123',
        role: 'customer',
        isEmailVerified: true,
        isActive: true,
      },
    ]);

    const admin = users[0];
    const employee = users[1];
    const rider1 = users[2];
    const rider2 = users[3];
    const customer1 = users[4];
    const customer2 = users[5];

    // 2. Seed Categories
    console.log('Seeding Categories...');
    const categories = await Category.create([
      { name: 'Pizza', description: 'Freshly baked artisanal pizzas with premium toppings' },
      { name: 'Burgers', description: 'Juicy, flame-grilled beef and chicken burgers' },
      { name: 'Pasta', description: 'Rich and creamy Italian pastas cooked to perfection' },
      { name: 'Desserts', description: 'Delectable sweet treats to complete your meal' },
      { name: 'Drinks', description: 'Chilled soft drinks and refreshing beverages' },
    ]);

    const pizzaCat = categories[0];
    const burgerCat = categories[1];
    const pastaCat = categories[2];
    const dessertCat = categories[3];
    const drinkCat = categories[4];

    const products = await Product.create([
      // Pizzas
      {
        name: 'Vegetable Pizza',
        description: 'Mushrooms, onions, green peppers, tomatoes, and olives',
        category: pizzaCat._id,
        basePrice: 500,
        sizes: [
          { size: 'S', price: 500 },
          { size: 'M', price: 900 },
          { size: 'L', price: 1250 },
          { size: 'XL', price: 1650 },
        ],
        stockQuantity: 50,
        isActive: true,
      },
      {
        name: 'B.B.Q Chicken Pizza',
        description: 'Grilled chicken, BBQ sauce, onions, and cheese',
        category: pizzaCat._id,
        basePrice: 500,
        sizes: [
          { size: 'S', price: 500 },
          { size: 'M', price: 900 },
          { size: 'L', price: 1250 },
          { size: 'XL', price: 1650 },
        ],
        stockQuantity: 50,
        isActive: true,
      },
      {
        name: 'Hut Spicy Pizza',
        description: 'Spicy chicken, jalapeños, onions, and hot sauce',
        category: pizzaCat._id,
        basePrice: 500,
        sizes: [
          { size: 'S', price: 500 },
          { size: 'M', price: 900 },
          { size: 'L', price: 1250 },
          { size: 'XL', price: 1650 },
        ],
        stockQuantity: 50,
        isActive: true,
      },
      {
        name: 'Chicken Achari Pizza',
        description: 'Achari chicken chunks, onions, and special pickle spices',
        category: pizzaCat._id,
        basePrice: 500,
        sizes: [
          { size: 'S', price: 500 },
          { size: 'M', price: 900 },
          { size: 'L', price: 1250 },
          { size: 'XL', price: 1650 },
        ],
        stockQuantity: 50,
        isActive: true,
      },
      {
        name: 'Cheese Lover Pizza',
        description: 'Extra mozzarella cheese and double pizza sauce',
        category: pizzaCat._id,
        basePrice: 500,
        sizes: [
          { size: 'S', price: 500 },
          { size: 'M', price: 900 },
          { size: 'L', price: 1250 },
          { size: 'XL', price: 1650 },
        ],
        stockQuantity: 50,
        isActive: true,
      },
      {
        name: 'Chicken Tikka Pizza',
        description: 'Tikka chicken, onions, and traditional pizza cheese',
        category: pizzaCat._id,
        basePrice: 500,
        sizes: [
          { size: 'S', price: 500 },
          { size: 'M', price: 900 },
          { size: 'L', price: 1250 },
          { size: 'XL', price: 1650 },
        ],
        stockQuantity: 50,
        isActive: true,
      },
      {
        name: 'Chicken Fajeta Pizza',
        description: 'Fajita chicken, onions, bell peppers, and cheese',
        category: pizzaCat._id,
        basePrice: 500,
        sizes: [
          { size: 'S', price: 500 },
          { size: 'M', price: 900 },
          { size: 'L', price: 1250 },
          { size: 'XL', price: 1650 },
        ],
        stockQuantity: 50,
        isActive: true,
      },
      {
        name: 'Chicken Supreme Pizza',
        description: 'Chicken cubes, onions, green peppers, olives, and mushrooms',
        category: pizzaCat._id,
        basePrice: 500,
        sizes: [
          { size: 'S', price: 500 },
          { size: 'M', price: 900 },
          { size: 'L', price: 1250 },
          { size: 'XL', price: 1650 },
        ],
        stockQuantity: 50,
        isActive: true,
      },
      {
        name: 'Cheezka Special',
        description: 'Our signature pizza loaded with premium meats and veggies',
        category: pizzaCat._id,
        basePrice: 600,
        sizes: [
          { size: 'S', price: 600 },
          { size: 'M', price: 1100 },
          { size: 'L', price: 1650 },
          { size: 'XL', price: 1950 },
        ],
        stockQuantity: 50,
        isActive: true,
      },
      {
        name: 'Crown Crust',
        description: 'Crown crust filled with cream cheese and topped with spicy chicken',
        category: pizzaCat._id,
        basePrice: 600,
        sizes: [
          { size: 'S', price: 600 },
          { size: 'M', price: 1100 },
          { size: 'L', price: 1650 },
          { size: 'XL', price: 1950 },
        ],
        stockQuantity: 50,
        isActive: true,
      },
      {
        name: 'Kabab Crust',
        description: 'Crust stuffed with seekh kababs and topped with premium chicken',
        category: pizzaCat._id,
        basePrice: 600,
        sizes: [
          { size: 'S', price: 600 },
          { size: 'M', price: 1100 },
          { size: 'L', price: 1650 },
          { size: 'XL', price: 1950 },
        ],
        stockQuantity: 50,
        isActive: true,
      },
      {
        name: 'Cheeze Crust',
        description: 'Crust filled with gooey mozzarella cheese',
        category: pizzaCat._id,
        basePrice: 600,
        sizes: [
          { size: 'S', price: 600 },
          { size: 'M', price: 1100 },
          { size: 'L', price: 1650 },
          { size: 'XL', price: 1950 },
        ],
        stockQuantity: 50,
        isActive: true,
      },
      {
        name: 'Chicken Crust',
        description: 'Double layer chicken crust with special white sauce',
        category: pizzaCat._id,
        basePrice: 600,
        sizes: [
          { size: 'S', price: 600 },
          { size: 'M', price: 1100 },
          { size: 'L', price: 1650 },
          { size: 'XL', price: 1950 },
        ],
        stockQuantity: 50,
        isActive: true,
      },
      {
        name: 'Square King Lazania Pizza',
        description: 'Rich square lasagna layers with chicken and marinara',
        category: pizzaCat._id,
        basePrice: 1100,
        sizes: [
          { size: 'M', price: 1100 },
          { size: 'L', price: 1650 },
        ],
        stockQuantity: 50,
        isActive: true,
      },
      {
        name: 'Behari Kabab Pizza',
        description: 'Behari chicken kababs, onions, and cheese',
        category: pizzaCat._id,
        basePrice: 600,
        sizes: [
          { size: 'S', price: 600 },
          { size: 'M', price: 1100 },
          { size: 'L', price: 1650 },
          { size: 'XL', price: 1950 },
        ],
        stockQuantity: 50,
        isActive: true,
      },
      {
        name: 'Malai Boti Pizza',
        description: 'Creamy malai boti chicken chunks, onions, and mozzarella',
        category: pizzaCat._id,
        basePrice: 600,
        sizes: [
          { size: 'S', price: 600 },
          { size: 'M', price: 1100 },
          { size: 'L', price: 1650 },
          { size: 'XL', price: 1950 },
        ],
        stockQuantity: 50,
        isActive: true,
      },

      // Burgers & Shawarma
      {
        name: 'Zinger Burger',
        description: 'Crispy fried chicken thigh fillet with lettuce and mayo',
        category: burgerCat._id,
        basePrice: 300,
        sizes: [
          { size: 'S', price: 300 },
          { size: 'M', price: 300 },
          { size: 'L', price: 300 },
          { size: 'XL', price: 300 },
        ],
        stockQuantity: 100,
        isActive: true,
      },
      {
        name: 'Zinger Cheeze Burger',
        description: 'Zinger burger with an extra melted cheese slice',
        category: burgerCat._id,
        basePrice: 350,
        sizes: [
          { size: 'S', price: 350 },
          { size: 'M', price: 350 },
          { size: 'L', price: 350 },
          { size: 'XL', price: 350 },
        ],
        stockQuantity: 100,
        isActive: true,
      },
      {
        name: 'Patty Burger',
        description: 'Classic grilled chicken patty with onions and sauces',
        category: burgerCat._id,
        basePrice: 230,
        sizes: [
          { size: 'S', price: 230 },
          { size: 'M', price: 230 },
          { size: 'L', price: 230 },
          { size: 'XL', price: 230 },
        ],
        stockQuantity: 100,
        isActive: true,
      },
      {
        name: 'Patty Cheeze Burger',
        description: 'Chicken patty burger with a slice of processed cheese',
        category: burgerCat._id,
        basePrice: 280,
        sizes: [
          { size: 'S', price: 280 },
          { size: 'M', price: 280 },
          { size: 'L', price: 280 },
          { size: 'XL', price: 280 },
        ],
        stockQuantity: 100,
        isActive: true,
      },
      {
        name: 'Zinger Shawarma',
        description: 'Crispy zinger chicken wrapped in pita bread with garlic mayo',
        category: burgerCat._id,
        basePrice: 250,
        sizes: [
          { size: 'S', price: 250 },
          { size: 'M', price: 250 },
          { size: 'L', price: 250 },
          { size: 'XL', price: 250 },
        ],
        stockQuantity: 100,
        isActive: true,
      },
      {
        name: 'Zinger Cheeze Shawarma',
        description: 'Zinger shawarma with melted cheese slice inside',
        category: burgerCat._id,
        basePrice: 300,
        sizes: [
          { size: 'S', price: 300 },
          { size: 'M', price: 300 },
          { size: 'L', price: 300 },
          { size: 'XL', price: 300 },
        ],
        stockQuantity: 100,
        isActive: true,
      },
      {
        name: 'Chicken Shawarma',
        description: 'Traditional spit-roasted chicken wraps with pickle and garlic sauce',
        category: burgerCat._id,
        basePrice: 150,
        sizes: [
          { size: 'S', price: 150 },
          { size: 'M', price: 150 },
          { size: 'L', price: 150 },
          { size: 'XL', price: 150 },
        ],
        stockQuantity: 100,
        isActive: true,
      },
      {
        name: 'Zinger Paratha Roll',
        description: 'Crispy zinger chicken wrapped in a flaky paratha roll',
        category: burgerCat._id,
        basePrice: 250,
        sizes: [
          { size: 'S', price: 250 },
          { size: 'M', price: 250 },
          { size: 'L', price: 250 },
          { size: 'XL', price: 250 },
        ],
        stockQuantity: 100,
        isActive: true,
      },
      {
        name: 'Zinger Paratha Cheeze',
        description: 'Zinger paratha roll loaded with cheddar cheese',
        category: burgerCat._id,
        basePrice: 300,
        sizes: [
          { size: 'S', price: 300 },
          { size: 'M', price: 300 },
          { size: 'L', price: 300 },
          { size: 'XL', price: 300 },
        ],
        stockQuantity: 100,
        isActive: true,
      },
      {
        name: 'Chicken Paratha',
        description: 'Spicy chicken chunks wrapped in paratha',
        category: burgerCat._id,
        basePrice: 200,
        sizes: [
          { size: 'S', price: 200 },
          { size: 'M', price: 200 },
          { size: 'L', price: 200 },
          { size: 'XL', price: 200 },
        ],
        stockQuantity: 100,
        isActive: true,
      },

      // Pasta & Fries
      {
        name: 'Creamy Pasta',
        description: 'Rich white sauce pasta loaded with cream and chicken',
        category: pastaCat._id,
        basePrice: 400,
        sizes: [
          { size: 'S', price: 400 },
          { size: 'M', price: 400 }, // Regular
          { size: 'L', price: 650 }, // Large
        ],
        stockQuantity: 50,
        isActive: true,
      },
      {
        name: 'Crunchy Pasta',
        description: 'Macaroni pasta topped with crispy baked breadcrumbs and cheese',
        category: pastaCat._id,
        basePrice: 400,
        sizes: [
          { size: 'S', price: 400 },
          { size: 'M', price: 400 }, // Regular
          { size: 'L', price: 650 }, // Large
        ],
        stockQuantity: 50,
        isActive: true,
      },
      {
        name: 'French Fries',
        description: 'Classic salted golden potato fries',
        category: pastaCat._id,
        basePrice: 50,
        sizes: [
          { size: 'S', price: 50 },
          { size: 'M', price: 50 }, // Regular
          { size: 'L', price: 100 }, // Large
        ],
        stockQuantity: 200,
        isActive: true,
      },
      {
        name: 'Loaded Fries',
        description: 'French fries topped with cheese sauce, chicken chunks, and jalapenos',
        category: pastaCat._id,
        basePrice: 400,
        sizes: [
          { size: 'S', price: 400 },
          { size: 'M', price: 400 }, // Regular
          { size: 'L', price: 600 }, // Large
        ],
        stockQuantity: 150,
        isActive: true,
      },

      // Dessert
      {
        name: 'Chocolate Fudge Cake',
        description: 'Moist and rich dark chocolate cake with fudge layers',
        category: dessertCat._id,
        basePrice: 180,
        sizes: [
          { size: 'S', price: 180 },
        ],
        stockQuantity: 0,
        isActive: true,
      },

      // Drink
      {
        name: 'Chilled Pepsi',
        description: '350ml chilled carbonated soft drink',
        category: drinkCat._id,
        basePrice: 60,
        sizes: [
          { size: 'S', price: 60 },
          { size: 'M', price: 60 },
          { size: 'L', price: 60 },
        ],
        stockQuantity: 200,
        isActive: true,
      },
    ]);

    const classicPizza = products[8]; // Cheezka Special
    const garlicChicken = products[5]; // Chicken Tikka
    const beefBurger = products[16]; // Zinger Burger
    const alfredoPasta = products[26]; // Creamy Pasta
    const chocCake = products[30]; // Chocolate Fudge
    const pepsi = products[31]; // Chilled Pepsi

    // 4. Seed Deals
    console.log('Seeding Deals...');
    const deals = await Deal.create([
      {
        title: 'Midweek Pizza Madness',
        description: 'Get a Medium Classic Pizza and a Pepsi at a discounted rate',
        products: [classicPizza._id, pepsi._id],
        dealPrice: 480,
        originalPrice: 559,
        discount: 14,
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // started 2 days ago
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // ends in 5 days
        isActive: true,
        maxUses: 100,
        usedCount: 23,
      },
      {
        title: 'Burger Feast Deal',
        description: 'Enjoy our premium Double Decker Beef Burger with two Pepsi cans',
        products: [beefBurger._id, pepsi._id],
        dealPrice: 450,
        originalPrice: 519,
        discount: 13,
        startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        isActive: true,
        maxUses: 50,
        usedCount: 12,
      },
    ]);

    // 5. Seed Delivery Zones
    console.log('Seeding Delivery Zones...');
    const deliveryZones = await DeliveryZone.create([
      {
        name: 'Downtown Main Sector',
        description: 'Urban city center coverage within 5km radius',
        baseCharge: 50,
        perKmRate: 10,
        estimatedTime: 30,
        coordinates: { type: 'Point', coordinates: [73.0851, 33.6844] },
        radius: 5,
        isActive: true,
      },
      {
        name: 'Gulberg Suburban Sector',
        description: 'Extended suburban deliveries within 10km radius',
        baseCharge: 100,
        perKmRate: 15,
        estimatedTime: 45,
        coordinates: { type: 'Point', coordinates: [74.3587, 31.5204] },
        radius: 10,
        isActive: true,
      },
    ]);

    // 6. Seed Bank Accounts
    console.log('Seeding Bank Accounts...');
    const bankAccounts = await BankAccount.create([
      {
        bankName: 'Habib Bank Limited (HBL)',
        accountTitle: 'Cheezka Food Delivery PVT LTD',
        accountNumber: '12345678901234',
        iban: 'PK21HABB0012345678901234',
        isActive: true,
      },
      {
        bankName: 'Bank Alfalah',
        accountTitle: 'Cheezka Food Delivery PVT LTD',
        accountNumber: '98765432109876',
        iban: 'PK87ALFA0098765432109876',
        isActive: true,
      },
    ]);

    // 7. Seed System Settings
    console.log('Seeding System Settings...');
    const settings = await SystemSetting.create([
      {
        key: 'DELIVERY_BASE_CHARGE',
        value: 50,
        type: 'number',
        category: 'delivery',
        description: 'Base charge for delivery fee calculation',
        isEditable: true,
        lastUpdatedBy: admin._id,
      },
      {
        key: 'TAX_PERCENTAGE',
        value: 16,
        type: 'number',
        category: 'general',
        description: 'Sales tax percentage applied to orders',
        isEditable: true,
        lastUpdatedBy: admin._id,
      },
      {
        key: 'MIN_ORDER_VALUE',
        value: 200,
        type: 'number',
        category: 'general',
        description: 'Minimum order amount required for placement',
        isEditable: true,
        lastUpdatedBy: admin._id,
      },
      {
        key: 'EMAIL_VERIFICATION_REQUIRED',
        value: false,
        type: 'boolean',
        category: 'security',
        description: 'Require email verification for new registrations',
        isEditable: true,
        lastUpdatedBy: admin._id,
      },
      {
        key: 'MAINTENANCE_MODE',
        value: false,
        type: 'boolean',
        category: 'general',
        description: 'Put website in read-only maintenance mode',
        isEditable: true,
        lastUpdatedBy: admin._id,
      },
    ]);

    // 8. Seed Orders
    console.log('Seeding Orders...');
    const orders = await Order.create([
      {
        customer: customer1._id,
        orderItems: [
          {
            product: classicPizza._id,
            name: classicPizza.name,
            size: 'M',
            quantity: 2,
            price: 499,
          },
          {
            product: pepsi._id,
            name: pepsi.name,
            size: 'S',
            quantity: 2,
            price: 60,
          },
        ],
        shippingAddress: 'House 23, Street 5, Downtown Sector, Islamabad',
        phoneNumber: '03778889990',
        totalAmount: 1118,
        deliveryCharge: 50,
        grandTotal: 1168,
        paymentMethod: 'COD',
        paymentStatus: 'Pending',
        orderStatus: 'Pending',
        rider: null,
      },
      {
        customer: customer2._id,
        orderItems: [
          {
            product: beefBurger._id,
            name: beefBurger.name,
            size: 'L',
            quantity: 1,
            price: 499,
          },
        ],
        shippingAddress: 'Apartment 4B, Gulberg Heights, Lahore',
        phoneNumber: '03112233445',
        totalAmount: 499,
        deliveryCharge: 100,
        grandTotal: 599,
        paymentMethod: 'Online',
        paymentStatus: 'Verified',
        orderStatus: 'Confirmed',
        rider: null,
      },
      {
        customer: customer1._id,
        orderItems: [
          {
            product: garlicChicken._id,
            name: garlicChicken.name,
            size: 'L',
            quantity: 1,
            price: 749,
          },
        ],
        shippingAddress: 'House 23, Street 5, Downtown Sector, Islamabad',
        phoneNumber: '03778889990',
        totalAmount: 749,
        deliveryCharge: 50,
        grandTotal: 799,
        paymentMethod: 'Online',
        paymentStatus: 'Pending',
        orderStatus: 'Pending',
        rider: null,
      },
      {
        customer: customer2._id,
        orderItems: [
          {
            product: alfredoPasta._id,
            name: alfredoPasta.name,
            size: 'M',
            quantity: 2,
            price: 320,
          },
        ],
        shippingAddress: 'Apartment 4B, Gulberg Heights, Lahore',
        phoneNumber: '03112233445',
        totalAmount: 640,
        deliveryCharge: 100,
        grandTotal: 740,
        paymentMethod: 'COD',
        paymentStatus: 'Pending',
        orderStatus: 'Ready',
        rider: rider1._id,
      },
      {
        customer: customer1._id,
        orderItems: [
          {
            product: classicPizza._id,
            name: classicPizza.name,
            size: 'S',
            quantity: 1,
            price: 299,
          },
        ],
        shippingAddress: 'House 23, Street 5, Downtown Sector, Islamabad',
        phoneNumber: '03778889990',
        totalAmount: 299,
        deliveryCharge: 50,
        grandTotal: 349,
        paymentMethod: 'COD',
        paymentStatus: 'Pending',
        orderStatus: 'Handover to Rider',
        rider: rider1._id,
      },
      {
        customer: customer2._id,
        orderItems: [
          {
            product: garlicChicken._id,
            name: garlicChicken.name,
            size: 'M',
            quantity: 1,
            price: 549,
          },
        ],
        shippingAddress: 'Apartment 4B, Gulberg Heights, Lahore',
        phoneNumber: '03112233445',
        totalAmount: 549,
        deliveryCharge: 100,
        grandTotal: 649,
        paymentMethod: 'Online',
        paymentStatus: 'Verified',
        orderStatus: 'Delivered',
        rider: rider2._id,
      },
      {
        customer: customer1._id,
        orderItems: [
          {
            product: beefBurger._id,
            name: beefBurger.name,
            size: 'M',
            quantity: 1,
            price: 399,
          },
        ],
        shippingAddress: 'House 23, Street 5, Downtown Sector, Islamabad',
        phoneNumber: '03778889990',
        totalAmount: 399,
        deliveryCharge: 50,
        grandTotal: 449,
        paymentMethod: 'Online',
        paymentStatus: 'Failed',
        orderStatus: 'Cancelled',
        cancellationReason: 'Payment transaction failed',
        rider: null,
      },
    ]);

    const orderPendingCOD = orders[0];
    const orderConfirmedOnline = orders[1];
    const orderPendingOnline = orders[2];
    const orderReadyCOD = orders[3];
    const orderHandoverCOD = orders[4];
    const orderDeliveredOnline = orders[5];

    // 9. Seed Payments (linked to Online orders)
    console.log('Seeding Payments...');
    const payments = await Payment.create([
      {
        order: orderConfirmedOnline._id,
        user: customer2._id,
        paymentMethod: 'Online',
        screenshot: '/uploads/payments/screenshot_confirmed.jpg',
        amount: 599,
        status: 'Verified',
        adminNote: 'Verified Bank transfer screenshot. Reference ID matches.',
        verifiedBy: admin._id,
        verifiedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        order: orderPendingOnline._id,
        user: customer1._id,
        paymentMethod: 'Online',
        screenshot: '/uploads/payments/screenshot_pending.jpg',
        amount: 799,
        status: 'Pending',
      },
      {
        order: orderDeliveredOnline._id,
        user: customer2._id,
        paymentMethod: 'Online',
        screenshot: '/uploads/payments/screenshot_delivered.jpg',
        amount: 649,
        status: 'Verified',
        adminNote: 'JazzCash transaction confirmed.',
        verifiedBy: employee._id,
        verifiedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
    ]);

    // 10. Seed Refunds
    console.log('Seeding Refunds...');
    const refunds = await Refund.create([
      {
        order: orderConfirmedOnline._id,
        payment: payments[0]._id,
        user: customer2._id,
        amount: 599,
        reason: 'Order confirmed but customer requested refund due to delivery delay.',
        status: 'Requested',
      },
      {
        order: orderDeliveredOnline._id,
        payment: payments[2]._id,
        user: customer2._id,
        amount: 649,
        reason: 'Received wrong items in order. Quality was sub-par.',
        status: 'Approved',
        adminNote: 'Approved. Customer returned the food items.',
        processedBy: admin._id,
        processedAt: new Date(Date.now() - 30 * 60 * 1000),
      },
    ]);

    // 11. Seed Inventory Logs
    console.log('Seeding Inventory Logs...');
    const inventoryLogs = await InventoryLog.create([
      {
        product: alfredoPasta._id,
        previousStock: 10,
        newStock: 3,
        quantity: 7,
        changeType: 'decrease',
        reason: 'order',
        performedBy: employee._id,
      },
      {
        product: classicPizza._id,
        previousStock: 30,
        newStock: 50,
        quantity: 20,
        changeType: 'increase',
        reason: 'restock',
        performedBy: admin._id,
      },
    ]);

    // 12. Seed Audit Logs
    console.log('Seeding Audit Logs...');
    await AuditLog.create([
      {
        user: admin._id,
        action: 'create',
        targetCollection: 'Product',
        targetId: classicPizza._id,
        targetName: classicPizza.name,
        changes: {
          before: null,
          after: classicPizza.toObject(),
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        status: 'success',
      },
      {
        user: admin._id,
        action: 'update',
        targetCollection: 'Report',
        targetName: 'Tax settings updated',
        changes: {
          before: { value: 15 },
          after: { value: 16 },
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        status: 'success',
      },
    ]);

    // 13. Seed Notifications
    console.log('Seeding Notifications...');
    await Notification.create([
      {
        recipient: admin._id,
        title: 'Low Stock Alert',
        message: 'Alfredo Pasta is running low on stock. Current: 3, Threshold: 5.',
        type: 'system',
        relatedId: alfredoPasta._id,
        isRead: false,
      },
      {
        recipient: customer1._id,
        title: 'Order Handover',
        message: 'Your order #5 is now with Rider John. Expected delivery in 30 minutes.',
        type: 'order',
        relatedId: orderHandoverCOD._id,
        isRead: false,
      },
      {
        recipient: customer2._id,
        title: 'Payment Confirmed',
        message: 'Thank you! Your payment of ₹599 has been verified.',
        type: 'payment',
        relatedId: orderConfirmedOnline._id,
        isRead: true,
        readAt: new Date(),
      },
    ]);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
