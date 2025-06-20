import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import helmet from 'helmet'
import connectDB from './config/connectDB.js'
import ordersRouter from './routes/orders.js'
import staffRouter from './routes/staff.js'
import assignRouter from './routes/assign.js'
import deliverRouter from './routes/deliver.js'
import pickRouter from './routes/pick.js'
import routeRouter from './routes/route.js'
import warehouseRouter from './routes/warehouse.js'
import geocodeRouter from './routes/geocode.js';
const app=express()
app.use(cors({
    credentials:true,
    origin: process.env.FRONTEND_URL
}))
app.use(express.json())
app.use(cookieParser())
app.use(morgan())
app.use(helmet({
    crossOriginResourcePolicy: false
}))

const PORT=8080 || process.env.PORT

app.get("/",(request,response)=>{
    //server to client
    response.json({
        message : "Server is running "+PORT
    })
})

app.use('/orders', ordersRouter)
app.use('/staff', staffRouter)
app.use('/assign', assignRouter)
app.use('/deliver', deliverRouter)
app.use('/pick', pickRouter)
app.use('/route', routeRouter)
app.use('/warehouse', warehouseRouter)
app.use('/api/geocode', geocodeRouter);
connectDB().then(()=>{
    app.listen(PORT,()=>{
    console.log("Server is running",PORT)
    })
})

