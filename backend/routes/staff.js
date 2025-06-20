import express from 'express';
import Staff from '../models/Staff.js';
import Order from '../models/Order.js';

const router = express.Router();

// Get all staff
router.get('/', async (req, res) => {
  try {
    const { available, limit = 50, page = 1 } = req.query;
    
    const filter = {};
    if (available !== undefined) filter.available = available === 'true';
    
    const skip = (page - 1) * limit;
    
    const staff = await Staff.find(filter)
      .populate('assignedOrders', 'name address status')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Staff.countDocuments(filter);
    
    res.json({
      success: true,
      data: staff,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff',
      error: error.message
    });
  }
});

// Get single staff member
router.get('/:id', async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id)
      .populate('assignedOrders', 'name address status demand items');
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }
    
    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('Error fetching staff member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff member',
      error: error.message
    });
  }
});

// Create new staff member
router.post('/', async (req, res) => {
  try {
    const { name, phoneNo, capacity } = req.body;
    
    // Validate required fields
    if (!name || !phoneNo || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Check if phone number already exists
    const existingStaff = await Staff.findOne({ phoneNo });
    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already registered'
      });
    }
    
    const staff = new Staff({
      name,
      phoneNo,
      capacity: parseInt(capacity)
    });
    
    await staff.save();
    
    res.status(201).json({
      success: true,
      data: staff,
      message: 'Staff member created successfully'
    });
  } catch (error) {
    console.error('Error creating staff member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create staff member',
      error: error.message
    });
  }
});

// Update staff member
router.put('/:id', async (req, res) => {
  try {
    const { name, phoneNo, capacity, available, currentLocation } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phoneNo) updateData.phoneNo = phoneNo;
    if (capacity) updateData.capacity = parseInt(capacity);
    if (available !== undefined) updateData.available = available;
    if (currentLocation) updateData.currentLocation = currentLocation;
    
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedOrders', 'name address status');
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }
    
    res.json({
      success: true,
      data: staff,
      message: 'Staff member updated successfully'
    });
  } catch (error) {
    console.error('Error updating staff member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update staff member',
      error: error.message
    });
  }
});

// Delete staff member
router.delete('/:id', async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }
    
    // Check if staff has assigned orders
    if (staff.assignedOrders.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete staff member with assigned orders'
      });
    }
    
    await Staff.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting staff member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete staff member',
      error: error.message
    });
  }
});

// Get available staff (for CVRP optimization)
router.get('/available/optimization', async (req, res) => {
  try {
    const availableStaff = await Staff.find({ 
      available: true 
    }).select('_id capacity currentLocation');
    
    res.json({
      success: true,
      data: availableStaff
    });
  } catch (error) {
    console.error('Error fetching available staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available staff',
      error: error.message
    });
  }
});

// Update staff location
router.patch('/:id/location', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }
    
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      {
        currentLocation: { lat: parseFloat(lat), lng: parseFloat(lng) },
        lastActive: new Date()
      },
      { new: true }
    );
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }
    
    res.json({
      success: true,
      data: staff,
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Error updating staff location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
});

// Get staff route
router.get('/:id/route', async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id)
      .populate('assignedOrders', 'name address status demand items');
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }
    
    // Get current route with order details
    const routeWithDetails = await Promise.all(
      staff.currentRoute.map(async (routePoint) => {
        if (routePoint.orderId) {
          const order = await Order.findById(routePoint.orderId);
          return {
            ...routePoint.toObject(),
            orderDetails: order
          };
        }
        return routePoint;
      })
    );
    
    res.json({
      success: true,
      data: {
        staff: staff,
        route: routeWithDetails
      }
    });
  } catch (error) {
    console.error('Error fetching staff route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch route',
      error: error.message
    });
  }
});

// Update staff route
router.patch('/:id/route', async (req, res) => {
  try {
    const { route } = req.body;
    
    if (!route || !Array.isArray(route)) {
      return res.status(400).json({
        success: false,
        message: 'Route must be an array'
      });
    }
    
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { currentRoute: route },
      { new: true }
    ).populate('assignedOrders', 'name address status');
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }
    
    res.json({
      success: true,
      data: staff,
      message: 'Route updated successfully'
    });
  } catch (error) {
    console.error('Error updating staff route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update route',
      error: error.message
    });
  }
});

// Mark staff as available/unavailable
router.patch('/:id/availability', async (req, res) => {
  try {
    const { available } = req.body;
    
    if (available === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Availability status is required'
      });
    }
    
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { available },
      { new: true }
    ).populate('assignedOrders', 'name address status');
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }
    
    res.json({
      success: true,
      data: staff,
      message: `Staff member marked as ${available ? 'available' : 'unavailable'}`
    });
  } catch (error) {
    console.error('Error updating staff availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update availability',
      error: error.message
    });
  }
});

export default router; 