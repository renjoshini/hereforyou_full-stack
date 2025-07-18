const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const path = require("path")
require("dotenv").config()

const connectDB = require("./config/database")

// Import routes
const authRoutes = require("./routes/auth")
const serviceRoutes = require("./routes/services")
const professionalRoutes = require("./routes/professionals")
const bookingRoutes = require("./routes/bookings")
const userRoutes = require("./routes/users")

const app = express()

// Connect to MongoDB
connectDB()

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
})
app.use("/api/", limiter)

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://yourdomain.com"]
        : ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  }),
)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, "frontend")))

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/services", serviceRoutes)
app.use("/api/professionals", professionalRoutes)
app.use("/api/bookings", bookingRoutes)
app.use("/api/users", userRoutes)

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Serve frontend files
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"))
})

// Handle all other routes by serving the appropriate HTML file
app.get("*.html", (req, res) => {
  const fileName = req.path.substring(1) // Remove leading slash
  res.sendFile(path.join(__dirname, "frontend", fileName))
})

// Catch-all handler: send back index.html for any non-API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"))
})

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.stack)

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: Object.values(err.errors).map((e) => e.message),
    })
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    })
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  })
})

// Handle 404 for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📱 Frontend: http://localhost:${PORT}`)
  console.log(`🔗 API: http://localhost:${PORT}/api`)
})

module.exports = app
