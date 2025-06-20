import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run CVRP optimization using Python OR-Tools
 * @param {Object} data - Input data for CVRP
 * @returns {Promise<Object>} - Optimization results
 */
export const runCVRPOptimization = async (data) => {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../scripts/cvrp_solver.py');
    
    // Spawn Python process
    const pythonBinary = '/opt/homebrew/bin/python3';

    const pythonProcess = spawn(pythonBinary, [pythonScript], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    // Handle stdout
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    // Handle stderr
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Handle process completion
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python process error:', errorOutput);
        reject(new Error(`CVRP optimization failed with code ${code}: ${errorOutput}`));
        return;
      }

      try {
        const result = JSON.parse(output);
        resolve(result);
      } catch (error) {
        console.error('Failed to parse Python output:', error);
        reject(new Error('Invalid output from CVRP solver'));
      }
    });

    // Handle process errors
    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python process:', error);
      reject(new Error('Failed to start CVRP solver'));
    });

    // Send input data to Python process
    try {
      const inputData = JSON.stringify(data);
      pythonProcess.stdin.write(inputData);
      pythonProcess.stdin.end();
    } catch (error) {
      console.error('Failed to send data to Python process:', error);
      reject(new Error('Failed to send data to CVRP solver'));
    }
  });
};

/**
 * Prepare data for CVRP optimization
 * @param {Array} orders - Array of order objects
 * @param {Array} staff - Array of staff objects
 * @param {Object} warehouse - Warehouse location
 * @returns {Object} - Formatted data for CVRP
 */
export const prepareCVRPData = (orders, staff, warehouse) => {
  const orderLocations = orders.map(order => ({
    id: order._id.toString(),
    location: [order.address.lat, order.address.lng],
    demand: order.demand
  }));

  const staffCapacities = staff.map(s => s.capacity);
  const warehouseLocation = [warehouse.location.lat, warehouse.location.lng];

  return {
    warehouse: warehouseLocation,
    orders: orderLocations,
    staff_capacities: staffCapacities
  };
};

/**
 * Process CVRP results and assign orders to staff
 * @param {Object} cvrpResult - Raw CVRP optimization result
 * @param {Array} staff - Array of staff objects
 * @param {Array} orders - Array of order objects
 * @returns {Object} - Processed assignment results
 */
export const processCVRPResults = (cvrpResult, staff, orders) => {
  if (cvrpResult.error) {
    throw new Error(cvrpResult.error);
  }

  const assignments = {};
  const orderMap = new Map(orders.map(order => [order._id.toString(), order]));
  const staffMap = new Map(staff.map(s => [s._id.toString(), s]));

  Object.entries(cvrpResult.routes).forEach(([vehicleId, routeData]) => {
    const staffIndex = parseInt(vehicleId.split('_')[1]);
    const staffMember = staff[staffIndex];
    
    if (!staffMember) {
      console.warn(`Staff member at index ${staffIndex} not found`);
      return;
    }

    const assignedOrders = [];
    const route = [];

    routeData.route.forEach(routePoint => {
      if (routePoint.type === 'order') {
        const order = orderMap.get(routePoint.orderId);
        if (order) {
          assignedOrders.push(order._id);
          route.push({
            orderId: order._id,
            lat: routePoint.location[0],
            lng: routePoint.location[1],
            address: order.address.text,
            status: 'pending'
          });
        }
      }
    });

    assignments[staffMember._id.toString()] = {
      staffId: staffMember._id,
      assignedOrders,
      route,
      distance: routeData.distance,
      demandServed: routeData.demand_served
    };
  });

  return {
    assignments,
    totalDistance: cvrpResult.total_distance,
    status: cvrpResult.status
  };
};

/**
 * Validate CVRP input data
 * @param {Array} orders - Orders to validate
 * @param {Array} staff - Staff to validate
 * @param {Object} warehouse - Warehouse to validate
 * @returns {boolean} - True if valid
 */
export const validateCVRPInput = (orders, staff, warehouse) => {
  if (!orders || orders.length === 0) {
    throw new Error('No orders provided for optimization');
  }

  if (!staff || staff.length === 0) {
    throw new Error('No staff available for assignment');
  }

  if (!warehouse || !warehouse.location) {
    throw new Error('Invalid warehouse location');
  }

  // Check if total demand exceeds total capacity
  const totalDemand = orders.reduce((sum, order) => sum + order.demand, 0);
  const totalCapacity = staff.reduce((sum, s) => sum + s.capacity, 0);

  if (totalDemand > totalCapacity) {
    throw new Error('Total demand exceeds total staff capacity');
  }

  return true;
}; 