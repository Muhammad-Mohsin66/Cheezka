const DeliveryZone = require('../models/DeliveryZone');
const AppError = require('../utils/AppError');
const { createAuditEntry } = require('./auditLogController');

/**
 * GET /api/delivery-zones
 * List all delivery zones
 */
exports.getAllZones = async (req, res, next) => {
  try {
    const { active, search } = req.query;
    const filter = {};
    if (active === 'true') filter.isActive = true;
    if (active === 'false') filter.isActive = false;
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const zones = await DeliveryZone.find(filter).sort({ name: 1 });

    res.status(200).json({ success: true, count: zones.length, data: zones });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/delivery-zones/:id
 */
exports.getZoneById = async (req, res, next) => {
  try {
    const zone = await DeliveryZone.findById(req.params.id);
    if (!zone) return next(new AppError('Delivery zone not found', 404));
    res.status(200).json({ success: true, data: zone });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/delivery-zones
 * Create a delivery zone (admin only)
 */
exports.createZone = async (req, res, next) => {
  try {
    const { name, description, baseCharge, perKmRate, estimatedTime, coordinates, radius } = req.body;

    if (!name || baseCharge === undefined || perKmRate === undefined || !estimatedTime || !radius) {
      return next(new AppError('Name, base charge, per-km rate, estimated time, and radius are required', 400));
    }

    const zone = await DeliveryZone.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      baseCharge,
      perKmRate,
      estimatedTime,
      coordinates: coordinates || { type: 'Point', coordinates: [0, 0] },
      radius,
    });

    // Create Audit Log
    await createAuditEntry(req, 'create', 'DeliveryZone', zone._id, zone.name);

    res.status(201).json({ success: true, message: 'Delivery zone created successfully', data: zone });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/delivery-zones/:id
 * Update a delivery zone (admin only)
 */
exports.updateZone = async (req, res, next) => {
  try {
    const { name, description, baseCharge, perKmRate, estimatedTime, coordinates, radius, isActive } = req.body;
    const zone = await DeliveryZone.findById(req.params.id);
    if (!zone) return next(new AppError('Delivery zone not found', 404));

    if (name) zone.name = name.trim();
    if (description !== undefined) zone.description = description;
    if (baseCharge !== undefined) zone.baseCharge = baseCharge;
    if (perKmRate !== undefined) zone.perKmRate = perKmRate;
    if (estimatedTime !== undefined) zone.estimatedTime = estimatedTime;
    if (coordinates) zone.coordinates = coordinates;
    if (radius !== undefined) zone.radius = radius;
    if (isActive !== undefined) zone.isActive = isActive;

    await zone.save();

    // Create Audit Log
    await createAuditEntry(req, 'update', 'DeliveryZone', zone._id, zone.name);

    res.status(200).json({ success: true, message: 'Delivery zone updated successfully', data: zone });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/delivery-zones/:id/toggle
 */
exports.toggleZone = async (req, res, next) => {
  try {
    const zone = await DeliveryZone.findById(req.params.id);
    if (!zone) return next(new AppError('Delivery zone not found', 404));
    zone.isActive = !zone.isActive;
    await zone.save();

    // Create Audit Log
    await createAuditEntry(req, 'update', 'DeliveryZone', zone._id, zone.name);

    res.status(200).json({ success: true, message: `Zone ${zone.isActive ? 'activated' : 'deactivated'}`, data: zone });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/delivery-zones/:id
 */
exports.deleteZone = async (req, res, next) => {
  try {
    const zone = await DeliveryZone.findById(req.params.id);
    if (!zone) return next(new AppError('Delivery zone not found', 404));
    
    const zoneName = zone.name;
    const zoneId = zone._id;
    await zone.deleteOne();

    // Create Audit Log
    await createAuditEntry(req, 'delete', 'DeliveryZone', zoneId, zoneName);

    res.status(200).json({ success: true, message: 'Delivery zone deleted successfully' });
  } catch (error) {
    next(error);
  }
};
