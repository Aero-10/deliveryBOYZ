import express from 'express';
import Order from '../models/Order.js';
import Staff from '../models/Staff.js';
import DeliveryHistory from '../models/DeliveryHistory.js';
import Warehouse from '../models/Warehouse.js';

const router = express.Router();

// POST /deliver - Mark an order as delivered
router.post('/', async (req, res) => {
  try {
    const { orderId, staffId } = req.body;
    if (!orderId || !staffId) {
      return res.status(400).json({ success: false, message: 'orderId and staffId required' });
    }
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'picked') return res.status(400).json({ success: false, message: 'Order must be picked before delivery' });
    order.status = 'delivered';
    order.deliveryTime = new Date();
    await order.save();
    // Remove from staff's assignedOrders
    const staff = await Staff.findById(staffId);
    if (staff) {
      staff.assignedOrders = staff.assignedOrders.filter(id => id.toString() !== orderId);
      // Update currentRoute status
      staff.currentRoute = staff.currentRoute.map(rp =>
        rp.orderId && rp.orderId.toString() === orderId ? { ...rp.toObject(), status: 'delivered' } : rp
      );
      await staff.save();
    }
    // If all orders delivered, mark staff as available and create DeliveryHistory
    const remaining = await Order.countDocuments({ assignedTo: staffId, status: { $in: ['assigned', 'picked'] } });
    if (remaining === 0 && staff) {
      staff.available = true;
      staff.isAtWarehouse = true;
      await staff.save();
      // Save delivery history
      await DeliveryHistory.create({
        staffId,
        orderIds: staff.assignedOrders,
        route: staff.currentRoute,
        completedAt: new Date()
      });
    }
    res.json({ success: true, message: 'Order marked as delivered' });
  } catch (error) {
    console.error('Deliver error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router; 