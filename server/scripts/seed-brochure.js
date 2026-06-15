require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cheezka';

const Category = require('../models/Category');
const Product = require('../models/Product');
const Deal = require('../models/Deal');

async function seed() {
  console.log('Connecting to MongoDB at:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  // Clear existing menu data
  console.log('Clearing existing categories, products, and deals...');
  await Category.deleteMany({});
  await Product.deleteMany({});
  await Deal.deleteMany({});
  console.log('Cleared!');

  // 1. Create Categories
  console.log('Seeding Categories...');
  const cats = await Category.create([
    { name: 'Special Burger', description: 'Crispy and juicy burgers made fresh daily' },
    { name: 'Special Shawarma', description: 'Traditional and fusion shawarma rolls and wraps' },
    { name: 'Pasta & Fries', description: 'Rich creamy pastas and golden crispy french fries' },
    { name: 'Pizzas', description: 'Freshly baked pizzas with artisanal crusts and premium toppings' }
  ]);

  const burgerCat = cats[0];
  const shawarmaCat = cats[1];
  const pastaCat = cats[2];
  const pizzaCat = cats[3];

  console.log('Seeding Products...');
  const productsData = [
    // ─────────────────────────────────────────────
    // Special Burger
    // ─────────────────────────────────────────────
    {
      name: 'Zinger Burger',
      description: 'Crispy fried chicken thigh fillet with lettuce and mayo',
      category: burgerCat._id,
      basePrice: 300,
      sizes: [
        { size: 'M', price: 300 }
      ],
      image: '/images/menu/zinger_burger.png',
      stockQuantity: 100,
      isActive: true
    },
    {
      name: 'Zinger Cheeze Burger',
      description: 'Zinger burger with an extra melted cheese slice',
      category: burgerCat._id,
      basePrice: 350,
      sizes: [
        { size: 'M', price: 350 }
      ],
      image: '/images/menu/zinger_cheese_burger.png',
      stockQuantity: 100,
      isActive: true
    },
    {
      name: 'Patty Burger',
      description: 'Classic grilled chicken patty with onions and sauces',
      category: burgerCat._id,
      basePrice: 230,
      sizes: [
        { size: 'M', price: 230 }
      ],
      image: '/images/menu/patty_burger.png',
      stockQuantity: 100,
      isActive: true
    },
    {
      name: 'Patty Cheeze Burger',
      description: 'Chicken patty burger with a slice of processed cheese',
      category: burgerCat._id,
      basePrice: 280,
      sizes: [
        { size: 'M', price: 280 }
      ],
      image: '/images/menu/patty_burger.png', // Fallback to patty_burger image
      stockQuantity: 100,
      isActive: true
    },

    // ─────────────────────────────────────────────
    // Special Shawarma
    // ─────────────────────────────────────────────
    {
      name: 'Zinger Shawarma',
      description: 'Crispy zinger chicken wrapped in pita bread with garlic mayo',
      category: shawarmaCat._id,
      basePrice: 250,
      sizes: [
        { size: 'M', price: 250 }
      ],
      image: '/images/menu/chicken_shawarma.png',
      stockQuantity: 100,
      isActive: true
    },
    {
      name: 'Zinger Cheeze Shawarma',
      description: 'Zinger shawarma with melted cheese slice inside',
      category: shawarmaCat._id,
      basePrice: 300,
      sizes: [
        { size: 'M', price: 300 }
      ],
      image: '/images/menu/chicken_shawarma.png',
      stockQuantity: 100,
      isActive: true
    },
    {
      name: 'Chicken Shawarma',
      description: 'Traditional spit-roasted chicken wraps with pickle and garlic sauce',
      category: shawarmaCat._id,
      basePrice: 150,
      sizes: [
        { size: 'M', price: 150 }
      ],
      image: '/images/menu/chicken_shawarma.png',
      stockQuantity: 100,
      isActive: true
    },
    {
      name: 'Zinger Paratha Roll',
      description: 'Crispy zinger chicken wrapped in a flaky paratha roll',
      category: shawarmaCat._id,
      basePrice: 250,
      sizes: [
        { size: 'M', price: 250 }
      ],
      image: '/images/menu/paratha_roll.png',
      stockQuantity: 100,
      isActive: true
    },
    {
      name: 'Zinger Paratha Cheeze',
      description: 'Zinger paratha roll loaded with cheddar cheese',
      category: shawarmaCat._id,
      basePrice: 300,
      sizes: [
        { size: 'M', price: 300 }
      ],
      image: '/images/menu/paratha_roll.png',
      stockQuantity: 100,
      isActive: true
    },
    {
      name: 'Chicken Paratha',
      description: 'Spicy chicken chunks wrapped in paratha',
      category: shawarmaCat._id,
      basePrice: 200,
      sizes: [
        { size: 'M', price: 200 }
      ],
      image: '/images/menu/paratha_roll.png',
      stockQuantity: 100,
      isActive: true
    },

    // ─────────────────────────────────────────────
    // Pasta & Fries
    // ─────────────────────────────────────────────
    {
      name: 'Creamy Pasta',
      description: 'Rich white sauce pasta loaded with cream and chicken',
      category: pastaCat._id,
      basePrice: 400,
      sizes: [
        { size: 'S', price: 400 },
        { size: 'L', price: 650 }
      ],
      image: '/images/menu/creamy_pasta.png',
      stockQuantity: 50,
      isActive: true
    },
    {
      name: 'Crunchy Pasta',
      description: 'Macaroni pasta topped with crispy baked breadcrumbs and cheese',
      category: pastaCat._id,
      basePrice: 400,
      sizes: [
        { size: 'S', price: 400 },
        { size: 'L', price: 650 }
      ],
      image: '/images/menu/crunchy_pasta.png',
      stockQuantity: 50,
      isActive: true
    },
    {
      name: 'French Fries',
      description: 'Classic salted golden potato fries',
      category: pastaCat._id,
      basePrice: 50,
      sizes: [
        { size: 'S', price: 50 },
        { size: 'L', price: 100 }
      ],
      image: '/images/menu/loaded_fries.png', // French fries image fallback
      stockQuantity: 200,
      isActive: true
    },
    {
      name: 'Loaded Fries',
      description: 'French fries topped with cheese sauce, chicken chunks, and jalapenos',
      category: pastaCat._id,
      basePrice: 400,
      sizes: [
        { size: 'S', price: 400 },
        { size: 'L', price: 600 }
      ],
      image: '/images/menu/loaded_fries.png',
      stockQuantity: 150,
      isActive: true
    },

    // ─────────────────────────────────────────────
    // Pizzas (Standard Price Map: S:500, M:900, L:1250, XL:1650)
    // ─────────────────────────────────────────────
    {
      name: 'Vegetable Pizza',
      description: 'Mushrooms, onions, green peppers, tomatoes, and olives',
      category: pizzaCat._id,
      basePrice: 500,
      sizes: [
        { size: 'S', price: 500 },
        { size: 'M', price: 900 },
        { size: 'L', price: 1250 },
        { size: 'XL', price: 1650 }
      ],
      image: '/images/menu/vegetable_pizza.png',
      stockQuantity: 50,
      isActive: true
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
        { size: 'XL', price: 1650 }
      ],
      image: '/images/menu/spicy_pizza.png',
      stockQuantity: 50,
      isActive: true
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
        { size: 'XL', price: 1650 }
      ],
      image: '/images/menu/cheese_pizza.png',
      stockQuantity: 50,
      isActive: true
    },
    {
      name: 'Chicken Fajeta Pizza',
      description: 'Fajita chicken patties, onions, bell peppers, and cheese',
      category: pizzaCat._id,
      basePrice: 500,
      sizes: [
        { size: 'S', price: 500 },
        { size: 'M', price: 900 },
        { size: 'L', price: 1250 },
        { size: 'XL', price: 1650 }
      ],
      image: '/images/menu/fajita_pizza.png',
      stockQuantity: 50,
      isActive: true
    },
    {
      name: 'B.B.Q Chicken Pizza',
      description: 'Grilled chicken chunks, BBQ sauce, onions, and cheese',
      category: pizzaCat._id,
      basePrice: 500,
      sizes: [
        { size: 'S', price: 500 },
        { size: 'M', price: 900 },
        { size: 'L', price: 1250 },
        { size: 'XL', price: 1650 }
      ],
      image: '/images/menu/bbq_pizza.png',
      stockQuantity: 50,
      isActive: true
    },
    {
      name: 'Chicken Achari Pizza',
      description: 'Achari chicken chunks, onions, and traditional pickle spices',
      category: pizzaCat._id,
      basePrice: 500,
      sizes: [
        { size: 'S', price: 500 },
        { size: 'M', price: 900 },
        { size: 'L', price: 1250 },
        { size: 'XL', price: 1650 }
      ],
      image: '/images/menu/spicy_pizza.png',
      stockQuantity: 50,
      isActive: true
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
        { size: 'XL', price: 1650 }
      ],
      image: '/images/menu/tikka_pizza.png',
      stockQuantity: 50,
      isActive: true
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
        { size: 'XL', price: 1650 }
      ],
      image: '/images/menu/special_pizza.png',
      stockQuantity: 50,
      isActive: true
    },

    // ─────────────────────────────────────────────
    // Premium Pizzas (Price Map: S:600, M:1100, L:1650, XL:1950)
    // ─────────────────────────────────────────────
    {
      name: 'Cheezka Special Pizza',
      description: 'Our signature loaded pizza with premium toppings',
      category: pizzaCat._id,
      basePrice: 600,
      sizes: [
        { size: 'S', price: 600 },
        { size: 'M', price: 1100 },
        { size: 'L', price: 1650 },
        { size: 'XL', price: 1950 }
      ],
      image: '/images/menu/special_pizza.png',
      stockQuantity: 50,
      isActive: true
    },
    {
      name: 'Crown Crust Pizza',
      description: 'Crown crust filled with cream cheese and topped with spicy chicken',
      category: pizzaCat._id,
      basePrice: 600,
      sizes: [
        { size: 'S', price: 600 },
        { size: 'M', price: 1100 },
        { size: 'L', price: 1650 },
        { size: 'XL', price: 1950 }
      ],
      image: '/images/menu/stuffed_crust.png',
      stockQuantity: 50,
      isActive: true
    },
    {
      name: 'Behari Kabab Pizza',
      description: 'Spicy behari chicken kababs, onions, and cheese',
      category: pizzaCat._id,
      basePrice: 600,
      sizes: [
        { size: 'S', price: 600 },
        { size: 'M', price: 1100 },
        { size: 'L', price: 1650 },
        { size: 'XL', price: 1950 }
      ],
      image: '/images/menu/kabab_pizza.png',
      stockQuantity: 50,
      isActive: true
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
        { size: 'XL', price: 1950 }
      ],
      image: '/images/menu/kabab_pizza.png',
      stockQuantity: 50,
      isActive: true
    },

    // ─────────────────────────────────────────────
    // Square Pizza (Price Map: M:1100, L:1650)
    // ─────────────────────────────────────────────
    {
      name: 'Square King Lazania Pizza',
      description: 'Square lasagna layers pizza with chicken, marinara, and cheese',
      category: pizzaCat._id,
      basePrice: 1100,
      sizes: [
        { size: 'M', price: 1100 },
        { size: 'L', price: 1650 }
      ],
      image: '/images/menu/stuffed_crust.png', // Fallback
      stockQuantity: 50,
      isActive: true
    }
  ];

  const seededProducts = await Product.create(productsData);
  console.log(`Successfully seeded ${seededProducts.length} menu items!`);

  // 4. Seed Special Deals
  console.log('Seeding Special Deals...');
  const dealsData = [
    {
      title: 'Special Cheezka Deal',
      description: '4 Zinger Burger + 1 Ltr Drink',
      dealPrice: 1350,
      originalPrice: 1500,
      discount: 10,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // active for 1 year
      isActive: true
    },
    {
      title: 'Family Combo',
      description: '1 Pizza Large + Half Pasta + 1 Ltr Drink',
      dealPrice: 1850,
      originalPrice: 2000,
      discount: 8,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true
    },
    {
      title: 'Mega Combo',
      description: '1 Spc Pizza Large + 1 Full Loaded Fries + 1.5 Ltr Drink',
      dealPrice: 2300,
      originalPrice: 2600,
      discount: 11,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true
    },
    {
      title: 'Quick Meal',
      description: '1 Small Pizza + 1 Chicken Shawarma + 1 Drinks 500ml',
      dealPrice: 730,
      originalPrice: 800,
      discount: 9,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true
    },
    {
      title: 'Burger Combo',
      description: '2 Patty Burger + 1 Med Fries + 1 Drink 500ml',
      dealPrice: 800,
      originalPrice: 910,
      discount: 12,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true
    },
    {
      title: 'Wing Lover',
      description: '1 Medium Pizza + 5 B.B.Q Wings + 1 Drink 500ml',
      dealPrice: 1150,
      originalPrice: 1300,
      discount: 11,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true
    },
    {
      title: 'Snack Combo',
      description: '1 Zinger Burger + 5 Hot Wings + 1 Fries + 1 Drink 500ml',
      dealPrice: 850,
      originalPrice: 950,
      discount: 10,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true
    },
    {
      title: 'Pizza Pair',
      description: '2 Medium Pizza + 1 Ltr Drink',
      dealPrice: 1950,
      originalPrice: 2200,
      discount: 11,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true
    },
    {
      title: 'Mini Deal',
      description: '1 Small Pizza + 1 Drink 500ml',
      dealPrice: 599,
      originalPrice: 650,
      discount: 8,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true
    },
    {
      title: 'Birthday Special Deal',
      description: '2 Large Pizza + 5 Nuggets + 10 Hot Wings + 1 Full Loaded Fries + 2 Pound Cake + 2.25Ltr Drink',
      dealPrice: 5300,
      originalPrice: 6000,
      discount: 11,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true
    }
  ];

  const seededDeals = await Deal.create(dealsData);
  console.log(`Successfully seeded ${seededDeals.length} special deals!`);

  await mongoose.disconnect();
  console.log('Database seeded successfully and disconnected.');
}

seed().catch(console.error);
