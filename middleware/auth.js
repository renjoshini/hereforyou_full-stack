const jwt = require("jsonwebtoken")
const User = require("../models/User")

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Get user from database
    const user = await User.findById(decoded.userId).select("-password")

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is not valid. User not found.",
      })
    }

    if (user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Account is inactive. Please contact support.",
      })
    }

    req.user = {
      userId: user._id.toString(),
      userType: user.userType,
      email: user.email,
      name: user.name,
    }

    next()
  } catch (error) {
    console.error("Auth middleware error:", error)

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      })
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      })
    }

    res.status(500).json({
      success: false,
      message: "Server error in authentication",
    })
  }
}

module.exports = auth
