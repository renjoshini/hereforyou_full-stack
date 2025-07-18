const express = require("express")
const Service = require("../models/Service")
const auth = require("../middleware/auth")

const router = express.Router()

// @route   GET /api/services
// @desc    Get all services with optional search and filters
// @access  Public
router.get("/", async (req, res) => {
  try {
    const { search, category, location, featured, limit = 20, page = 1, sortBy = "popular" } = req.query

    const query = { status: "active" }
    let sortOptions = {}

    // Search functionality
    if (search) {
      query.$text = { $search: search }
    }

    // Category filter
    if (category) {
      query.category = category
    }

    // Location filter
    if (location) {
      query["availability.locations.city"] = new RegExp(location, "i")
    }

    // Featured filter
    if (featured === "true") {
      query.featured = true
    }

    // Sorting
    switch (sortBy) {
      case "rating":
        sortOptions = { "rating.average": -1, "rating.count": -1 }
        break
      case "price":
        sortOptions = { "pricing.basePrice": 1 }
        break
      case "name":
        sortOptions = { name: 1 }
        break
      case "popular":
      default:
        sortOptions = { popularityScore: -1, "rating.average": -1 }
        break
    }

    // If search is used, include text score in sorting
    if (search) {
      sortOptions = { score: { $meta: "textScore" }, ...sortOptions }
    }

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    const services = await Service.find(query).sort(sortOptions).limit(Number.parseInt(limit)).skip(skip).select("-__v")

    const total = await Service.countDocuments(query)

    res.json({
      success: true,
      data: services,
      pagination: {
        current: Number.parseInt(page),
        pages: Math.ceil(total / Number.parseInt(limit)),
        total,
        limit: Number.parseInt(limit),
      },
    })
  } catch (error) {
    console.error("Get services error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching services",
    })
  }
})

// @route   GET /api/services/popular
// @desc    Get popular services
// @access  Public
router.get("/popular", async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 8

    const services = await Service.getPopular(limit)

    res.json({
      success: true,
      data: services,
    })
  } catch (error) {
    console.error("Get popular services error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching popular services",
    })
  }
})

// @route   GET /api/services/categories
// @desc    Get service categories with counts
// @access  Public
router.get("/categories", async (req, res) => {
  try {
    const categories = await Service.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgRating: { $avg: "$rating.average" },
          services: { $push: { name: "$name", slug: "$slug", icon: "$icon" } },
        },
      },
      { $sort: { count: -1 } },
    ])

    res.json({
      success: true,
      data: categories,
    })
  } catch (error) {
    console.error("Get categories error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching categories",
    })
  }
})

// @route   GET /api/services/:id
// @desc    Get service by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      })
    }

    res.json({
      success: true,
      data: service,
    })
  } catch (error) {
    console.error("Get service error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching service",
    })
  }
})

// @route   POST /api/services
// @desc    Create a new service (Admin only)
// @access  Private (Admin)
router.post("/", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      })
    }

    const service = new Service(req.body)
    await service.save()

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: service,
    })
  } catch (error) {
    console.error("Create service error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while creating service",
    })
  }
})

// @route   PUT /api/services/:id
// @desc    Update service (Admin only)
// @access  Private (Admin)
router.put("/:id", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      })
    }

    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      })
    }

    res.json({
      success: true,
      message: "Service updated successfully",
      data: service,
    })
  } catch (error) {
    console.error("Update service error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while updating service",
    })
  }
})

// @route   DELETE /api/services/:id
// @desc    Delete service (Admin only)
// @access  Private (Admin)
router.delete("/:id", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      })
    }

    const service = await Service.findByIdAndDelete(req.params.id)

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      })
    }

    res.json({
      success: true,
      message: "Service deleted successfully",
    })
  } catch (error) {
    console.error("Delete service error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while deleting service",
    })
  }
})

module.exports = router
