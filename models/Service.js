const mongoose = require("mongoose")

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
      maxlength: [100, "Service name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Service description is required"],
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    category: {
      type: String,
      required: [true, "Service category is required"],
      enum: [
        "home-maintenance",
        "cleaning",
        "repair",
        "installation",
        "personal-care",
        "automotive",
        "gardening",
        "healthcare",
      ],
    },
    icon: {
      type: String,
      required: [true, "Service icon is required"],
    },
    pricing: {
      basePrice: {
        type: Number,
        required: [true, "Base price is required"],
        min: [0, "Price cannot be negative"],
      },
      priceUnit: {
        type: String,
        enum: ["hour", "service", "sqft", "item"],
        default: "hour",
      },
      currency: {
        type: String,
        default: "INR",
      },
    },
    serviceDetails: {
      duration: {
        min: Number, // in minutes
        max: Number,
      },
      requirements: [String],
      includes: [String],
      excludes: [String],
    },
    availability: {
      locations: [
        {
          city: String,
          areas: [String],
        },
      ],
      workingHours: {
        start: String, // "09:00"
        end: String, // "18:00"
        days: [String], // ["monday", "tuesday", ...]
      },
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
    },
    stats: {
      totalBookings: { type: Number, default: 0 },
      completedBookings: { type: Number, default: 0 },
      activeBookings: { type: Number, default: 0 },
    },
    media: {
      images: [String],
      videos: [String],
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
      default: "active",
    },
    featured: {
      type: Boolean,
      default: false,
    },
    popularityScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
serviceSchema.index({ slug: 1 })
serviceSchema.index({ category: 1 })
serviceSchema.index({ status: 1 })
serviceSchema.index({ featured: 1 })
serviceSchema.index({ "rating.average": -1 })
serviceSchema.index({ popularityScore: -1 })
serviceSchema.index({ "availability.locations.city": 1 })

// Text search index
serviceSchema.index({
  name: "text",
  description: "text",
  "seo.keywords": "text",
})

// Pre-save middleware to generate slug
serviceSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }
  next()
})

// Method to update rating
serviceSchema.methods.updateRating = async function (newRating) {
  const totalRating = this.rating.average * this.rating.count + newRating
  this.rating.count += 1
  this.rating.average = totalRating / this.rating.count
  return this.save()
}

// Static method to get popular services
serviceSchema.statics.getPopular = function (limit = 10) {
  return this.find({ status: "active" }).sort({ popularityScore: -1, "rating.average": -1 }).limit(limit)
}

// Static method to search services
serviceSchema.statics.searchServices = function (query, location) {
  const searchQuery = {
    status: "active",
    $text: { $search: query },
  }

  if (location) {
    searchQuery["availability.locations.city"] = new RegExp(location, "i")
  }

  return this.find(searchQuery, { score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } })
}

module.exports = mongoose.model("Service", serviceSchema)
