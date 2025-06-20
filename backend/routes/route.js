import express from 'express';
import Staff from '../models/Staff.js';
import Warehouse from '../models/Warehouse.js';
import { getOptimizedRoute } from '../utils/mapsService.js';

const router = express.Router();

// GET /route/:staffId - Get optimized route for staff
router.get('/:staffId', async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.staffId).populate('assignedOrders');
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    const warehouse = await Warehouse.findOne({ isActive: true });
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    const waypoints = staff.assignedOrders.map(order => ({ lat: order.address.lat, lng: order.address.lng }));
    const origin = { lat: warehouse.location.lat, lng: warehouse.location.lng };
    const destination = origin;
    const route = await getOptimizedRoute(waypoints, origin, destination);
    res.json({ success: true, route });
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router; 