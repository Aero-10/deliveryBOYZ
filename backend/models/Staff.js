import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phoneNo: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  available: {
    type: Boolean,
    default: true
  },
  assignedOrders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  currentLocation: {
    lat: {
      type: Number,
      default: null
    },
    lng: {
      type: Number,
      default: null
    }
  },
  currentRoute: [{
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    lat: Number,
    lng: Number,
    address: String,
    status: {
      type: String,
      enum: ['pending', 'picked', 'delivered'],
      default: 'pending'
    }
  }],
  isAtWarehouse: {
    type: Boolean,
    default: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
staffSchema.index({ available: 1, capacity: 1 });
staffSchema.index({ phoneNo: 1 });

const Staff = mongoose.model('Staff', staffSchema);

export default Staff; 