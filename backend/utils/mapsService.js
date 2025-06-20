import axios from 'axios';

// OpenStreetMap Nominatim API base URL
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

/**
 * Geocode an address to get coordinates using OpenStreetMap Nominatim
 * @param {string} address - The address to geocode
 * @returns {Promise<Object>} - Object with lat, lng, and formatted address
 */
export const geocodeAddress = async (address) => {
  try {
    const response = await axios.get(`${NOMINATIM_BASE_URL}/search`, {
      params: {
        q: address,
        format: 'json',
        limit: 1,
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'DeliverySystem/1.0'
      }
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        formattedAddress: result.display_name,
        placeId: result.place_id
      };
    } else {
      throw new Error('No results found for the given address');
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Failed to geocode address');
  }
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {Object} point1 - {lat, lng}
 * @param {Object} point2 - {lat, lng}
 * @returns {number} - Distance in kilometers
 */
export const calculateDistance = (point1, point2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Get optimized route between multiple points using OSRM
 * @param {Array} waypoints - Array of {lat, lng} coordinates
 * @param {Object} origin - Starting point {lat, lng}
 * @param {Object} destination - End point {lat, lng}
 * @returns {Promise<Object>} - Route information
 */
export const getOptimizedRoute = async (waypoints, origin, destination) => {
  try {
    // For now, we'll use a simple approach with OSRM
    // In a production environment, you might want to implement a more sophisticated routing algorithm
    const allPoints = [origin, ...waypoints, destination];
    const coordinates = allPoints.map(point => `${point.lng},${point.lat}`).join(';');
    
    const response = await axios.get(`https://router.project-osrm.org/route/v1/driving/${coordinates}`, {
      params: {
        overview: 'full',
        steps: true
      }
    });

    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      
      return {
        waypointOrder: Array.from({ length: waypoints.length }, (_, i) => i),
        totalDistance: route.distance / 1000, // Convert to km
        totalDuration: route.duration / 60, // Convert to minutes
        polyline: route.geometry,
        legs: route.legs.map(leg => ({
          distance: { value: leg.distance, text: `${(leg.distance / 1000).toFixed(1)} km` },
          duration: { value: leg.duration, text: `${Math.round(leg.duration / 60)} min` },
          startLocation: leg.maneuver.location,
          endLocation: leg.maneuver.location
        }))
      };
    } else {
      throw new Error('No route found');
    }
  } catch (error) {
    console.error('Route optimization error:', error);
    // Fallback to simple distance calculation
    let totalDistance = 0;
    const allPoints = [origin, ...waypoints, destination];
    
    for (let i = 0; i < allPoints.length - 1; i++) {
      totalDistance += calculateDistance(allPoints[i], allPoints[i + 1]);
    }
    
    return {
      waypointOrder: Array.from({ length: waypoints.length }, (_, i) => i),
      totalDistance,
      totalDuration: totalDistance * 2, // Rough estimate: 2 minutes per km
      polyline: null,
      legs: []
    };
  }
};

/**
 * Get place details from Google Places API
 * @param {string} placeId - Google Place ID
 * @returns {Promise<Object>} - Place details
 */
export const getPlaceDetails = async (placeId) => {
  try {
    const response = await axios.get(`${NOMINATIM_BASE_URL}/details`, {
      params: {
        place_id: placeId,
        format: 'json',
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'DeliverySystem/1.0'
      }
    });

    if (response.data && response.data.status === 'OK') {
      const result = response.data.result;
      return {
        name: result.name,
        address: result.display_name,
        location: {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        }
      };
    } else {
      throw new Error('Failed to get place details');
    }
  } catch (error) {
    console.error('Place details error:', error);
    throw new Error('Failed to get place details');
  }
};

/**
 * Validate if coordinates are within reasonable bounds
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} - True if valid
 */
export const validateCoordinates = (lat, lng) => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}; 