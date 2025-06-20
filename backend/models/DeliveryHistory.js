import mongoose from 'mongoose';

const deliveryHistorySchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  orderIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  }],
  route: [{
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    action: {
      type: String,
      enum: ['pickup', 'delivery', 'return'],
      required: true
    }
  }],
  totalDistance: {
    type: Number,
    default: 0
  },
  totalTime: {
    type: Number, // in minutes
    default: 0
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  performance: {
    ordersDelivered: {
      type: Number,
      default: 0
    },
    onTimeDeliveries: {
      type: Number,
      default: 0
    },
    averageDeliveryTime: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
deliveryHistorySchema.index({ staffId: 1, completedAt: -1 });
deliveryHistorySchema.index({ completedAt: -1 });

const DeliveryHistory = mongoose.model('DeliveryHistory', deliveryHistorySchema);

export default DeliveryHistory; 