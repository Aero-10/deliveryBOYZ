import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Users, 
  Map as MapIcon, 
  Plus, 
  Settings, 
  RefreshCw, 
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Map from '../components/Map';
import OrderForm from '../components/OrderForm';
import { ordersAPI, staffAPI, assignAPI, warehouseAPI } from '../services/api';
import toast from 'react-hot-toast';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [staff, setStaff] = useState([]);
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [showRoutes, setShowRoutes] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, staffRes, warehouseRes] = await Promise.all([
        ordersAPI.getAll(),
        staffAPI.getAll(),
        warehouseAPI.get()
      ]);

      setOrders(ordersRes.data.data || []);
      setStaff(staffRes.data.data || []);
      setWarehouse(warehouseRes.data.data);
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (orderData) => {
    try {
      const response = await ordersAPI.create(orderData);
      setOrders(prev => [response.data.data, ...prev]);
      setShowOrderForm(false);
      toast.success('Order created successfully');
    } catch (error) {
      toast.error('Failed to create order');
    }
  };

  const handleUpdateOrder = async (orderData) => {
    try {
      const response = await ordersAPI.update(editingOrder._id, orderData);
      setOrders(prev => prev.map(order => 
        order._id === editingOrder._id ? response.data.data : order
      ));
      setShowOrderForm(false);
      setEditingOrder(null);
      toast.success('Order updated successfully');
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    
    try {
      await ordersAPI.delete(orderId);
      setOrders(prev => prev.filter(order => order._id !== orderId));
      toast.success('Order deleted successfully');
    } catch (error) {
      toast.error('Failed to delete order');
    }
  };

  const handleOptimizeRoutes = async () => {
    try {
      setLoading(true);
      await assignAPI.assignOrders();
      await fetchData(); // Refresh data after optimization
      toast.success('Routes optimized successfully');
    } catch (error) {
      toast.error('Failed to optimize routes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'status-pending', text: 'Pending' },
      assigned: { color: 'status-assigned', text: 'Assigned' },
      picked: { color: 'status-picked', text: 'Picked' },
      delivered: { color: 'status-delivered', text: 'Delivered' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status };
    return <span className={`status-badge ${config.color}`}>{config.text}</span>;
  };

  const handleCreateStaff = async (staffData) => {
    try {
      const response = await staffAPI.create(staffData);
      setStaff(prev => [response.data.data, ...prev]);
      setShowStaffForm(false);
      toast.success('Staff member created successfully');
    } catch (error) {
      toast.error('Failed to create staff member');
    }
  };

  const handleUpdateStaff = async (staffData) => {
    try {
      const response = await staffAPI.update(editingStaff._id, staffData);
      setStaff(prev => prev.map(staffMember => 
        staffMember._id === editingStaff._id ? response.data.data : staffMember
      ));
      setShowStaffForm(false);
      setEditingStaff(null);
      toast.success('Staff member updated successfully');
    } catch (error) {
      toast.error('Failed to update staff member');
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;
    
    try {
      await staffAPI.delete(staffId);
      setStaff(prev => prev.filter(staffMember => staffMember._id !== staffId));
      toast.success('Staff member deleted successfully');
    } catch (error) {
      toast.error('Failed to delete staff member');
    }
  };

  const handleCreateWarehouse = async (warehouseData) => {
    try {
      const response = await warehouseAPI.create(warehouseData);
      setWarehouse(response.data.data);
      setShowWarehouseForm(false);
      toast.success('Warehouse created successfully');
    } catch (error) {
      toast.error('Failed to create warehouse');
    }
  };

  const handleUpdateWarehouse = async (warehouseData) => {
    try {
      const response = await warehouseAPI.create(warehouseData); // Using create for update since it handles both
      setWarehouse(response.data.data);
      setShowWarehouseForm(false);
      toast.success('Warehouse updated successfully');
    } catch (error) {
      toast.error('Failed to update warehouse');
    }
  };

  const tabs = [
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'map', label: 'Map View', icon: MapIcon },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const renderOrdersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Orders Management</h2>
        <div className="flex gap-2">
          <button
            onClick={handleOptimizeRoutes}
            disabled={loading}
            className="btn btn-primary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Optimize Routes
          </button>
          <button
            onClick={() => setShowOrderForm(true)}
            className="btn btn-success flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Order
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.name}</div>
                      <div className="text-sm text-gray-500">{order.phoneNo}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {order.address.text}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {order.items.join(', ')}
                    </div>
                    <div className="text-sm text-gray-500">
                      Demand: {order.demand}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.assignedTo?.name || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingOrder(order);
                          setShowOrderForm(true);
                        }}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderStaffTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Staff Management</h2>
        <button
          onClick={() => setShowStaffForm(true)}
          className="btn btn-success flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((staffMember) => (
          <div key={staffMember._id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{staffMember.name}</h3>
              <div className={`w-3 h-3 rounded-full ${staffMember.available ? 'bg-green-500' : 'bg-yellow-500'}`} />
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Phone: {staffMember.phoneNo}</p>
              <p>Capacity: {staffMember.capacity}</p>
              <p>Assigned Orders: {staffMember.assignedOrders?.length || 0}</p>
              <p>Status: {staffMember.available ? 'Available' : 'Busy'}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setEditingStaff(staffMember);
                  setShowStaffForm(true);
                }}
                className="btn btn-primary text-sm"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setSelectedStaffId(staffMember._id);
                  setActiveTab('map');
                  setShowRoutes(true);
                }}
                className="btn btn-outline text-sm"
              >
                View Route
              </button>
              <button
                onClick={() => handleDeleteStaff(staffMember._id)}
                className="btn btn-danger text-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMapTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Map View</h2>
        <div className="flex gap-2">
          <select
            value={selectedStaffId || ''}
            onChange={(e) => setSelectedStaffId(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Staff</option>
            {staff.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
          <button
            onClick={() => setShowRoutes(!showRoutes)}
            className={`btn ${showRoutes ? 'btn-success' : 'btn-outline'}`}
          >
            {showRoutes ? 'Hide Routes' : 'Show Routes'}
          </button>
        </div>
      </div>

      <div className="h-[600px] bg-white rounded-lg shadow">
        <Map
          orders={orders}
          staff={staff}
          warehouse={warehouse}
          selectedStaffId={selectedStaffId}
          showRoutes={showRoutes}
          onOrderClick={(order) => {
            setEditingOrder(order);
            setShowOrderForm(true);
          }}
          onStaffClick={(staffMember) => {
            setSelectedStaffId(staffMember._id);
            setShowRoutes(true);
          }}
        />
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
        <button
          onClick={() => setShowWarehouseForm(true)}
          className="btn btn-success flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {warehouse ? 'Edit Warehouse' : 'Add Warehouse'}
        </button>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Warehouse Configuration</h3>
        {warehouse ? (
          <div className="space-y-2">
            <p><strong>Name:</strong> {warehouse.name}</p>
            <p><strong>Address:</strong> {warehouse.address}</p>
            <p><strong>Location:</strong> {warehouse.location.lat}, {warehouse.location.lng}</p>
          </div>
        ) : (
          <p className="text-gray-500">No warehouse configured</p>
        )}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'orders':
        return renderOrdersTab();
      case 'staff':
        return renderStaffTab();
      case 'map':
        return renderMapTab();
      case 'settings':
        return renderSettingsTab();
      default:
        return renderOrdersTab();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Delivery System Admin</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {orders.filter(o => o.status === 'pending').length} pending orders
              </span>
              <span className="text-sm text-gray-500">
                {staff.filter(s => s.available).length} available staff
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </main>

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <OrderForm
              order={editingOrder}
              onSubmit={editingOrder ? handleUpdateOrder : handleCreateOrder}
              onCancel={() => {
                setShowOrderForm(false);
                setEditingOrder(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Staff Form Modal */}
      {showStaffForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <StaffForm
              staff={editingStaff}
              onSubmit={editingStaff ? handleUpdateStaff : handleCreateStaff}
              onCancel={() => {
                setShowStaffForm(false);
                setEditingStaff(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Warehouse Form Modal */}
      {showWarehouseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <WarehouseForm
              warehouse={warehouse}
              onSubmit={warehouse ? handleUpdateWarehouse : handleCreateWarehouse}
              onCancel={() => {
                setShowWarehouseForm(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Staff Form Component
const StaffForm = ({ staff, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: staff?.name || '',
    phoneNo: staff?.phoneNo || '',
    capacity: staff?.capacity || 1
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">
        {staff ? 'Edit Staff Member' : 'Add New Staff Member'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter staff name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            required
            value={formData.phoneNo}
            onChange={(e) => setFormData(prev => ({ ...prev, phoneNo: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter phone number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Capacity *
          </label>
          <input
            type="number"
            required
            min="1"
            value={formData.capacity}
            onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter capacity"
          />
        </div>
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-success flex-1"
          >
            {loading ? 'Saving...' : (staff ? 'Update' : 'Create')}
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

// Warehouse Form Component
const WarehouseForm = ({ warehouse, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: warehouse?.name || '',
    address: warehouse?.address || '',
    location: warehouse?.location || { lat: '', lng: '' }
  });
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const handleAddressChange = async (address) => {
    setFormData(prev => ({ ...prev, address }));
    
    if (address.length > 5) {
      setGeocoding(true);
      try {
        const response = await fetch(`http://localhost:8080/api/geocode?q=${encodeURIComponent(address)}`);
        const data = await response.json();
        
        if (data && data.length > 0) {
          const result = data[0];
          setFormData(prev => ({
            ...prev,
            location: {
              lat: parseFloat(result.lat),
              lng: parseFloat(result.lon)
            }
          }));
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      } finally {
        setGeocoding(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.location.lat || !formData.location.lng) {
      toast.error('Please enter a valid address to get coordinates');
      return;
    }
    
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">
        {warehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter warehouse name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address *
          </label>
          <input
            type="text"
            required
            value={formData.address}
            onChange={(e) => handleAddressChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter warehouse address"
          />
          {geocoding && (
            <p className="text-sm text-blue-600 mt-1">Getting coordinates...</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              value={formData.location.lat}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                location: { ...prev.location, lat: parseFloat(e.target.value) || '' }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Latitude"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              value={formData.location.lng}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                location: { ...prev.location, lng: parseFloat(e.target.value) || '' }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Longitude"
            />
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-success flex-1"
          >
            {loading ? 'Saving...' : (warehouse ? 'Update' : 'Create')}
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

export default Admin; 