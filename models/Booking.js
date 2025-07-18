const mongoose = require("mongoose")

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professional",
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    serviceDetails: {
      type: {
        type: String,
        required: true,
      },
      description: String,
      urgency: {
        type: String,
        enum: ["normal", "urgent", "emergency"],
        default: "normal",
      },
      requirements: [String],
    },
    schedule: {
      date: {
        type: Date,
        required: true,
      },
      timeSlot: {
        start: String, // "10:00"
        end: String, // "12:00"
      },
      estimatedDuration: Number, // in minutes
    },
    location: {
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      pincode: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
      instructions: String,
    },
    contact: {
      name: String,
      phone: String,
      alternatePhone: String,
    },
    pricing: {
      baseAmount: {
        type: Number,
        required: true,
      },
      additionalCharges: [
        {
          description: String,
          amount: Number,
        },
      ],
      discount: {
        amount: Number,
        reason: String,
      },
      taxes: {
        amount: Number,
        breakdown: [
          {
            name: String,
            rate: Number,
            amount: Number,
          },
        ],
      },
      totalAmount: {
        type: Number,
        required: true,
      },
    },
    payment: {
      method: {
        type: String,
        enum: ["cash", "upi", "card", "wallet"],
        required: true,
      },
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
      },
      transactionId: String,
      paidAt: Date,
      refundDetails: {
        amount: Number,
        reason: String,
        processedAt: Date,
      },
    },
    status: {
      type: String,
      enum: [
        "pending", // Waiting for professional confirmation
        "confirmed", // Professional confirmed
        "in-progress", // Work started
        "completed", // Work completed
        "cancelled", // Cancelled by customer/professional
        "no-show", // Professional didn't show up
        "disputed", // Under dispute
      ],
      default: "pending",
    },
    timeline: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    communication: [
      {
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        message: String,
        timestamp: { type: Date, default: Date.now },
        type: {
          type: String,
          enum: ["message", "system", "update"],
          default: "message",
        },
      },
    ],
    feedback: {
      customer: {
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        review: String,
        aspects: {
          punctuality: Number,
          quality: Number,
          behavior: Number,
          cleanliness: Number,
        },
        submittedAt: Date,
      },
      professional: {
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        review: String,
        submittedAt: Date,
      },
    },
    workDetails: {
      startTime: Date,
      endTime: Date,
      actualDuration: Number, // in minutes
      workPhotos: [String],
      workDescription: String,
      materialsUsed: [
        {
          item: String,
          quantity: Number,
          cost: Number,
        },
      ],
    },
    cancellation: {
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reason: String,
      cancelledAt: Date,
      refundAmount: Number,
    },
    metadata: {
      source: {
        type: String,
        enum: ["web", "mobile", "admin"],
        default: "web",
      },
      deviceInfo: String,
      ipAddress: String,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
bookingSchema.index({ bookingId: 1 })
bookingSchema.index({ customer: 1 })
bookingSchema.index({ professional: 1 })
bookingSchema.index({ service: 1 })
bookingSchema.index({ status: 1 })
bookingSchema.index({ "schedule.date": 1 })
bookingSchema.index({ createdAt: -1 })

// Pre-save middleware to generate booking ID
bookingSchema.pre("save", function (next) {
  if (!this.bookingId) {
    this.bookingId = "BK" + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase()
  }
  next()
})

// Method to add timeline entry
bookingSchema.methods.addTimelineEntry = function (status, note, updatedBy) {
  this.timeline.push({
    status,
    note,
    updatedBy,
    timestamp: new Date(),
  })
  this.status = status
  return this.save()
}

// Method to add communication
bookingSchema.methods.addMessage = function (from, message, type = "message") {
  this.communication.push({
    from,
    message,
    type,
    timestamp: new Date(),
  })
  return this.save()
}

// Static method to get booking statistics
bookingSchema.statics.getStats = function (userId, userType) {
  const matchQuery = userType === "customer" ? { customer: userId } : { professional: userId }

  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        pendingBookings: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        confirmedBookings: {
          $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] },
        },
        completedBookings: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        cancelledBookings: {
          $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
        },
        totalEarnings: { $sum: "$pricing.totalAmount" },
      },
    },
  ])
}

module.exports = mongoose.model("Booking", bookingSchema)
