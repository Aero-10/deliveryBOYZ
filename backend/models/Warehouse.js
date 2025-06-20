import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'Main Warehouse'
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for location queries
warehouseSchema.index({ 'location.lat': 1, 'location.lng': 1 });

const Warehouse = mongoose.model('Warehouse', warehouseSchema);

export default Warehouse; 