const express = require('express');
const router = express.Router();
router.get('/force-error', (req, res, next) => {
  next(new Error('This is a forced error to test the error handler'));
});
module.exports = router;
