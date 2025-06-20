import express from 'express';
import Order from '../models/Order.js';
import Staff from '../models/Staff.js';

const router = express.Router();

// POST /pick - Mark an order as picked
router.post('/', async (req, res) => {
  try {
    const { orderId, staffId } = req.body;
    if (!orderId || !staffId) {
      return res.status(400).json({ success: false, message: 'orderId and staffId required' });
    }
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'assigned') return res.status(400).json({ success: false, message: 'Order must be assigned before picking' });
    order.status = 'picked';
    order.pickupTime = new Date();
    await order.save();
    // Update staff's currentRoute status
    const staff = await Staff.findById(staffId);
    if (staff) {
      staff.currentRoute = staff.currentRoute.map(rp =>
        rp.orderId && rp.orderId.toString() === orderId ? { ...rp.toObject(), status: 'picked' } : rp
      );
      await staff.save();
    }
    res.json({ success: true, message: 'Order marked as picked' });
  } catch (error) {
    console.error('Pick error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router; 