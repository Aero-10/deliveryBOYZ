#!/usr/bin/env python3
"""
CVRP Solver using Google OR-Tools
Solves Capacitated Vehicle Routing Problem for delivery optimization
"""

import json
import sys
import math
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

def create_distance_matrix(locations):
    """Create distance matrix from locations"""
    size = len(locations)
    matrix = {}
    for from_node in range(size):
        matrix[from_node] = {}
        for to_node in range(size):
            if from_node == to_node:
                matrix[from_node][to_node] = 0
            else:
                # Calculate Euclidean distance
                x1, y1 = locations[from_node]
                x2, y2 = locations[to_node]
                distance = math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
                matrix[from_node][to_node] = int(distance * 1000)  # Convert to meters
    return matrix

def solve_cvrp(locations, demands, vehicle_capacities, depot=0):
    """
    Solve CVRP using OR-Tools
    
    Args:
        locations: List of (lat, lng) tuples
        demands: List of demand values for each location
        vehicle_capacities: List of vehicle capacities
        depot: Index of depot/warehouse location
    
    Returns:
        Dictionary with route assignments
    """
    
    # Create distance matrix
    distance_matrix = create_distance_matrix(locations)
    
    # Create routing model
    manager = pywrapcp.RoutingIndexManager(len(locations), len(vehicle_capacities), depot)
    routing = pywrapcp.RoutingModel(manager)
    
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]
    
    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
    
    # Add capacity constraints
    def demand_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        return demands[from_node]
    
    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    
    # for vehicle_id in range(len(vehicle_capacities)):
    #     routing.AddDimensionWithVehicleCapacity(
    #         demand_callback_index,
    #         0,  # null capacity slack
    #         [vehicle_capacities[vehicle_id]],  # vehicle maximum capacities
    #         True,  # start cumul to zero
    #         f'Capacity_{vehicle_id}'
    #     )
    routing.AddDimensionWithVehicleCapacity(
    demand_callback_index,
    0,  # null capacity slack
    vehicle_capacities,  # list of capacities for all vehicles
    True,  # start cumul to zero
    'Capacity'
)

    
    # Set first solution heuristic
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_parameters.time_limit.seconds = 30
    
    # Solve the problem
    solution = routing.SolveWithParameters(search_parameters)
    
    if not solution:
        return {"error": "No solution found"}
    
    # Extract routes
    routes = {}
    total_distance = 0
    
    for vehicle_id in range(len(vehicle_capacities)):
        index = routing.Start(vehicle_id)
        route = []
        route_distance = 0
        
        while not routing.IsEnd(index):
            node_index = manager.IndexToNode(index)
            route.append(node_index)
            previous_index = index
            index = solution.Value(routing.NextVar(index))
            route_distance += routing.GetArcCostForVehicle(previous_index, index, vehicle_id)
        
        # Add depot at the end
        route.append(manager.IndexToNode(index))
        route_distance += routing.GetArcCostForVehicle(
            routing.End(vehicle_id), routing.Start(vehicle_id), vehicle_id
        )
        
        if len(route) > 1:  # Only include routes with actual deliveries
            routes[f"vehicle_{vehicle_id}"] = {
                "route": route,
                "distance": route_distance,
                "demand_served": sum(demands[i] for i in route[1:-1])  # Exclude depot
            }
            total_distance += route_distance
    
    return {
        "routes": routes,
        "total_distance": total_distance,
        "status": "OPTIMAL" if solution.ObjectiveValue() > 0 else "FEASIBLE"
    }

def main():
    """Main function to handle input/output"""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Extract data
        warehouse_location = input_data.get("warehouse", [0, 0])
        order_locations = input_data.get("orders", [])
        staff_capacities = input_data.get("staff_capacities", [])
        
        if not order_locations or not staff_capacities:
            print(json.dumps({"error": "Missing required data"}))
            return
        
        # Prepare locations (warehouse + orders)
        locations = [warehouse_location] + [order["location"] for order in order_locations]
        demands = [0] + [order["demand"] for order in order_locations]  # Warehouse has 0 demand
        
        # Solve CVRP
        result = solve_cvrp(locations, demands, staff_capacities)
        
        # Format output for Node.js
        if "error" not in result:
            # Map back to order IDs
            formatted_routes = {}
            for vehicle_id, route_data in result["routes"].items():
                # Skip warehouse (index 0) and map order indices to order IDs
                order_route = []
                for i, node_index in enumerate(route_data["route"]):
                    if node_index == 0:  # Warehouse
                        order_route.append({
                            "type": "warehouse",
                            "location": warehouse_location
                        })
                    else:  # Order
                        order_index = node_index - 1
                        order_route.append({
                            "type": "order",
                            "orderId": order_locations[order_index]["id"],
                            "location": order_locations[order_index]["location"],
                            "demand": order_locations[order_index]["demand"]
                        })
                
                formatted_routes[vehicle_id] = {
                    "route": order_route,
                    "distance": route_data["distance"],
                    "demand_served": route_data["demand_served"]
                }
            
            result["routes"] = formatted_routes
        
        # Output result
        print(json.dumps(result))
        
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON input"}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main() 