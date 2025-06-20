import React, { useState, useEffect } from 'react';
import { Package, User, Phone, MapPin, Plus, X } from 'lucide-react';

const OrderForm = ({ order = null, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: order?.name || '',
    phoneNo: order?.phoneNo || '',
    demand: order?.demand || '',
    items: order?.items || [''],
    address: order?.address || { text: '', lat: null, lng: null }
  });

  const [addressInput, setAddressInput] = useState(order?.address?.text || '');
  const [debouncedAddress, setDebouncedAddress] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedAddress(addressInput);
    }, 500); // 500ms debounce delay
    return () => clearTimeout(handler);
  }, [addressInput]);

  // Fetch geocoding suggestions when debouncedAddress changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedAddress.length > 3) {
        setGeocoding(true);
        try {
          const response = await fetch(`http://localhost:8080/api/geocode?q=${encodeURIComponent(debouncedAddress)}`);
          const data = await response.json();
          setAddressSuggestions(data);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Geocoding error:', error);
        } finally {
          setGeocoding(false);
        }
      } else {
        setAddressSuggestions([]);
        setShowSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedAddress]);

  const handleAddressChange = (address) => {
    setAddressInput(address);
    setFormData(prev => ({ ...prev, address: { ...prev.address, text: address } }));
  };

  const selectAddress = (suggestion) => {
    const fullText = suggestion.display_name;
    setAddressInput(fullText);
    setFormData(prev => ({
      ...prev,
      address: {
        text: fullText,
        lat: parseFloat(suggestion.lat),
        lng: parseFloat(suggestion.lon)
      }
    }));
    setAddressSuggestions([]);
    setShowSuggestions(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleItemChange = (index, value) => {
    const newItems = [...formData.items];
    newItems[index] = value;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({ ...prev, items: [...prev.items, ''] }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, items: newItems }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Customer name is required';
    if (!formData.phoneNo.trim()) newErrors.phoneNo = 'Phone number is required';
    else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.phoneNo.replace(/\s/g, ''))) newErrors.phoneNo = 'Invalid phone number format';
    if (!formData.demand || formData.demand <= 0) newErrors.demand = 'Demand must be greater than 0';
    if (!formData.address.text.trim()) newErrors.address = 'Address is required';
    if (!formData.address.lat || !formData.address.lng) newErrors.address = 'Please select a valid address from the suggestions';
    const validItems = formData.items.filter(item => item.trim());
    if (validItems.length === 0) newErrors.items = 'At least one item is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        items: formData.items.filter(item => item.trim()),
        demand: parseFloat(formData.demand)
      };
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {order ? 'Edit Order' : 'Create New Order'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline w-4 h-4 mr-1" /> Customer Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter customer name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="inline w-4 h-4 mr-1" /> Phone Number
            </label>
            <input
              type="tel"
              value={formData.phoneNo}
              onChange={(e) => handleInputChange('phoneNo', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${errors.phoneNo ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter phone number"
            />
            {errors.phoneNo && <p className="text-red-500 text-sm mt-1">{errors.phoneNo}</p>}
          </div>
        </div>

        {/* Address */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="inline w-4 h-4 mr-1" /> Delivery Address
          </label>
          <input
            type="text"
            value={addressInput}
            onChange={(e) => handleAddressChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter delivery address"
            autoComplete="off"
          />
          {geocoding && <p className="text-sm text-blue-600 mt-1">Searching for addresses...</p>}
          {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
          {formData.address.lat && formData.address.lng && (
            <p className="text-green-600 text-sm mt-1">
              ✓ Address coordinates: {formData.address.lat.toFixed(6)}, {formData.address.lng.toFixed(6)}
            </p>
          )}
          {showSuggestions && addressSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {addressSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectAddress(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
                >
                  <div className="font-medium">{suggestion.display_name.split(',')[0]}</div>
                  <div className="text-sm text-gray-600">{suggestion.display_name}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Demand */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Package className="inline w-4 h-4 mr-1" /> Demand (Weight/Volume)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={formData.demand}
            onChange={(e) => handleInputChange('demand', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg ${errors.demand ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter demand (e.g., 5.5 kg)"
          />
          {errors.demand && <p className="text-red-500 text-sm mt-1">{errors.demand}</p>}
        </div>

        {/* Items */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Package className="inline w-4 h-4 mr-1" /> Items
          </label>
          <div className="space-y-2">
            {formData.items.map((item, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleItemChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder={`Item ${index + 1}`}
                />
                {formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
          {errors.items && <p className="text-red-500 text-sm mt-1">{errors.items}</p>}
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-success flex-1"
          >
            {isSubmitting ? 'Creating...' : (order ? 'Update Order' : 'Create Order')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;
