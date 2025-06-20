import express from 'express';
import Warehouse from '../models/Warehouse.js';

const router = express.Router();

// Get warehouse info
router.get('/', async (req, res) => {
  try {
    const warehouse = await Warehouse.findOne({ isActive: true });
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    res.json({ success: true, data: warehouse });
  } catch (error) {
    console.error('Warehouse error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create or update warehouse
router.post('/', async (req, res) => {
  try {
    const { name, address, location } = req.body;
    if (!address || !location || !location.lat || !location.lng) {
      return res.status(400).json({ success: false, message: 'Address and location required' });
    }
    let warehouse = await Warehouse.findOne({ isActive: true });
    if (warehouse) {
      warehouse.name = name || warehouse.name;
      warehouse.address = address;
      warehouse.location = location;
      await warehouse.save();
    } else {
      warehouse = await Warehouse.create({ name, address, location });
    }
    res.json({ success: true, data: warehouse, message: 'Warehouse saved' });
  } catch (error) {
    console.error('Warehouse save error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router; 