// Menu Item Model - Placeholder
const menuItemSchema = {
  name: String,
  description: String,
  category: String,
  price: Number,
  image: String,
  availability: {
    type: Boolean,
    default: true,
  },
  inventory: {
    quantity: Number,
    minStock: Number,
  },
  createdAt: Date,
  updatedAt: Date,
};

module.exports = { menuItemSchema };
