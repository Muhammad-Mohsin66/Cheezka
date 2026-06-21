import axios from 'axios';
(async () => {
  try {
    const res = await axios.put('http://localhost:5001/api/products/664a7812f8a452a265691079', {
      name: "Omelette Burger",
      description: "Describe the product...",
      basePrice: 150,
      stockQuantity: 95,
      lowStockThreshold: 5,
      image: "",
      isActive: true,
      sizes: [{ size: "Medium (M)", price: 150 }]
    }, {
      headers: {
        'X-Session-Type': 'staff',
      }
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.log("Error status:", err.response?.status);
    console.log("Error data:", err.response?.data);
    console.log("Error message:", err.message);
  }
})();
