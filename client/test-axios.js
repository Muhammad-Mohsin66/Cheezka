const axios = require('axios');
axios.put('http://localhost:5000/api/products/123').catch(err => {
  console.log("err.message:", err.message);
  console.log("err.response?.data:", err.response?.data);
  console.log("err.response?.data?.message:", err.response?.data?.message);
  console.log("err.response?.statusText:", err.response?.statusText);
});
