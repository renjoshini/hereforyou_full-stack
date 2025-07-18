const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
require("dotenv").config()

const User = require("../models/User")
const Service = require("../models/Service")
const Professional = require("../models/Professional")
const Booking = require("../models/Booking")

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("✅ MongoDB Connected for seeding")
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message)
    process.exit(1)
  }
}

const seedUsers = async () => {
  console.log("🌱 Seeding users...")

  const users = [
    {
      name: "Admin User",
      email: "admin@hereforyou.in",
      phone: "9876543210",
      password: "Admin@123",
      userType: "admin",
      verification: {
        email: true,
        phone: true,
        kyc: true,
      },
    },
    {
      name: "Renjini Xavier",
      email: "renjini@example.com",
      phone: "9876543211",
      password: "Customer@123",
      userType: "customer",
      profile: {
        dateOfBirth: new Date("1990-05-15"),
        gender: "female",
        address: {
          street: "123 Rose Garden",
          city: "Trivandrum",
          state: "Kerala",
          pincode: "682030",
        },
      },
    },
    {
      name: "Suresh Kumar",
      email: "suresh@example.com",
      phone: "9876543212",
      password: "Professional@123",
      userType: "professional",
      profile: {
        gender: "male",
        address: {
          street: "128 Eastfort",
          city: "Trivandrum",
          state: "Kerala",
          pincode: "682001",
        },
      },
    },
    {
      name: "Meera Kumari",
      email: "meera@example.com",
      phone: "9876543213",
      password: "Professional@123",
      userType: "professional",
      profile: {
        gender: "female",
        address: {
          street: "89 Green Lane",
          city: "Trivandrum",
          state: "Kerala",
          pincode: "682002",
        },
      },
    },
    {
      name: "Devi",
      email: "devi@example.com",
      phone: "9876543214",
      password: "Professional@123",
      userType: "professional",
      profile: {
        gender: "female",
        address: {
          street: "Vazhuthacaud",
          city: "Thiruvananthapuram",
          state: "Kerala",
          pincode: "695014",
        },
      },
    },
  ]

  await User.deleteMany({})

  for (const userData of users) {
    const user = new User(userData)
    await user.save()
  }

  console.log("✅ Users seeded successfully")
  return await User.find({})
}

const seedServices = async () => {
  console.log("🌱 Seeding services...")

  const services = [
    {
      name: "Plumbing",
      description: "Pipe repairs, leaks, installations",
      category: "home-maintenance",
      icon: "fas fa-wrench",
      pricing: {
        basePrice: 300,
        priceUnit: "hour",
      },
      serviceDetails: {
        duration: { min: 60, max: 240 },
        includes: ["Basic tools", "Labor", "Minor parts"],
        excludes: ["Major parts", "Materials"],
      },
      availability: {
        locations: [
          { city: "Trivandrum", areas: ["Eastfort", "Pattom", "Kowdiar"] },
          { city: "Kollam", areas: ["Chinnakada", "Kadappakada"] },
        ],
        workingHours: {
          start: "09:00",
          end: "18:00",
          days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
        },
      },
      rating: { average: 4.8, count: 156 },
      featured: true,
      popularityScore: 95,
    },
    {
      name: "AC Repair",
      description: "AC service, installation, maintenance",
      category: "repair",
      icon: "fas fa-snowflake",
      pricing: {
        basePrice: 400,
        priceUnit: "hour",
      },
      serviceDetails: {
        duration: { min: 90, max: 300 },
        includes: ["Diagnostic", "Basic cleaning", "Labor"],
        excludes: ["Parts", "Gas refill", "Major repairs"],
      },
      availability: {
        locations: [
          { city: "Trivandrum", areas: ["Vazhuthacaud", "Pattom", "Kowdiar"] },
          { city: "Kochi", areas: ["Ernakulam", "Kakkanad"] },
        ],
        workingHours: {
          start: "08:00",
          end: "19:00",
          days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
        },
      },
      rating: { average: 4.9, count: 203 },
      featured: true,
      popularityScore: 88,
    },
    {
      name: "House Cleaning",
      description: "Deep cleaning, regular cleaning",
      category: "cleaning",
      icon: "fas fa-broom",
      pricing: {
        basePrice: 200,
        priceUnit: "hour",
      },
      serviceDetails: {
        duration: { min: 120, max: 480 },
        includes: ["Cleaning supplies", "Equipment", "Labor"],
        excludes: ["Special chemicals", "Carpet cleaning"],
      },
      availability: {
        locations: [
          { city: "Trivandrum", areas: ["Green Lane", "Pattom", "Kowdiar"] },
          { city: "Kollam", areas: ["Chinnakada"] },
        ],
        workingHours: {
          start: "07:00",
          end: "17:00",
          days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
        },
      },
      rating: { average: 4.7, count: 134 },
      featured: true,
      popularityScore: 82,
    },
    {
      name: "Electrical",
      description: "Wiring, repairs, installations",
      category: "repair",
      icon: "fas fa-bolt",
      pricing: {
        basePrice: 350,
        priceUnit: "hour",
      },
      availability: {
        locations: [{ city: "Trivandrum", areas: ["Eastfort", "Pattom"] }],
        workingHours: {
          start: "09:00",
          end: "18:00",
          days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
        },
      },
      rating: { average: 4.6, count: 89 },
      popularityScore: 75,
    },
    {
      name: "Car Repair",
      description: "Auto service, repairs, maintenance",
      category: "automotive",
      icon: "fas fa-car",
      pricing: {
        basePrice: 500,
        priceUnit: "service",
      },
      availability: {
        locations: [{ city: "Trivandrum", areas: ["Eastfort", "Pattom"] }],
        workingHours: {
          start: "08:00",
          end: "19:00",
          days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
        },
      },
      rating: { average: 4.5, count: 67 },
      popularityScore: 70,
    },
  ]

  await Service.deleteMany({})

  for (const serviceData of services) {
    const service = new Service(serviceData)
    await service.save()
  }

  console.log("✅ Services seeded successfully")
  return await Service.find({})
}

const seedProfessionals = async (users, services) => {
  console.log("🌱 Seeding professionals...")

  const professionalUsers = users.filter((user) => user.userType === "professional")

  await Professional.deleteMany({})

  // Suresh Kumar - Plumber
  const suresh = professionalUsers.find((u) => u.name === "Suresh Kumar")
  const plumbingService = services.find((s) => s.name === "Plumbing")

  const sureshProfessional = new Professional({
    user: suresh._id,
    services: [
      {
        service: plumbingService._id,
        experience: 8,
        specialties: ["Pipe repairs", "Bathroom fittings", "Water heater service"],
        pricing: {
          hourlyRate: 300,
          minimumCharge: 200,
          travelCharge: 50,
        },
      },
    ],
    profile: {
      businessName: "Suresh Plumbing Services",
      description: "Experienced plumber with 8 years in the field. Specializes in residential and commercial plumbing.",
      experience: {
        total: 8,
        description: "8 years of professional plumbing experience",
      },
      skills: ["Pipe Installation", "Leak Detection", "Bathroom Fitting", "Water Heater Repair"],
      languages: ["Malayalam", "English", "Hindi"],
    },
    verification: {
      identity: { status: "verified", verifiedAt: new Date() },
      background: { status: "verified", verifiedAt: new Date() },
      skills: { status: "verified" },
    },
    availability: {
      workingHours: {
        monday: { start: "09:00", end: "18:00", available: true },
        tuesday: { start: "09:00", end: "18:00", available: true },
        wednesday: { start: "09:00", end: "18:00", available: true },
        thursday: { start: "09:00", end: "18:00", available: true },
        friday: { start: "09:00", end: "18:00", available: true },
        saturday: { start: "09:00", end: "16:00", available: true },
        sunday: { available: false },
      },
      serviceAreas: [{ city: "Trivandrum", areas: ["Eastfort", "Pattom", "Kowdiar"], travelTime: 30 }],
      currentStatus: "available",
    },
    rating: {
      average: 4.8,
      count: 156,
      breakdown: { 5: 124, 4: 23, 3: 6, 2: 2, 1: 1 },
    },
    stats: {
      totalBookings: 156,
      completedBookings: 148,
      cancelledBookings: 3,
      responseTime: 15,
      completionRate: 94.9,
      earnings: { total: 125000, thisMonth: 15000, lastMonth: 18000 },
    },
    status: "active",
  })

  await sureshProfessional.save()

  // Meera Kumari - House Cleaning
  const meera = professionalUsers.find((u) => u.name === "Meera Kumari")
  const cleaningService = services.find((s) => s.name === "House Cleaning")

  const meeraProfessional = new Professional({
    user: meera._id,
    services: [
      {
        service: cleaningService._id,
        experience: 6,
        specialties: ["Deep cleaning", "Regular cleaning", "Organization"],
        pricing: {
          hourlyRate: 200,
          minimumCharge: 300,
          travelCharge: 30,
        },
      },
    ],
    profile: {
      businessName: "Meera Cleaning Services",
      description: "Professional house cleaning with attention to detail. Eco-friendly products available.",
      experience: {
        total: 6,
        description: "6 years of professional cleaning experience",
      },
      skills: ["Deep Cleaning", "Organization", "Eco-friendly Cleaning", "Kitchen Cleaning"],
      languages: ["Malayalam", "English"],
    },
    verification: {
      identity: { status: "verified", verifiedAt: new Date() },
      background: { status: "verified", verifiedAt: new Date() },
      skills: { status: "verified" },
    },
    availability: {
      workingHours: {
        monday: { start: "07:00", end: "17:00", available: true },
        tuesday: { start: "07:00", end: "17:00", available: true },
        wednesday: { start: "07:00", end: "17:00", available: true },
        thursday: { start: "07:00", end: "17:00", available: true },
        friday: { start: "07:00", end: "17:00", available: true },
        saturday: { start: "08:00", end: "15:00", available: true },
        sunday: { available: false },
      },
      serviceAreas: [{ city: "Trivandrum", areas: ["Green Lane", "Pattom", "Kowdiar"], travelTime: 25 }],
      currentStatus: "available",
    },
    rating: {
      average: 4.7,
      count: 134,
      breakdown: { 5: 98, 4: 28, 3: 6, 2: 1, 1: 1 },
    },
    stats: {
      totalBookings: 134,
      completedBookings: 128,
      cancelledBookings: 2,
      responseTime: 20,
      completionRate: 95.5,
      earnings: { total: 89000, thisMonth: 12000, lastMonth: 14000 },
    },
    status: "active",
  })

  await meeraProfessional.save()

  // Devi - AC Repair
  const devi = professionalUsers.find((u) => u.name === "Devi")
  const acService = services.find((s) => s.name === "AC Repair")

  const deviProfessional = new Professional({
    user: devi._id,
    services: [
      {
        service: acService._id,
        experience: 10,
        specialties: ["Split AC service", "Window AC repair", "Installation"],
        pricing: {
          hourlyRate: 400,
          minimumCharge: 300,
          travelCharge: 100,
        },
      },
    ],
    profile: {
      businessName: "Devi AC Services",
      description: "Expert AC technician with 10 years experience. All brands serviced.",
      experience: {
        total: 10,
        description: "10 years of AC repair and maintenance experience",
      },
      skills: ["AC Installation", "Gas Refilling", "Compressor Repair", "Electrical Troubleshooting"],
      languages: ["Malayalam", "English", "Tamil"],
    },
    verification: {
      identity: { status: "verified", verifiedAt: new Date() },
      background: { status: "verified", verifiedAt: new Date() },
      skills: { status: "verified" },
    },
    availability: {
      workingHours: {
        monday: { start: "08:00", end: "19:00", available: true },
        tuesday: { start: "08:00", end: "19:00", available: true },
        wednesday: { start: "08:00", end: "19:00", available: true },
        thursday: { start: "08:00", end: "19:00", available: true },
        friday: { start: "08:00", end: "19:00", available: true },
        saturday: { start: "08:00", end: "17:00", available: true },
        sunday: { start: "10:00", end: "15:00", available: true },
      },
      serviceAreas: [{ city: "Thiruvananthapuram", areas: ["Vazhuthacaud", "Pattom", "Kowdiar"], travelTime: 20 }],
      currentStatus: "available",
    },
    rating: {
      average: 4.9,
      count: 203,
      breakdown: { 5: 178, 4: 18, 3: 5, 2: 1, 1: 1 },
    },
    stats: {
      totalBookings: 203,
      completedBookings: 195,
      cancelledBookings: 3,
      responseTime: 12,
      completionRate: 96.1,
      earnings: { total: 185000, thisMonth: 22000, lastMonth: 25000 },
    },
    status: "active",
  })

  await deviProfessional.save()

  console.log("✅ Professionals seeded successfully")
  return await Professional.find({})
}

const seedBookings = async (users, professionals, services) => {
  console.log("🌱 Seeding sample bookings...")

  const customer = users.find((u) => u.userType === "customer")
  const plumberProfessional = professionals.find((p) => p.profile.businessName === "Suresh Plumbing Services")
  const plumbingService = services.find((s) => s.name === "Plumbing")

  await Booking.deleteMany({})

  const sampleBookings = [
    {
      customer: customer._id,
      professional: plumberProfessional._id,
      service: plumbingService._id,
      serviceDetails: {
        type: "Pipe Repair",
        description: "Kitchen sink pipe is leaking",
        urgency: "normal",
      },
      schedule: {
        date: new Date("2025-01-15T10:00:00Z"),
        timeSlot: { start: "10:00", end: "12:00" },
        estimatedDuration: 120,
      },
      location: {
        address: "123 Rose Garden, Trivandrum",
        city: "Trivandrum",
        pincode: "682030",
      },
      contact: {
        name: "Renjini Xavier",
        phone: "9876543211",
      },
      pricing: {
        baseAmount: 600,
        totalAmount: 600,
      },
      payment: {
        method: "cash",
        status: "pending",
      },
      status: "confirmed",
      timeline: [
        {
          status: "pending",
          note: "Booking created",
          timestamp: new Date("2025-01-10T10:00:00Z"),
        },
        {
          status: "confirmed",
          note: "Professional confirmed the booking",
          timestamp: new Date("2025-01-10T10:30:00Z"),
        },
      ],
    },
  ]

  for (const bookingData of sampleBookings) {
    const booking = new Booking(bookingData)
    await booking.save()
  }

  console.log("✅ Sample bookings seeded successfully")
}

const seedDatabase = async () => {
  try {
    await connectDB()

    console.log("🌱 Starting database seeding...")

    const users = await seedUsers()
    const services = await seedServices()
    const professionals = await seedProfessionals(users, services)
    await seedBookings(users, professionals, services)

    console.log("✅ Database seeding completed successfully!")
    console.log("\n📋 Login Credentials:")
    console.log("👤 Admin: admin@hereforyou.in / Admin@123")
    console.log("👤 Customer: renjini@example.com / Customer@123")
    console.log("👤 Professional: suresh@example.com / Professional@123")

    process.exit(0)
  } catch (error) {
    console.error("❌ Seeding failed:", error)
    process.exit(1)
  }
}

seedDatabase()
