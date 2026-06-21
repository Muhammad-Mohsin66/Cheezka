const express = require('express');
const router = express.Router();
const uploadProductImage = require('../middleware/uploadProduct');
const { protect, authorizeRoles } = require('../middleware/auth');
const path = require('path');

// Upload product image (Admin/Employee only)
router.post(
  '/product',
  protect,
  authorizeRoles('admin', 'employee'),
  uploadProductImage.single('image'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a valid image file.' });
    }

    // The image path from Cloudinary
    const imagePath = req.file.path;

    res.status(201).json({
      success: true,
      message: 'Product image uploaded successfully.',
      url: imagePath,
    });
  }
);

module.exports = router;
