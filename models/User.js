const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^[6-9]\d{9}$/, "Please enter a valid Indian phone number"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
    },
    userType: {
      type: String,
      enum: ["customer", "professional", "admin"],
      default: "customer",
    },
    profile: {
      avatar: String,
      dateOfBirth: Date,
      gender: {
        type: String,
        enum: ["male", "female", "other"],
      },
      bio: String,
      address: {
        street: String,
        city: String,
        state: { type: String, default: "Kerala" },
        pincode: String,
        coordinates: {
          latitude: Number,
          longitude: Number,
        },
      },
    },
    preferences: {
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        push: { type: Boolean, default: false },
      },
      language: { type: String, default: "en" },
    },
    verification: {
      email: { type: Boolean, default: false },
      phone: { type: Boolean, default: false },
      kyc: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
  },
  {
    timestamps: true,
  },
)

// Indexes
userSchema.index({ email: 1 })
userSchema.index({ phone: 1 })
userSchema.index({ userType: 1 })
userSchema.index({ "profile.address.city": 1 })

// Virtual for account lock status
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now())
})

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    })
  }

  const updates = { $inc: { loginAttempts: 1 } }

  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 } // 2 hours
  }

  return this.updateOne(updates)
}

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
  })
}

// Transform output
userSchema.methods.toJSON = function () {
  const user = this.toObject()
  delete user.password
  delete user.loginAttempts
  delete user.lockUntil
  return user
}

module.exports = mongoose.model("User", userSchema)
