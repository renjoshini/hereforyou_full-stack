const express = require("express")
const jwt = require("jsonwebtoken")
const { body, validationResult } = require("express-validator")
const User = require("../models/User")
const auth = require("../middleware/auth")

const router = express.Router()

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  })
}

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),
    body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email"),
    body("phone")
      .matches(/^[6-9]\d{9}$/)
      .withMessage("Please enter a valid Indian phone number"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { name, email, phone, password, userType = "customer" } = req.body

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { phone }],
      })

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists with this email or phone number",
        })
      }

      // Create new user
      const user = new User({
        name,
        email,
        phone,
        password,
        userType,
      })

      await user.save()

      // Generate token
      const token = generateToken(user._id)

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: user.toJSON(),
          token,
        },
      })
    } catch (error) {
      console.error("Registration error:", error)
      res.status(500).json({
        success: false,
        message: "Server error during registration",
      })
    }
  },
)

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  "/login",
  [
    body("email").notEmpty().withMessage("Email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { email, password } = req.body

      // Find user by email or phone
      const user = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { phone: email }, // Allow login with phone number
        ],
      })

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        })
      }

      // Check if account is locked
      if (user.isLocked) {
        return res.status(423).json({
          success: false,
          message: "Account is temporarily locked due to too many failed login attempts",
        })
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password)

      if (!isPasswordValid) {
        // Increment login attempts
        await user.incLoginAttempts()

        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        })
      }

      // Reset login attempts on successful login
      if (user.loginAttempts > 0) {
        await user.resetLoginAttempts()
      }

      // Update last login
      user.lastLogin = new Date()
      await user.save()

      // Generate token
      const token = generateToken(user._id)

      res.json({
        success: true,
        message: "Login successful",
        data: {
          user: user.toJSON(),
          token,
        },
      })
    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({
        success: false,
        message: "Server error during login",
      })
    }
  },
)

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", auth, async (req, res) => {
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
      data: {
        user: user.toJSON(),
      },
    })
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post("/logout", auth, (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  })
})

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put(
  "/change-password",
  [
    auth,
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword").isLength({ min: 8 }).withMessage("New password must be at least 8 characters long"),
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

      const { currentPassword, newPassword } = req.body
      const user = await User.findById(req.user.userId)

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword)
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        })
      }

      // Update password
      user.password = newPassword
      await user.save()

      res.json({
        success: true,
        message: "Password changed successfully",
      })
    } catch (error) {
      console.error("Change password error:", error)
      res.status(500).json({
        success: false,
        message: "Server error",
      })
    }
  },
)

module.exports = router
