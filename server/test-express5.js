const express = require('express');
const app = express();
app.get('/', async (req, res) => {
  throw new Error("My custom error");
});
app.listen(5556, async () => {
  try {
    const res = await fetch('http://localhost:5556/', { headers: { 'Accept': 'application/json' } });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Data:", text);
  } catch (err) {
    console.log("Fetch error:", err);
  }
  process.exit(0);
});
