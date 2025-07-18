const express = require("express")
const { body, validationResult } = require("express-validator")
const Booking = require("../models/Booking")
const Professional = require("../models/Professional")
const Service = require("../models/Service")
const User = require("../models/User")
const auth = require("../middleware/auth")

const router = express.Router()

// Validation middleware for booking creation
const validateBooking = [
  body("professionalId").isMongoId().withMessage("Invalid professional ID"),
  body("serviceId").isMongoId().withMessage("Invalid service ID"),
  body("schedule.date").isISO8601().withMessage("Invalid date format"),
  body("schedule.timeSlot.start")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Invalid time format"),
  body("location.address").notEmpty().withMessage("Address is required"),
  body("pricing.baseAmount").isFloat({ min: 0 }).withMessage("Base amount must be a positive number"),
  body("payment.method").isIn(["cash", "upi", "card", "wallet", "bank_transfer"]).withMessage("Invalid payment method"),
]

// GET /api/bookings - Get user's bookings
router.get("/", auth, async (req, res) => {
  try {
    const { status, limit = 20, page = 1 } = req.query

    const query = {}

    // Filter by user type
    if (req.user.userType === "professional") {
      const professional = await Professional.findOne({ user: req.user.userId })
      if (!professional) {
        return res.status(404).json({
          success: false,
          message: "Professional profile not found",
        })
      }
      query.professional = professional._id
    } else {
      query.customer = req.user.userId
    }

    // Status filter
    if (status) {
      query.status = status
    }

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    const bookings = await Booking.find(query)
      .populate("customer", "name phone")
      .populate("professional", "user profile")
      .populate("service", "name icon")
      .sort({ createdAt: -1 })
      .limit(Number.parseInt(limit))
      .skip(skip)

    const total = await Booking.countDocuments(query)

    res.json({
      success: true,
      data: bookings,
      pagination: {
        current: Number.parseInt(page),
        pages: Math.ceil(total / Number.parseInt(limit)),
        total,
        limit: Number.parseInt(limit),
      },
    })
  } catch (error) {
    console.error("Get bookings error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching bookings",
    })
  }
})

// GET /api/bookings/:id - Get booking by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("customer", "name phone email")
      .populate("professional", "user profile")
      .populate("service", "name icon description")

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      })
    }

    // Check if user has access to this booking
    const hasAccess =
      booking.customer._id.toString() === req.user.userId ||
      (booking.professional && booking.professional.user.toString() === req.user.userId) ||
      req.user.userType === "admin"

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    res.json({
      success: true,
      data: booking,
    })
  } catch (error) {
    console.error("Get booking error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching booking",
    })
  }
})

// POST /api/bookings - Create new booking
router.post("/", auth, validateBooking, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const { professionalId, serviceId, schedule, location, serviceDescription } = req.body

    // Get user details
    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Get professional details
    const professional = await Professional.findById(professionalId).populate("userId", "name phone")

    if (!professional || professional.status !== "active") {
      return res.status(404).json({
        success: false,
        message: "Professional not found or inactive",
      })
    }

    // Get service details
    const service = await Service.findById(serviceId)
    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: "Service not found or inactive",
      })
    }

    // Check if professional offers this service
    const professionalService = professional.services.find((s) => s.serviceId.toString() === serviceId)

    if (!professionalService) {
      return res.status(400).json({
        success: false,
        message: "Professional does not offer this service",
      })
    }

    // Create booking
    const booking = new Booking({
      customer: {
        userId: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
      },
      professional: {
        professionalId: professional._id,
        name: professional.userId.name,
        phone: professional.userId.phone,
      },
      service: {
        serviceId: service._id,
        name: service.name,
        category: service.category,
        description: serviceDescription || service.description,
      },
      schedule,
      location,
      pricing: {
        baseAmount: professionalService.pricing.hourlyRate,
        totalAmount:
          professionalService.pricing.hourlyRate * (schedule.estimatedDuration ? schedule.estimatedDuration / 60 : 1),
      },
      payment: {
        method: req.body.payment.method || "cash",
        status: "pending",
      },
      status: "pending",
      timeline: [
        {
          status: "pending",
          timestamp: new Date(),
          note: "Booking created",
          updatedBy: user._id,
        },
      ],
    })

    await booking.save()

    // Update professional stats
    professional.stats.totalBookings += 1
    await professional.save()

    // Update service stats
    service.stats.totalBookings += 1
    await service.save()

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: {
        bookingId: booking.bookingId,
        id: booking._id,
        status: booking.status,
        schedule: booking.schedule,
        totalAmount: booking.pricing.totalAmount,
      },
    })
  } catch (error) {
    console.error("Create booking error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create booking",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    })
  }
})

// PUT /api/bookings/:id/status - Update booking status
router.put(
  "/:id/status",
  auth,
  [
    body("status").isIn(["confirmed", "in_progress", "completed", "cancelled"]).withMessage("Invalid status"),
    body("note").optional().isString().withMessage("Note must be a string"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { status, note } = req.body

      const booking = await Booking.findById(req.params.id)
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        })
      }

      // Check permissions
      const canUpdate =
        booking.customer.userId.toString() === req.user.userId ||
        (booking.professional.professionalId && booking.professional.professionalId.toString() === req.user.userId) ||
        req.user.userType === "admin"

      if (!canUpdate) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        })
      }

      // Update status with timeline
      await booking.addTimelineEntry(status, note, req.user.userId)

      // Update professional stats if booking is completed
      if (status === "completed") {
        const professional = await Professional.findById(booking.professional.professionalId)
        if (professional) {
          professional.stats.completedBookings += 1
          await professional.updateCompletionRate()
        }
      }

      res.json({
        success: true,
        message: "Booking status updated successfully",
        data: {
          bookingId: booking.bookingId,
          status: booking.status,
          timeline: booking.timeline,
        },
      })
    } catch (error) {
      console.error("Update booking status error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to update booking status",
        error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
      })
    }
  },
)

// POST /api/bookings/:id/feedback - Submit booking feedback
router.post(
  "/:id/feedback",
  auth,
  [
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
    body("review").optional().isLength({ max: 500 }).withMessage("Review cannot exceed 500 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { rating, review, aspects } = req.body

      const booking = await Booking.findById(req.params.id)

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        })
      }

      if (booking.status !== "completed") {
        return res.status(400).json({
          success: false,
          message: "Can only provide feedback for completed bookings",
        })
      }

      // Determine feedback type based on user
      const isCustomer = booking.customer.userId.toString() === req.user.userId
      const isProfessional =
        booking.professional.professionalId && booking.professional.professionalId.toString() === req.user.userId

      if (!isCustomer && !isProfessional) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        })
      }

      // Update feedback
      if (isCustomer) {
        booking.feedback.customer = {
          rating,
          review,
          aspects,
          submittedAt: new Date(),
        }

        // Update professional rating
        const professional = await Professional.findById(booking.professional.professionalId)
        if (professional) {
          await professional.updateRating(rating)
        }
      } else {
        booking.feedback.professional = {
          rating,
          review,
          submittedAt: new Date(),
        }
      }

      await booking.save()

      res.json({
        success: true,
        message: "Feedback submitted successfully",
        data: booking.feedback,
      })
    } catch (error) {
      console.error("Submit feedback error:", error)
      res.status(500).json({
        success: false,
        message: "Failed to submit feedback",
        error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
      })
    }
  },
)

module.exports = router
