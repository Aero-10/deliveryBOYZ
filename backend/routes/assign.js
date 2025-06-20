import express from 'express';
import Order from '../models/Order.js';
import Staff from '../models/Staff.js';
import Warehouse from '../models/Warehouse.js';
import { runCVRPOptimization, prepareCVRPData, processCVRPResults, validateCVRPInput } from '../services/cvrpService.js';

const router = express.Router();

// POST /assign - Assign orders to staff using CVRP
router.post('/', async (req, res) => {
  try {
    // Get all unassigned, pending orders
    const orders = await Order.find({ status: 'pending', assignedTo: null });
    // Get all available staff
    const staff = await Staff.find({ available: true });
    // Get warehouse (assume only one active)
    const warehouse = await Warehouse.findOne({ isActive: true });

    validateCVRPInput(orders, staff, warehouse);
    const cvrpInput = prepareCVRPData(orders, staff, warehouse);
    const cvrpResult = await runCVRPOptimization(cvrpInput);
    const assignment = processCVRPResults(cvrpResult, staff, orders);

    // Update DB: assign orders and update staff routes
    for (const [staffId, data] of Object.entries(assignment.assignments)) {
      await Staff.findByIdAndUpdate(staffId, {
        assignedOrders: data.assignedOrders,
        currentRoute: data.route,
        available: false,
        isAtWarehouse: false
      });
      await Order.updateMany(
        { _id: { $in: data.assignedOrders } },
        { assignedTo: staffId, status: 'assigned' }
      );
    }

    res.json({
      success: true,
      assignment,
      message: 'Orders assigned and routes optimized.'
    });
  } catch (error) {
    console.error('CVRP assignment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to assign orders.'
    });
  }
});

export default router; 