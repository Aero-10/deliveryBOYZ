import express from 'express';
import Order from '../models/Order.js';
import { geocodeAddress, validateCoordinates } from '../utils/mapsService.js';

const router = express.Router();

// Get all orders
router.get('/', async (req, res) => {
  try {
    const { status, assignedTo, limit = 50, page = 1 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    
    const skip = (page - 1) * limit;
    
    const orders = await Order.find(filter)
      .populate('assignedTo', 'name phoneNo')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Order.countDocuments(filter);
    
    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('assignedTo', 'name phoneNo');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    const { name, phoneNo, demand, items, address } = req.body;
    
    // Validate required fields
    if (!name || !phoneNo || !demand || !items || !address) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Geocode address if coordinates not provided
    let geocodedAddress = address;
    if (!address.lat || !address.lng) {
      try {
        const geocoded = await geocodeAddress(address.text);
        geocodedAddress = {
          text: geocoded.formattedAddress,
          lat: geocoded.lat,
          lng: geocoded.lng
        };
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid address provided'
        });
      }
    }
    
    // Validate coordinates
    if (!validateCoordinates(geocodedAddress.lat, geocodedAddress.lng)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }
    
    const order = new Order({
      name,
      phoneNo,
      demand: parseFloat(demand),
      items: Array.isArray(items) ? items : [items],
      address: geocodedAddress
    });
    
    await order.save();
    
    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// Update order
router.put('/:id', async (req, res) => {
  try {
    const { name, phoneNo, demand, items, address, status } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phoneNo) updateData.phoneNo = phoneNo;
    if (demand) updateData.demand = parseFloat(demand);
    if (items) updateData.items = Array.isArray(items) ? items : [items];
    if (status) updateData.status = status;
    
    // Handle address update with geocoding
    if (address) {
      let geocodedAddress = address;
      if (!address.lat || !address.lng) {
        try {
          const geocoded = await geocodeAddress(address.text);
          geocodedAddress = {
            text: geocoded.formattedAddress,
            lat: geocoded.lat,
            lng: geocoded.lng
          };
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: 'Invalid address provided'
          });
        }
      }
      
      if (!validateCoordinates(geocodedAddress.lat, geocodedAddress.lng)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coordinates'
        });
      }
      
      updateData.address = geocodedAddress;
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name phoneNo');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      data: order,
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
    });
  }
});

// Delete order
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      error: error.message
    });
  }
});

// Get pending orders (for CVRP optimization)
router.get('/pending/optimization', async (req, res) => {
  try {
    const pendingOrders = await Order.find({ 
      status: 'pending',
      assignedTo: null 
    }).select('_id address demand');
    
    res.json({
      success: true,
      data: pendingOrders
    });
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending orders',
      error: error.message
    });
  }
});

// Bulk update order status
router.patch('/bulk-status', async (req, res) => {
  try {
    const { orderIds, status } = req.body;
    
    if (!orderIds || !Array.isArray(orderIds) || !status) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data'
      });
    }
    
    const updateData = { status };
    
    // Add timestamps for specific statuses
    if (status === 'picked') {
      updateData.pickupTime = new Date();
    } else if (status === 'delivered') {
      updateData.deliveryTime = new Date();
    }
    
    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
      updateData
    );
    
    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} orders to ${status}`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk updating orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update orders',
      error: error.message
    });
  }
});

export default router; 