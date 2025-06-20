# Delivery System MVP

A full-stack MERN application for logistics management with CVRP (Capacitated Vehicle Routing Problem) optimization, real-time delivery tracking, and Google Maps integration.

## 🚀 Features

### Admin Dashboard
- **Order Management**: Create, edit, and delete delivery orders
- **Staff Management**: View and manage delivery personnel
- **CVRP Optimization**: Automatically assign orders to staff using OR-Tools
- **Real-time Map View**: Visualize all orders, staff, and optimized routes
- **Warehouse Configuration**: Set up central warehouse location

### Staff Dashboard
- **Personal Route View**: See assigned orders and optimized delivery route
- **Pick & Deliver Actions**: Mark orders as picked and delivered
- **Location Updates**: Update current location via GPS
- **Route Visualization**: Interactive map with turn-by-turn directions

### Technical Features
- **CVRP Solver**: Python-based optimization using Google OR-Tools
- **Google Maps Integration**: Geocoding, route optimization, and visualization
- **Real-time Updates**: Live status tracking and notifications
- **Responsive Design**: Mobile-friendly interface for delivery staff
- **PWA Ready**: Progressive Web App capabilities

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Python** with OR-Tools for CVRP optimization
- **Google Maps API** for geocoding and routing

### Frontend
- **React.js** with functional components and hooks
- **TailwindCSS** for styling
- **React Router** for navigation
- **Google Maps JavaScript API** for map visualization
- **Axios** for API communication

## 📋 Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- MongoDB (local or cloud instance)
- Google Maps API Key

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd deliveryBOYZ
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Install Python dependencies
cd scripts
pip install -r requirements.txt
cd ..

# Create environment file
cp env.example .env
# Edit .env with your configuration
```

### 3. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Create environment file
cp env.example .env
# Edit .env with your Google Maps API key
```

### 4. Environment Configuration

#### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/delivery_system
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
FRONTEND_URL=http://localhost:3000
PORT=8080
JWT_SECRET=your_jwt_secret_here
```

#### Frontend (.env)
```env
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
REACT_APP_API_URL=http://localhost:8080
```

### 5. Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Geocoding API
   - Directions API
   - Places API
4. Create credentials (API Key)
5. Add the API key to both backend and frontend .env files

## 🏃‍♂️ Running the Application

### Start Backend Server
```bash
cd backend
npm run dev
```
Server will start on http://localhost:8080

### Start Frontend Development Server
```bash
cd client
npm start
```
Frontend will start on http://localhost:3000

## 📱 Usage

### Admin Access
- Navigate to http://localhost:3000/admin
- Create orders with customer details and delivery addresses
- Add staff members with capacity limits
- Use "Optimize Routes" to assign orders using CVRP
- View real-time map with all orders and staff locations

### Staff Access
- Navigate to http://localhost:3000/staff
- Enter Staff ID (use IDs from admin panel)
- View assigned orders and delivery route
- Click "Pick Order" when collecting from warehouse
- Click "Deliver Order" when completing delivery
- Update location using GPS

## 🔧 API Endpoints

### Orders
- `GET /orders` - Get all orders
- `POST /orders` - Create new order
- `PUT /orders/:id` - Update order
- `DELETE /orders/:id` - Delete order
- `GET /orders/pending/optimization` - Get pending orders for CVRP

### Staff
- `GET /staff` - Get all staff
- `POST /staff` - Create staff member
- `PUT /staff/:id` - Update staff
- `PATCH /staff/:id/location` - Update staff location
- `GET /staff/:id/route` - Get staff route

### Assignment & Delivery
- `POST /assign` - Run CVRP optimization
- `POST /pick` - Mark order as picked
- `POST /deliver` - Mark order as delivered
- `GET /route/:staffId` - Get optimized route

### Warehouse
- `GET /warehouse` - Get warehouse info
- `POST /warehouse` - Create/update warehouse

## 🗄️ Database Schema

### Order
```javascript
{
  name: String,
  phoneNo: String,
  demand: Number,
  items: [String],
  address: {
    text: String,
    lat: Number,
    lng: Number
  },
  assignedTo: ObjectId (ref: Staff),
  status: 'pending' | 'assigned' | 'picked' | 'delivered',
  pickupTime: Date,
  deliveryTime: Date
}
```

### Staff
```javascript
{
  name: String,
  phoneNo: String,
  capacity: Number,
  available: Boolean,
  assignedOrders: [ObjectId],
  currentLocation: { lat: Number, lng: Number },
  currentRoute: [RoutePoint],
  isAtWarehouse: Boolean
}
```

### Warehouse
```javascript
{
  name: String,
  address: String,
  location: { lat: Number, lng: Number },
  isActive: Boolean
}
```

## 🔄 CVRP Optimization

The system uses Google OR-Tools to solve the Capacitated Vehicle Routing Problem:

1. **Input**: Unassigned orders, available staff, warehouse location
2. **Optimization**: Minimize total distance while respecting capacity constraints
3. **Output**: Optimal route assignments for each staff member
4. **Integration**: Python script called via Node.js child_process

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or local MongoDB
2. Deploy to Heroku, Railway, or similar platform
3. Configure environment variables
4. Install Python dependencies on server

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy to Vercel, Netlify, or similar platform
3. Configure environment variables
4. Update API URL to production backend

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🔮 Future Enhancements

- Real-time location tracking with WebSockets
- SMS notifications using Twilio
- Advanced authentication with JWT
- Offline PWA capabilities
- Analytics and reporting dashboard
- Multi-warehouse support
- Dynamic route recalculation
- Integration with external logistics APIs
