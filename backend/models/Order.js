import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phoneNo: {
    type: String,
    required: true,
    trim: true
  },
  demand: {
    type: Number,
    required: true,
    min: 0
  },
  items: [{
    type: String,
    required: true
  }],
  address: {
    text: {
      type: String,
      required: true
    },
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'picked', 'delivered'],
    default: 'pending'
  },
  pickupTime: {
    type: Date,
    default: null
  },
  deliveryTime: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
orderSchema.index({ status: 1, assignedTo: 1 });
orderSchema.index({ 'address.lat': 1, 'address.lng': 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order; 