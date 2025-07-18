const mongoose = require("mongoose")

const professionalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    services: [
      {
        service: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Service",
          required: true,
        },
        experience: {
          type: Number,
          required: true,
          min: 0,
        },
        specialties: [String],
        pricing: {
          hourlyRate: {
            type: Number,
            required: true,
            min: 0,
          },
          minimumCharge: Number,
          travelCharge: Number,
        },
      },
    ],
    profile: {
      businessName: String,
      description: {
        type: String,
        maxlength: [1000, "Description cannot exceed 1000 characters"],
      },
      experience: {
        total: {
          type: Number,
          required: true,
          min: 0,
        },
        description: String,
      },
      skills: [String],
      languages: [String],
    },
    verification: {
      identity: {
        status: {
          type: String,
          enum: ["pending", "verified", "rejected"],
          default: "pending",
        },
        documents: [
          {
            type: String, // 'aadhar', 'pan', 'license'
            url: String,
            verifiedAt: Date,
          },
        ],
      },
      background: {
        status: {
          type: String,
          enum: ["pending", "verified", "rejected"],
          default: "pending",
        },
        verifiedAt: Date,
      },
      skills: {
        status: {
          type: String,
          enum: ["pending", "verified", "rejected"],
          default: "pending",
        },
        certificates: [
          {
            name: String,
            url: String,
            issuedBy: String,
            issuedAt: Date,
            verifiedAt: Date,
          },
        ],
      },
    },
    availability: {
      workingHours: {
        monday: { start: String, end: String, available: Boolean },
        tuesday: { start: String, end: String, available: Boolean },
        wednesday: { start: String, end: String, available: Boolean },
        thursday: { start: String, end: String, available: Boolean },
        friday: { start: String, end: String, available: Boolean },
        saturday: { start: String, end: String, available: Boolean },
        sunday: { start: String, end: String, available: Boolean },
      },
      serviceAreas: [
        {
          city: String,
          areas: [String],
          travelTime: Number, // in minutes
        },
      ],
      currentStatus: {
        type: String,
        enum: ["available", "busy", "offline"],
        default: "available",
      },
      lastSeen: Date,
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
      breakdown: {
        5: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        1: { type: Number, default: 0 },
      },
    },
    stats: {
      totalBookings: { type: Number, default: 0 },
      completedBookings: { type: Number, default: 0 },
      cancelledBookings: { type: Number, default: 0 },
      responseTime: { type: Number, default: 0 }, // in minutes
      completionRate: { type: Number, default: 0 }, // percentage
      earnings: {
        total: { type: Number, default: 0 },
        thisMonth: { type: Number, default: 0 },
        lastMonth: { type: Number, default: 0 },
      },
    },
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      verified: { type: Boolean, default: false },
    },
    preferences: {
      maxBookingsPerDay: { type: Number, default: 5 },
      advanceBookingDays: { type: Number, default: 30 },
      autoAcceptBookings: { type: Boolean, default: false },
      notifications: {
        newBooking: { type: Boolean, default: true },
        bookingReminder: { type: Boolean, default: true },
        payment: { type: Boolean, default: true },
      },
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "pending"],
      default: "pending",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
professionalSchema.index({ user: 1 })
professionalSchema.index({ "services.service": 1 })
professionalSchema.index({ status: 1 })
professionalSchema.index({ "rating.average": -1 })
professionalSchema.index({ "availability.serviceAreas.city": 1 })
professionalSchema.index({ "availability.currentStatus": 1 })

// Virtual for overall verification status
professionalSchema.virtual("isVerified").get(function () {
  return this.verification.identity.status === "verified" && this.verification.background.status === "verified"
})

// Method to update rating
professionalSchema.methods.updateRating = async function (newRating) {
  // Update breakdown
  this.rating.breakdown[newRating] += 1

  // Calculate new average
  const totalRating = this.rating.average * this.rating.count + newRating
  this.rating.count += 1
  this.rating.average = totalRating / this.rating.count

  return this.save()
}

// Method to check availability
professionalSchema.methods.isAvailableAt = function (date, duration = 60) {
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
  const daySchedule = this.availability.workingHours[dayName]

  if (!daySchedule || !daySchedule.available) {
    return false
  }

  // Additional logic for checking specific time slots can be added here
  return this.availability.currentStatus === "available"
}

// Static method to find professionals by service and location
professionalSchema.statics.findByServiceAndLocation = function (serviceId, city, options = {}) {
  const query = {
    "services.service": serviceId,
    "availability.serviceAreas.city": new RegExp(city, "i"),
    status: "active",
  }

  let queryBuilder = this.find(query).populate("user", "name profile.avatar").populate("services.service", "name")

  // Apply sorting
  if (options.sortBy === "rating") {
    queryBuilder = queryBuilder.sort({ "rating.average": -1 })
  } else if (options.sortBy === "price") {
    queryBuilder = queryBuilder.sort({ "services.pricing.hourlyRate": 1 })
  } else {
    queryBuilder = queryBuilder.sort({ "rating.average": -1, "stats.completedBookings": -1 })
  }

  if (options.limit) {
    queryBuilder = queryBuilder.limit(options.limit)
  }

  return queryBuilder
}

module.exports = mongoose.model("Professional", professionalSchema)
