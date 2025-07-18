// Application State - Enhanced with backend integration
let currentUser = null
const currentBooking = null
const selectedService = null
const selectedProfessional = null

// API Configuration
const API_BASE_URL = "/api"
const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    logout: `${API_BASE_URL}/auth/logout`,
    me: `${API_BASE_URL}/auth/me`,
  },
  services: {
    list: `${API_BASE_URL}/services`,
    popular: `${API_BASE_URL}/services/popular`,
    categories: `${API_BASE_URL}/services/categories`,
    byId: (id) => `${API_BASE_URL}/services/${id}`,
  },
  professionals: {
    list: `${API_BASE_URL}/professionals`,
    byId: (id) => `${API_BASE_URL}/professionals/${id}`,
    byService: (serviceId) => `${API_BASE_URL}/professionals/service/${serviceId}`,
  },
  bookings: {
    list: `${API_BASE_URL}/bookings`,
    create: `${API_BASE_URL}/bookings`,
    byId: (id) => `${API_BASE_URL}/bookings/${id}`,
    updateStatus: (id) => `${API_BASE_URL}/bookings/${id}/status`,
    feedback: (id) => `${API_BASE_URL}/bookings/${id}/feedback`,
  },
  users: {
    profile: `${API_BASE_URL}/users/profile`,
    dashboard: `${API_BASE_URL}/users/dashboard`,
    support: `${API_BASE_URL}/users/support`,
  },
}

// API Helper Functions
async function apiCall(url, options = {}) {
  try {
    const token = localStorage.getItem("authToken")

    const defaultOptions = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    }

    const response = await fetch(url, { ...defaultOptions, ...options })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "API request failed")
    }

    return data
  } catch (error) {
    console.error("API Error:", error)
    throw error
  }
}

// Authentication Functions
function isLoggedIn() {
  return localStorage.getItem("authToken") !== null
}

function getCurrentUser() {
  const user = localStorage.getItem("currentUser")
  return user ? JSON.parse(user) : null
}

function setCurrentUser(user, token) {
  localStorage.setItem("currentUser", JSON.stringify(user))
  localStorage.setItem("authToken", token)
  currentUser = user
}

function logout() {
  localStorage.removeItem("currentUser")
  localStorage.removeItem("authToken")
  currentUser = null
  showNotification("Logged out successfully")
  setTimeout(() => {
    window.location.href = "index.html"
  }, 1000)
}

// Enhanced Service Functions with API Integration
async function renderServices() {
  const servicesGrid = document.getElementById("servicesGrid")
  if (!servicesGrid) return

  try {
    showLoading(servicesGrid)
    const response = await apiCall(API_ENDPOINTS.services.popular)

    if (response.success && response.data) {
      servicesGrid.innerHTML = response.data
        .map(
          (service) => `
        <div class="service-card" onclick="selectService('${service._id}')">
          <i class="${service.icon}"></i>
          <h3>${service.name}</h3>
          <p>${service.description}</p>
          <div class="service-meta">
            <span class="price">From ₹${service.pricing.basePrice}/${service.pricing.priceUnit}</span>
            ${service.rating.count > 0 ? `<span class="rating">★ ${service.rating.average.toFixed(1)}</span>` : ""}
          </div>
        </div>
      `,
        )
        .join("")
    } else {
      servicesGrid.innerHTML = "<p>No services available at the moment.</p>"
    }
  } catch (error) {
    console.error("Error loading services:", error)
    servicesGrid.innerHTML = "<p>Failed to load services. Please try again later.</p>"
    showNotification("Failed to load services", "error")
  }
}

async function renderProfessionals(serviceId) {
  const professionalsList = document.getElementById("professionalsList")
  const resultCount = document.getElementById("resultCount")

  if (!professionalsList) return

  try {
    showLoading(professionalsList)

    const response = await apiCall(API_ENDPOINTS.professionals.byService(serviceId))

    if (response.success && response.data && response.data.length > 0) {
      if (resultCount) {
        resultCount.textContent = `Found ${response.data.length} professionals`
      }

      professionalsList.innerHTML = response.data
        .map(
          (prof) => `
        <div class="professional-card">
          <div class="professional-header">
            <div class="professional-avatar">
              ${getInitials(prof.name)}
            </div>
            <div class="professional-info">
              <h3>${prof.name}</h3>
              <p>${prof.location}</p>
              ${prof.verified ? '<span class="verified-badge"><i class="fas fa-check-circle"></i> KYC Verified</span>' : ""}
            </div>
          </div>
          <div class="professional-details">
            <div class="rating">
              <div class="stars">
                ${"★".repeat(Math.floor(prof.rating))}${"☆".repeat(5 - Math.floor(prof.rating))}
              </div>
              <span>${prof.rating} (${prof.reviews} reviews)</span>
            </div>
            <p><strong>Experience:</strong> ${prof.experience}</p>
            <p><strong>Rate:</strong> ₹${prof.hourlyRate}/hour</p>
            <p><strong>Specialties:</strong> ${prof.specialties.join(", ")}</p>
            <div class="availability ${prof.availability ? "available" : "busy"}">
              <i class="fas fa-circle"></i>
              <span>${prof.availability ? "Available" : "Busy"}</span>
            </div>
          </div>
          <div class="professional-actions">
            <button class="btn-outline" onclick="viewProfile('${prof.id}', '${serviceId}')">
              <i class="fas fa-user"></i> View Profile
            </button>
            <button class="btn-primary" onclick="bookNow('${prof.id}', '${serviceId}')">
              <i class="fas fa-calendar"></i> Book Now
            </button>
          </div>
        </div>
      `,
        )
        .join("")
    } else {
      if (resultCount) {
        resultCount.textContent = "Found 0 professionals"
      }
      professionalsList.innerHTML = `
        <div class="no-results">
          <div class="text-center p-3">
            <i class="fas fa-search" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
            <h3>No professionals found</h3>
            <p>Try adjusting your filters or search in a different location</p>
            <button class="btn-primary" onclick="window.location.href='become-helper.html'">
              Become a Helper
            </button>
          </div>
        </div>
      `
    }
  } catch (error) {
    console.error("Error loading professionals:", error)
    professionalsList.innerHTML = "<p>Failed to load professionals. Please try again later.</p>"
    showNotification("Failed to load professionals", "error")
  }
}

// Enhanced Authentication Functions
async function handleLogin(email, password) {
  try {
    const response = await apiCall(API_ENDPOINTS.auth.login, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })

    if (response.success) {
      setCurrentUser(response.data.user, response.data.token)
      showNotification("Login successful!")

      // Redirect based on user type
      setTimeout(() => {
        if (response.data.user.userType === "admin") {
          window.location.href = "admin-dashboard.html"
        } else {
          window.location.href = "dashboard.html"
        }
      }, 1000)
    }
  } catch (error) {
    showNotification(error.message || "Login failed", "error")
    throw error
  }
}

async function handleRegistration(userData) {
  try {
    const response = await apiCall(API_ENDPOINTS.auth.register, {
      method: "POST",
      body: JSON.stringify(userData),
    })

    if (response.success) {
      setCurrentUser(response.data.user, response.data.token)
      showNotification("Registration successful!")

      setTimeout(() => {
        window.location.href = "dashboard.html"
      }, 1000)
    }
  } catch (error) {
    showNotification(error.message || "Registration failed", "error")
    throw error
  }
}

// Enhanced Booking Functions
async function createBooking(bookingData) {
  try {
    if (!isLoggedIn()) {
      showNotification("Please login to create a booking", "error")
      window.location.href = "login.html"
      return
    }

    const response = await apiCall(API_ENDPOINTS.bookings.create, {
      method: "POST",
      body: JSON.stringify(bookingData),
    })

    if (response.success) {
      showNotification("Booking created successfully!")
      setTimeout(() => {
        window.location.href = `booking-confirmation.html?id=${response.data.bookingId}`
      }, 1500)
    }
  } catch (error) {
    showNotification(error.message || "Failed to create booking", "error")
    throw error
  }
}

async function loadUserBookings() {
  try {
    if (!isLoggedIn()) return []

    const response = await apiCall(API_ENDPOINTS.bookings.list)
    return response.success ? response.data : []
  } catch (error) {
    console.error("Error loading bookings:", error)
    showNotification("Failed to load bookings", "error")
    return []
  }
}

// Enhanced Dashboard Functions
async function loadDashboardData() {
  try {
    if (!isLoggedIn()) {
      window.location.href = "login.html"
      return
    }

    const response = await apiCall(API_ENDPOINTS.users.dashboard)

    if (response.success) {
      const { user, recentBookings, stats } = response.data

      // Update welcome message
      const welcomeElement = document.getElementById("userWelcome")
      if (welcomeElement) {
        welcomeElement.textContent = `Welcome back, ${user.name}!`
      }

      // Render recent bookings
      renderRecentBookings(recentBookings)

      // Update stats if elements exist
      updateDashboardStats(stats)
    }
  } catch (error) {
    console.error("Error loading dashboard:", error)
    showNotification("Failed to load dashboard data", "error")
  }
}

function renderRecentBookings(bookings) {
  const container = document.getElementById("recentBookings")
  if (!container) return

  if (bookings.length === 0) {
    container.innerHTML = "<p>No bookings yet. Book your first service!</p>"
    return
  }

  container.innerHTML = bookings
    .map(
      (booking) => `
    <div class="booking-card">
      <h4>Booking #${booking.bookingId}</h4>
      <p><strong>Service:</strong> ${booking.service.name}</p>
      <p><strong>Date:</strong> ${new Date(booking.schedule.date).toLocaleDateString()}</p>
      <p><strong>Status:</strong> <span class="status ${booking.status}">${booking.status}</span></p>
      <p><strong>Amount:</strong> ₹${booking.pricing.totalAmount}</p>
    </div>
  `,
    )
    .join("")
}

function updateDashboardStats(stats) {
  const statsContainer = document.getElementById("dashboardStats")
  if (!statsContainer) return

  statsContainer.innerHTML = `
    <div class="stat">
      <h4>Total Bookings</h4>
      <p>${stats.totalBookings}</p>
    </div>
    <div class="stat">
      <h4>Upcoming Bookings</h4>
      <p>${stats.upcomingBookings}</p>
    </div>
    <div class="stat">
      <h4>Completed Bookings</h4>
      <p>${stats.completedBookings}</p>
    </div>
  `
}

// Enhanced Search Functions
async function searchServices() {
  const serviceQuery = document.getElementById("serviceSearch")?.value
  const locationQuery = document.getElementById("locationSearch")?.value || "Trivandrum"

  if (serviceQuery && serviceQuery.trim()) {
    try {
      const response = await apiCall(
        `${API_BASE_URL}/services?search=${encodeURIComponent(serviceQuery)}&location=${encodeURIComponent(locationQuery)}`,
      )

      if (response.success && response.data.length > 0) {
        const service = response.data[0] // Take first matching service
        window.location.href = `service-list.html?service=${service._id}&location=${encodeURIComponent(locationQuery)}`
      } else {
        showNotification("No services found matching your search", "error")
      }
    } catch (error) {
      showNotification("Search failed. Please try again.", "error")
    }
  } else {
    showNotification("Please enter a service to search for", "error")
  }
}

// Navigation Functions
function selectService(serviceId) {
  const location = document.getElementById("locationSearch")?.value || "Trivandrum"
  window.location.href = `service-list.html?service=${serviceId}&location=${encodeURIComponent(location)}`
}

function viewProfile(professionalId, serviceId) {
  window.location.href = `professional-profile.html?id=${professionalId}&service=${serviceId}`
}

function bookNow(professionalId, serviceId) {
  if (!isLoggedIn()) {
    showNotification("Please login to book a service", "error")
    window.location.href = "login.html"
    return
  }
  window.location.href = `booking.html?professional=${professionalId}&service=${serviceId}`
}

// Enhanced Notification System
function showNotification(message, type = "success") {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll(".notification")
  existingNotifications.forEach((notification) => notification.remove())

  const notification = document.createElement("div")
  notification.className = `notification ${type}`
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "info-circle"}"></i>
      <span>${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `

  document.body.appendChild(notification)

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove()
    }
  }, 5000)
}

// Utility Functions
function showLoading(element) {
  element.innerHTML = '<div class="loading-spinner">Loading...</div>'
}

function getInitials(name) {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
}

// Page Initialization
async function initializePage() {
  const path = window.location.pathname
  const filename = path.split("/").pop() || "index.html"

  // Check authentication status
  if (isLoggedIn()) {
    try {
      const response = await apiCall(API_ENDPOINTS.auth.me)
      if (response.success) {
        currentUser = response.data.user
        updateNavigation()
      } else {
        // Token is invalid, logout
        logout()
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      logout()
    }
  }

  // Initialize page-specific functionality
  switch (filename) {
    case "index.html":
    case "":
      await renderServices()
      break
    case "service-list.html":
      await initializeServiceList()
      break
    case "professional-profile.html":
      await initializeProfessionalProfile()
      break
    case "dashboard.html":
      await loadDashboardData()
      break
    case "bookings.html":
      await initializeBookingsPage()
      break
    case "login.html":
      initializeLogin()
      break
    case "signup.html":
      initializeSignup()
      break
  }
}

// Page-specific initialization functions
async function initializeServiceList() {
  const urlParams = new URLSearchParams(window.location.search)
  const serviceId = urlParams.get("service")
  const location = urlParams.get("location")

  if (serviceId) {
    try {
      // Load service details
      const serviceResponse = await apiCall(API_ENDPOINTS.services.byId(serviceId))
      if (serviceResponse.success) {
        const service = serviceResponse.data
        document.getElementById("serviceTitle").textContent = service.name
        document.getElementById("locationDisplay").textContent = location || "Kerala"
      }

      // Load professionals
      await renderProfessionals(serviceId)
    } catch (error) {
      console.error("Error initializing service list:", error)
      showNotification("Failed to load service details", "error")
    }
  }
}

async function initializeProfessionalProfile() {
  const urlParams = new URLSearchParams(window.location.search)
  const professionalId = urlParams.get("id")

  if (professionalId) {
    try {
      const response = await apiCall(API_ENDPOINTS.professionals.byId(professionalId))
      if (response.success) {
        renderProfessionalProfile(response.data)
      }
    } catch (error) {
      console.error("Error loading professional profile:", error)
      showNotification("Failed to load professional profile", "error")
    }
  }
}

function renderProfessionalProfile(professional) {
  const profileContainer = document.getElementById("professionalProfile")
  if (!profileContainer) return

  profileContainer.innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar">
        ${getInitials(professional.name)}
      </div>
      <div class="profile-info">
        <h3>${professional.name}</h3>
        <p>${professional.location}</p>
        ${professional.verified ? '<span class="verified-badge"><i class="fas fa-check-circle"></i> KYC Verified</span>' : ""}
      </div>
    </div>
    <div class="profile-details">
      <div class="rating">
        <div class="stars">
          ${"★".repeat(Math.floor(professional.rating))}${"☆".repeat(5 - Math.floor(professional.rating))}
        </div>
        <span>${professional.rating} (${professional.reviews} reviews)</span>
      </div>
      <p><strong>Experience:</strong> ${professional.experience}</p>
      <p><strong>Rate:</strong> ₹${professional.hourlyRate}/hour</p>
      <p><strong>Specialties:</strong> ${professional.specialties.join(", ")}</p>
      <div class="availability ${professional.availability ? "available" : "busy"}">
        <i class="fas fa-circle"></i>
        <span>${professional.availability ? "Available" : "Busy"}</span>
      </div>
    </div>
  `
}

async function initializeBookingsPage() {
  try {
    const bookings = await loadUserBookings()
    renderBookingsList(bookings)
  } catch (error) {
    console.error("Error initializing bookings page:", error)
  }
}

function renderBookingsList(bookings) {
  const container = document.getElementById("bookingsList")
  if (!container) return

  if (bookings.length === 0) {
    container.innerHTML = "<p>No bookings yet. Book your first service!</p>"
    return
  }

  container.innerHTML = bookings
    .map(
      (booking) => `
    <div class="booking-card">
      <h4>Booking #${booking.bookingId}</h4>
      <p><strong>Service:</strong> ${booking.service.name}</p>
      <p><strong>Date:</strong> ${new Date(booking.schedule.date).toLocaleDateString()}</p>
      <p><strong>Status:</strong> <span class="status ${booking.status}">${booking.status}</span></p>
      <p><strong>Amount:</strong> ₹${booking.pricing.totalAmount}</p>
    </div>
  `,
    )
    .join("")
}

function initializeLogin() {
  const loginForm = document.getElementById("loginForm")
  if (!loginForm) return

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const email = document.getElementById("email").value.trim()
    const password = document.getElementById("password").value

    if (!email || !password) {
      showNotification("Please fill in all fields", "error")
      return
    }

    try {
      await handleLogin(email, password)
    } catch (error) {
      // Error already handled in handleLogin
    }
  })
}

function initializeSignup() {
  const signupForm = document.getElementById("signupForm")
  if (!signupForm) return

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const formData = new FormData(signupForm)
    const userData = {
      name: formData.get("name").trim(),
      email: formData.get("email").trim(),
      phone: formData.get("phone").trim(),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    }

    // Validation
    if (!userData.name || !userData.email || !userData.phone || !userData.password) {
      showNotification("Please fill in all required fields", "error")
      return
    }

    if (userData.password !== userData.confirmPassword) {
      showNotification("Passwords do not match", "error")
      return
    }

    if (userData.password.length < 8) {
      showNotification("Password must be at least 8 characters long", "error")
      return
    }

    try {
      // Remove confirmPassword before sending to API
      delete userData.confirmPassword
      await handleRegistration(userData)
    } catch (error) {
      // Error already handled in handleRegistration
    }
  })
}

function updateNavigation() {
  const navLinks = document.querySelector(".nav-links")
  if (!navLinks || !currentUser) return

  // Update navigation for logged-in users
  const loginButton = navLinks.querySelector('button[onclick*="login.html"]')
  const signupButton = navLinks.querySelector('button[onclick*="signup.html"]')

  if (loginButton) loginButton.style.display = "none"
  if (signupButton) signupButton.style.display = "none"

  // Add user menu if not exists
  if (!navLinks.querySelector(".user-menu")) {
    const userMenu = document.createElement("div")
    userMenu.className = "user-menu"
    userMenu.innerHTML = `
      <a href="dashboard.html" class="nav-link">Dashboard</a>
      <a href="bookings.html" class="nav-link">My Bookings</a>
      <a href="profile.html" class="nav-link">Profile</a>
      <button class="btn-secondary" onclick="logout()">Logout</button>
    `
    navLinks.appendChild(userMenu)
  }
}

// Mobile menu toggle
function toggleMobileMenu() {
  const navLinks = document.querySelector(".nav-links")
  if (navLinks) {
    navLinks.classList.toggle("mobile-active")
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initializePage)

// Handle search on Enter key
document.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const activeElement = document.activeElement
    if (activeElement && (activeElement.id === "serviceSearch" || activeElement.id === "locationSearch")) {
      searchServices()
    }
  }
})

// Add loading styles
const loadingStyles = `
  .loading-spinner {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
    font-size: 1.1rem;
    color: var(--text-secondary);
  }
  
  .loading-spinner::after {
    content: '';
    width: 20px;
    height: 20px;
    margin-left: 10px;
    border: 2px solid var(--border-color);
    border-top: 2px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .notification-close {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 0.25rem;
    margin-left: 1rem;
  }
  
  .user-menu {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  @media (max-width: 768px) {
    .user-menu {
      flex-direction: column;
      gap: 0.5rem;
    }
  }
`

// Add styles to document
const styleSheet = document.createElement("style")
styleSheet.textContent = loadingStyles
document.head.appendChild(styleSheet)
