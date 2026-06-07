const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth');
const dealsController = require('../controllers/dealsController');

router.get('/', dealsController.getAllDeals);                                          // Public
router.get('/:id', dealsController.getDealById);                                      // Public

router.post('/', protect, authorizeRoles('admin'), dealsController.createDeal);
router.put('/:id', protect, authorizeRoles('admin'), dealsController.updateDeal);
router.patch('/:id/toggle', protect, authorizeRoles('admin'), dealsController.toggleDeal);
router.delete('/:id', protect, authorizeRoles('admin'), dealsController.deleteDeal);

module.exports = router;
