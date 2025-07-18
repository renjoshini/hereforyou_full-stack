const express = require("express")
const Professional = require("../models/Professional")
const User = require("../models/User")
const auth = require("../middleware/auth")

const router = express.Router()

// @route   GET /api/professionals
// @desc    Get all professionals with filters
// @access  Public
router.get("/", async (req, res) => {
  try {
    const { service, location, rating, sortBy = "rating", limit = 20, page = 1 } = req.query

    const query = { status: "active" }
    let sortOptions = {}

    // Service filter
    if (service) {
      query["services.service"] = service
    }

    // Location filter
    if (location) {
      query["availability.serviceAreas.city"] = new RegExp(location, "i")
    }

    // Rating filter
    if (rating) {
      query["rating.average"] = { $gte: Number.parseFloat(rating) }
    }

    // Sorting
    switch (sortBy) {
      case "rating":
        sortOptions = { "rating.average": -1, "rating.count": -1 }
        break
      case "price":
        sortOptions = { "services.pricing.hourlyRate": 1 }
        break
      case "experience":
        sortOptions = { "profile.experience.total": -1 }
        break
      case "reviews":
        sortOptions = { "stats.completedBookings": -1 }
        break
      default:
        sortOptions = { "rating.average": -1 }
    }

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    const professionals = await Professional.find(query)
      .populate("user", "name profile.avatar phone")
      .populate("services.service", "name icon")
      .sort(sortOptions)
      .limit(Number.parseInt(limit))
      .skip(skip)
      .select("-bankDetails -verification.identity.documents")

    const total = await Professional.countDocuments(query)

    res.json({
      success: true,
      data: professionals,
      pagination: {
        current: Number.parseInt(page),
        pages: Math.ceil(total / Number.parseInt(limit)),
        total,
        limit: Number.parseInt(limit),
      },
    })
  } catch (error) {
    console.error("Get professionals error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching professionals",
    })
  }
})

// @route   GET /api/professionals/service/:serviceId
// @desc    Get professionals by service
// @access  Public
router.get("/service/:serviceId", async (req, res) => {
  try {
    const { serviceId } = req.params
    const { location, sortBy, limit = 20 } = req.query

    const professionals = await Professional.findByServiceAndLocation(serviceId, location || "Kerala", {
      sortBy,
      limit: Number.parseInt(limit),
    })

    // Transform data for frontend compatibility
    const transformedData = professionals.map((prof) => {
      const serviceData = prof.services.find((s) => s.service._id.toString() === serviceId)

      return {
        id: prof._id,
        name: prof.user.name,
        rating: prof.rating.average,
        reviews: prof.rating.count,
        experience: `${prof.profile.experience.total} years`,
        hourlyRate: serviceData ? serviceData.pricing.hourlyRate : 0,
        location: prof.availability.serviceAreas[0]?.city || "Kerala",
        verified: prof.isVerified,
        availability: prof.availability.currentStatus === "available",
        specialties: serviceData ? serviceData.specialties : [],
        avatar: prof.user.profile?.avatar,
      }
    })

    res.json({
      success: true,
      data: transformedData,
    })
  } catch (error) {
    console.error("Get professionals by service error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching professionals",
    })
  }
})

// @route   GET /api/professionals/:id
// @desc    Get professional by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id)
      .populate("user", "name profile phone email")
      .populate("services.service", "name icon description")
      .select("-bankDetails -verification.identity.documents")

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional not found",
      })
    }

    // Transform data for frontend compatibility
    const transformedData = {
      id: professional._id,
      name: professional.user.name,
      rating: professional.rating.average,
      reviews: professional.rating.count,
      experience: `${professional.profile.experience.total} years`,
      hourlyRate: professional.services[0]?.pricing.hourlyRate || 0,
      location: professional.availability.serviceAreas[0]?.city || "Kerala",
      verified: professional.isVerified,
      availability: professional.availability.currentStatus === "available",
      specialties: professional.services[0]?.specialties || [],
      description: professional.profile.description,
      skills: professional.profile.skills,
      languages: professional.profile.languages,
      workingHours: professional.availability.workingHours,
      serviceAreas: professional.availability.serviceAreas,
      stats: professional.stats,
    }

    res.json({
      success: true,
      data: transformedData,
    })
  } catch (error) {
    console.error("Get professional error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching professional",
    })
  }
})

// @route   POST /api/professionals
// @desc    Create professional profile
// @access  Private
router.post("/", auth, async (req, res) => {
  try {
    // Check if user already has a professional profile
    const existingProfessional = await Professional.findOne({ user: req.user.userId })

    if (existingProfessional) {
      return res.status(400).json({
        success: false,
        message: "Professional profile already exists",
      })
    }

    const professionalData = {
      ...req.body,
      user: req.user.userId,
    }

    const professional = new Professional(professionalData)
    await professional.save()

    // Update user type
    await User.findByIdAndUpdate(req.user.userId, { userType: "professional" })

    res.status(201).json({
      success: true,
      message: "Professional profile created successfully",
      data: professional,
    })
  } catch (error) {
    console.error("Create professional error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while creating professional profile",
    })
  }
})

// @route   PUT /api/professionals/:id
// @desc    Update professional profile
// @access  Private
router.put("/:id", auth, async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id)

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional not found",
      })
    }

    // Check if user owns this profile or is admin
    if (professional.user.toString() !== req.user.userId && req.user.userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    const updatedProfessional = await Professional.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    res.json({
      success: true,
      message: "Professional profile updated successfully",
      data: updatedProfessional,
    })
  } catch (error) {
    console.error("Update professional error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while updating professional profile",
    })
  }
})

// @route   PUT /api/professionals/:id/availability
// @desc    Update professional availability
// @access  Private
router.put("/:id/availability", auth, async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id)

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional not found",
      })
    }

    // Check if user owns this profile
    if (professional.user.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    professional.availability = { ...professional.availability, ...req.body }
    professional.availability.lastSeen = new Date()

    await professional.save()

    res.json({
      success: true,
      message: "Availability updated successfully",
      data: professional.availability,
    })
  } catch (error) {
    console.error("Update availability error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while updating availability",
    })
  }
})

module.exports = router
