import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Map as MapIcon, 
  CheckCircle, 
  Truck, 
  Home,
  Navigation,
  Phone,
  Clock,
  User,
  MapPin
} from 'lucide-react';
import Map from '../components/Map';
import { staffAPI, deliveryAPI, warehouseAPI } from '../services/api';
import toast from 'react-hot-toast';

const Staff = () => {
  const [staffId, setStaffId] = useState(null);
  const [staff, setStaff] = useState(null);
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [showMap, setShowMap] = useState(false);
  useEffect(() => {
    // In a real app, this would come from authentication
    // For demo, we'll use a hardcoded staff ID or prompt for it
    const storedStaffId = localStorage.getItem('staffId');
    if (storedStaffId) {
      setStaffId(storedStaffId);
    } else {
      const inputStaffId = prompt('Enter your Staff ID:');
      if (inputStaffId) {
        setStaffId(inputStaffId);
        localStorage.setItem('staffId', inputStaffId);
      }
    }
  }, []);

  useEffect(() => {
    if (staffId) {
      fetchStaffData();
    }
  }, [staffId]);

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      const [staffRes, warehouseRes] = await Promise.all([
        staffAPI.getById(staffId),
        warehouseAPI.get()
      ]);

      setStaff(staffRes.data.data);
      setWarehouse(warehouseRes.data.data);
    } catch (error) {
      toast.error('Failed to fetch staff data');
      console.error('Error fetching staff data:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleLogOut = ()=>{
    localStorage.clear();
    window.location.reload();

  }
  const handlePickOrder = async (orderId) => {
    try {
      await deliveryAPI.pickOrder(orderId, staffId);
      await fetchStaffData(); // Refresh data
      toast.success('Order picked successfully');
    } catch (error) {
      toast.error('Failed to pick order');
    }
  };

  const handleDeliverOrder = async (orderId) => {
    try {
      await deliveryAPI.deliverOrder(orderId, staffId);
      await fetchStaffData(); // Refresh data
      toast.success('Order delivered successfully');
    } catch (error) {
      toast.error('Failed to deliver order');
    }
  };

  const updateLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await staffAPI.updateLocation(
              staffId,
              position.coords.latitude,
              position.coords.longitude
            );
            await fetchStaffData();
            toast.success('Location updated');
          } catch (error) {
            toast.error('Failed to update location');
          }
        },
        (error) => {
          toast.error('Failed to get location');
        }
      );
    } else {
      toast.error('Geolocation not supported');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'status-pending', text: 'Pending' },
      picked: { color: 'status-picked', text: 'Picked' },
      delivered: { color: 'status-delivered', text: 'Delivered' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status };
    return <span className={`status-badge ${config.color}`}>{config.text}</span>;
  };

  const getRouteStepIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Package className="w-5 h-5 text-yellow-500" />;
      case 'picked':
        return <Truck className="w-5 h-5 text-orange-500" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-400" />;
    }
  };

  // Helper to build Google Maps directions URL
  const buildGoogleMapsUrl = (staff, orders, warehouse) => {
    if (!warehouse?.location || !orders || orders.length === 0) return '';

    const warehouseLocation = `${warehouse.location.lat},${warehouse.location.lng}`;
    const hasStaffLocation = staff?.currentLocation?.lat && staff?.currentLocation?.lng;

    // Start: staff current location or warehouse
    const start = hasStaffLocation
      ? `${staff.currentLocation.lat},${staff.currentLocation.lng}`
      : warehouseLocation;

    // Waypoints:
    // - If staff is outside warehouse, first go to warehouse
    // - Then visit all delivery addresses
    const waypoints = [];

    if (hasStaffLocation) {
      waypoints.push(warehouseLocation); // go to warehouse first if starting from outside
    }

    // Add all delivery stops
    waypoints.push(...orders.map(order => `${order.address.lat},${order.address.lng}`));

    // End at warehouse again (optional, remove if not needed)
    const end = warehouseLocation;

    // Construct URL
    let url = `https://www.google.com/maps/dir/?api=1`;
    url += `&origin=${encodeURIComponent(start)}`;
    if (waypoints.length > 0) {
      url += `&waypoints=${encodeURIComponent(waypoints.join('|'))}`;
    }
    url += `&destination=${encodeURIComponent(end)}`;
    url += `&travelmode=driving`;

    return url;
  };



  if (!staffId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Staff Login</h2>
          <p className="text-gray-600 mb-4">Please enter your Staff ID to continue</p>
          <button
            onClick={() => {
              const inputStaffId = prompt('Enter your Staff ID:');
              if (inputStaffId) {
                setStaffId(inputStaffId);
                localStorage.setItem('staffId', inputStaffId);
              }
            }}
            className="btn btn-primary"
          >
            Enter Staff ID
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Staff Not Found</h2>
          <p className="text-gray-600 mb-4">The provided Staff ID was not found.</p>
          <button
            onClick={() => {
              localStorage.removeItem('staffId');
              setStaffId(null);
            }}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const assignedOrders = staff.assignedOrders || [];
  const currentRoute = staff.currentRoute || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Delivery Dashboard</h1>
              <p className="text-gray-600">Welcome back, {staff.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Status</p>
                <p className={`font-medium ${staff.available ? 'text-green-600' : 'text-yellow-600'}`}>
                  {staff.available ? 'Available' : 'On Delivery'}
                </p>
              </div>
                <button
                onClick={handleLogOut}
                className="btn btn-outline flex items-center gap-2"
              >
                LogOut
              </button>
              <button
                onClick={updateLocation}
                className="btn btn-outline flex items-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                Update Location
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="w-4 h-4" />
              Orders ({assignedOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('route')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'route'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              Route
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {activeTab === 'orders' ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Assigned Orders</h2>
                <button
                  onClick={() => setShowMap(!showMap)}
                  className="btn btn-outline flex items-center gap-2"
                >
                  <MapIcon className="w-4 h-4" />
                  {showMap ? 'Hide Map' : 'Show Map'}
                </button>
              </div>

              {showMap && (
                <div className="h-[400px] bg-white rounded-lg shadow mb-6">
                  <Map
                    orders={assignedOrders}
                    staff={[staff]}
                    warehouse={warehouse}
                    selectedStaffId={staffId}
                    showRoutes={true}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignedOrders.map((order) => (
                  <div key={order._id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{order.name}</h3>
                        <p className="text-sm text-gray-500">{order.phoneNo}</p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{order.address.text}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Items:</strong> {order.items.join(', ')}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Demand:</strong> {order.demand}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {order.status === 'assigned' && (
                        <button
                          onClick={() => handlePickOrder(order._id)}
                          className="flex-1 btn btn-warning text-sm"
                        >
                          Pick Order
                        </button>
                      )}
                      {order.status === 'picked' && (
                        <button
                          onClick={() => handleDeliverOrder(order._id)}
                          className="flex-1 btn btn-success text-sm"
                        >
                          Deliver Order
                        </button>
                      )}
                      {order.status === 'delivered' && (
                        <span className="flex-1 text-center text-green-600 font-medium">
                          ✓ Delivered
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {assignedOrders.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Assigned</h3>
                  <p className="text-gray-500">You don't have any orders assigned at the moment.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Delivery Route</h2>
              
              {activeTab === 'route' && assignedOrders.length > 0 && warehouse && (
                <div className="mb-4 flex justify-end">
                  <a
                    href={buildGoogleMapsUrl(staff, assignedOrders, warehouse)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A7.488 7.488 0 0012 4.5c-4.142 0-7.5 3.358-7.5 7.5s3.358 7.5 7.5 7.5 7.5-3.358 7.5-7.5c0-.67-.087-1.32-.238-1.94m-2.9-4.346l-1.362-1.362m0 0L12 2.25m0 0l1.362 1.362m0 0A7.488 7.488 0 0119.5 12c0 4.142-3.358 7.5-7.5 7.5S4.5 16.142 4.5 12 7.858 4.5 12 4.5c.67 0 1.32.087 1.94.238z" />
                    </svg>
                    Open in Google Maps
                  </a>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Route Map */}
                <div className="h-[500px] bg-white rounded-lg shadow">
                  <Map
                    orders={assignedOrders}
                    staff={[staff]}
                    warehouse={warehouse}
                    selectedStaffId={staffId}
                    showRoutes={true}
                  />
                </div>

                {/* Route Steps */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Route Steps</h3>
                  <div className="space-y-4">
                    {/* Warehouse Start */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Home className="w-5 h-5 text-gray-600" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">Start from Warehouse</p>
                        <p className="text-sm text-gray-600">{warehouse?.address}</p>
                      </div>
                    </div>

                    {/* Route Points */}
                    {currentRoute.map((routePoint, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        {getRouteStepIcon(routePoint.status)}
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            {routePoint.address}
                          </p>
                          <p className="text-sm text-gray-600">
                            Status: {routePoint.status}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Warehouse Return */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Home className="w-5 h-5 text-gray-600" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">Return to Warehouse</p>
                        <p className="text-sm text-gray-600">{warehouse?.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Staff; 