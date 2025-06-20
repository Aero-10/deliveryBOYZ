import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Map = ({ 
  center = { lat: 20.5937, lng: 78.9629 }, // Default to India center
  zoom = 10,
  orders = [],
  staff = [],
  warehouse = null,
  selectedStaffId = null,
  onOrderClick = null,
  onStaffClick = null,
  showRoutes = false
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [routeLayer, setRouteLayer] = useState(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const mapInstance = L.map(mapRef.current).setView([center.lat, center.lng], zoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);

    setMap(mapInstance);

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [center.lat, center.lng, zoom]);

  // Clear existing markers
  useEffect(() => {
    markers.forEach(marker => {
      if (map) map.removeLayer(marker);
    });
    setMarkers([]);
  }, [orders, staff, warehouse, map]);

  // Add warehouse marker
  useEffect(() => {
    if (map && warehouse) {
      const warehouseIcon = L.divIcon({
        className: 'warehouse-marker',
        html: `
          <div style="
            width: 32px; 
            height: 32px; 
            background: #1f2937; 
            border-radius: 4px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">
            W
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const warehouseMarker = L.marker([warehouse.location.lat, warehouse.location.lng], {
        icon: warehouseIcon
      }).addTo(map);

      const warehousePopup = L.popup({
        maxWidth: 300,
        className: 'warehouse-popup'
      }).setContent(`
        <div class="p-2">
          <h3 class="font-bold text-lg">${warehouse.name}</h3>
          <p class="text-sm text-gray-600">${warehouse.address}</p>
        </div>
      `);

      warehouseMarker.bindPopup(warehousePopup);
      setMarkers(prev => [...prev, warehouseMarker]);
    }
  }, [map, warehouse]);

  // Add order markers
  useEffect(() => {
    if (map && orders.length > 0) {
      const orderMarkers = orders.map(order => {
        const getStatusColor = (status) => {
          switch (status) {
            case 'pending': return '#f59e0b';
            case 'assigned': return '#3b82f6';
            case 'picked': return '#f97316';
            case 'delivered': return '#22c55e';
            default: return '#6b7280';
          }
        };

        const orderIcon = L.divIcon({
          className: 'order-marker',
          html: `
            <div style="
              width: 24px; 
              height: 24px; 
              background: ${getStatusColor(order.status)}; 
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              color: white; 
              font-weight: bold;
              font-size: 10px;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">
              O
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const orderMarker = L.marker([order.address.lat, order.address.lng], {
          icon: orderIcon
        }).addTo(map);

        const orderPopup = L.popup({
          maxWidth: 300,
          className: 'order-popup'
        }).setContent(`
          <div class="p-2 min-w-[200px]">
            <h3 class="font-bold text-lg">${order.name}</h3>
            <p class="text-sm text-gray-600">${order.phoneNo}</p>
            <p class="text-sm">${order.address.text}</p>
            <p class="text-sm">Status: <span class="font-medium">${order.status}</span></p>
            <p class="text-sm">Items: ${order.items.join(', ')}</p>
            ${onOrderClick ? '<button class="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">View Details</button>' : ''}
          </div>
        `);

        orderMarker.bindPopup(orderPopup);
        
        if (onOrderClick) {
          orderMarker.on('click', () => onOrderClick(order));
        }

        return orderMarker;
      });

      setMarkers(prev => [...prev, ...orderMarkers]);
    }
  }, [map, orders, onOrderClick]);

  // Add staff markers
  useEffect(() => {
    if (map && staff.length > 0) {
      const staffMarkers = staff.map(staffMember => {
        if (!staffMember.currentLocation?.lat || !staffMember.currentLocation?.lng) return null;

        const staffIcon = L.divIcon({
          className: 'staff-marker',
          html: `
            <div style="
              width: 28px; 
              height: 28px; 
              background: ${staffMember.available ? '#22c55e' : '#f59e0b'}; 
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              color: white; 
              font-weight: bold;
              font-size: 12px;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">
              D
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const staffMarker = L.marker([staffMember.currentLocation.lat, staffMember.currentLocation.lng], {
          icon: staffIcon
        }).addTo(map);

        const staffPopup = L.popup({
          maxWidth: 300,
          className: 'staff-popup'
        }).setContent(`
          <div class="p-2 min-w-[200px]">
            <h3 class="font-bold text-lg">${staffMember.name}</h3>
            <p class="text-sm text-gray-600">${staffMember.phoneNo}</p>
            <p class="text-sm">Status: <span class="font-medium">${staffMember.available ? 'Available' : 'Busy'}</span></p>
            <p class="text-sm">Capacity: ${staffMember.capacity}</p>
            <p class="text-sm">Assigned Orders: ${staffMember.assignedOrders?.length || 0}</p>
            ${onStaffClick ? '<button class="mt-2 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">View Route</button>' : ''}
          </div>
        `);

        staffMarker.bindPopup(staffPopup);
        
        if (onStaffClick) {
          staffMarker.on('click', () => onStaffClick(staffMember));
        }

        return staffMarker;
      }).filter(Boolean);

      setMarkers(prev => [...prev, ...staffMarkers]);
    }
  }, [map, staff, onStaffClick]);

  // Show routes for selected staff
  useEffect(() => {
    if (routeLayer && map) {
      map.removeLayer(routeLayer);
      setRouteLayer(null);
    }

    if (map && selectedStaffId && showRoutes) {
      const selectedStaff = staff.find(s => s._id === selectedStaffId);
      if (selectedStaff && selectedStaff.assignedOrders?.length > 0) {
        const waypoints = selectedStaff.assignedOrders.map(order => ({
          lat: order.address.lat,
          lng: order.address.lng
        }));

        if (warehouse) {
          waypoints.unshift({ lat: warehouse.location.lat, lng: warehouse.location.lng });
          waypoints.push({ lat: warehouse.location.lat, lng: warehouse.location.lng });
        }

        // Create a simple polyline for the route
        const routeCoordinates = waypoints.map(point => [point.lat, point.lng]);
        const routePolyline = L.polyline(routeCoordinates, {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.8
        }).addTo(map);

        setRouteLayer(routePolyline);

        // Fit map to show the entire route
        if (routeCoordinates.length > 0) {
          map.fitBounds(routePolyline.getBounds(), { padding: [20, 20] });
        }
      }
    }
  }, [map, selectedStaffId, staff, warehouse, showRoutes]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full rounded-lg shadow-lg"
      style={{ minHeight: '400px' }}
    />
  );
};

export default Map; 