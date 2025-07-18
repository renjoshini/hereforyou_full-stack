const express = require("express")
const User = require("../models/User")
const Booking = require("../models/Booking")
const Professional = require("../models/Professional")
const auth = require("../middleware/auth")

const router = express.Router()

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    })
  }
})

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", auth, async (req, res) => {
  try {
    const allowedUpdates = [
      "name",
      "phone",
      "profile.dateOfBirth",
      "profile.gender",
      "profile.bio",
      "profile.address",
      "preferences",
    ]

    const updates = {}
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key]
      }
    })

    const user = await User.findByIdAndUpdate(req.user.userId, updates, { new: true, runValidators: true }).select(
      "-password",
    )

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while updating profile",
    })
  }
})

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get("/dashboard", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    const dashboardData = {
      user,
      recentBookings: [],
      stats: {},
    }

    if (user.userType === "customer") {
      // Get customer bookings and stats
      const recentBookings = await Booking.find({ customer: req.user.userId })
        .populate("service", "name icon")
        .populate("professional", "user profile")
        .sort({ createdAt: -1 })
        .limit(5)

      const stats = await Booking.getStats(req.user.userId, "customer")

      dashboardData.recentBookings = recentBookings
      dashboardData.stats = stats[0] || {
        totalBookings: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
      }
    } else if (user.userType === "professional") {
      // Get professional data
      const professional = await Professional.findOne({ user: req.user.userId })

      if (professional) {
        const recentBookings = await Booking.find({ professional: professional._id })
          .populate("service", "name icon")
          .populate("customer", "name phone")
          .sort({ createdAt: -1 })
          .limit(5)

        const stats = await Booking.getStats(professional._id, "professional")

        dashboardData.recentBookings = recentBookings
        dashboardData.stats = stats[0] || {
          totalBookings: 0,
          pendingBookings: 0,
          confirmedBookings: 0,
          completedBookings: 0,
          cancelledBookings: 0,
          totalEarnings: 0,
        }
        dashboardData.professional = professional
      }
    }

    res.json({
      success: true,
      data: dashboardData,
    })
  } catch (error) {
    console.error("Get dashboard error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching dashboard data",
    })
  }
})

// @route   POST /api/users/support
// @desc    Submit support request
// @access  Private
router.post("/support", auth, async (req, res) => {
  try {
    const { subject, message, category, priority = "medium" } = req.body

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required",
      })
    }

    // Here you would typically save to a Support/Ticket model
    // For now, we'll just log it and return success
    console.log("Support Request:", {
      user: req.user.userId,
      subject,
      message,
      category,
      priority,
      timestamp: new Date(),
    })

    res.json({
      success: true,
      message: "Support request submitted successfully. We will get back to you soon.",
      data: {
        ticketId: "TK" + Date.now(),
        status: "submitted",
      },
    })
  } catch (error) {
    console.error("Submit support request error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while submitting support request",
    })
  }
})

module.exports = router
