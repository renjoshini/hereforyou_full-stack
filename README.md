# HereForYou - Trusted Help at Your Doorstep

A full-stack local home services platform for Kerala, India - similar to UrbanClap or HouseJoy.

## Features

- 🏠 **Local Home Services**: Plumbing, cleaning, cooking, nursing, electrical services
- 👥 **User Management**: Customer and professional registration/login
- 📱 **Service Booking**: Real-time booking and tracking system
- 🔍 **Service Discovery**: Search and filter services by category and location
- ⭐ **Rating System**: Rate and review service professionals
- 📞 **Support System**: Customer support and complaint management
- 🌍 **Kerala Focus**: Designed specifically for Kerala users

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** enabled for cross-origin requests

### Frontend
- Your existing HTML, CSS, and JavaScript files
- Responsive design for mobile and desktop

## Quick Start

### 1. Installation

\`\`\`bash
# Clone or download the project
cd web-hereforyou-fullstack

# Install dependencies
npm install
\`\`\`

### 2. Environment Setup

\`\`\`bash
# Copy environment variables
cp .env.example .env

# Edit .env file with your configuration
\`\`\`

### 3. Add Your Frontend Files

Place all your existing frontend files from GitHub in the `public/` folder:

\`\`\`
public/
├── index.html          # Your main HTML file
├── css/               # Your CSS files
├── js/                # Your JavaScript files
├── images/            # Your images
└── ... (all other frontend files)
\`\`\`

### 4. Start the Server

\`\`\`bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
\`\`\`

Your app will be running at: http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Services
- `GET /api/services` - Get all services (with filters)
- `GET /api/services/:id` - Get service by ID
- `GET /api/services/categories/list` - Get service categories

### Professionals
- `GET /api/professionals` - Get all professionals (with filters)
- `GET /api/professionals/:id` - Get professional by ID
- `POST /api/professionals/register` - Register new professional

### Bookings
- `GET /api/bookings` - Get bookings (with filters)
- `GET /api/bookings/:id` - Get booking by ID
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id/status` - Update booking status

### Users
- `GET /api/users/profile/:id` - Get user profile
- `PUT /api/users/profile/:id` - Update user profile
- `POST /api/users/support` - Submit support request

## Database Models

The app includes MongoDB models for:
- **User**: Customer and professional user accounts
- **Service**: Available services (plumbing, cleaning, etc.)
- **Professional**: Service provider profiles
- **Booking**: Service booking records

## Frontend Integration

To connect your existing frontend with the backend APIs, update your JavaScript files to use fetch calls:

\`\`\`javascript
// Example: Fetch services
fetch('/api/services')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Handle services data
      console.log(data.data);
    }
  });

// Example: Create booking
fetch('/api/bookings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: 1,
    professionalId: 1,
    serviceId: 1,
    customerName: 'John Doe',
    customerPhone: '+91 9876543210',
    address: '123 Main Street, Kochi',
    scheduledDate: '2024-01-20',
    scheduledTime: '10:00 AM',
    totalAmount: 500
  })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('Booking created:', data.data);
  }
});
\`\`\`

## Deployment

### Local Development
\`\`\`bash
npm run dev
\`\`\`

### Production
\`\`\`bash
npm start
\`\`\`

## Support

For issues or questions, please check the API endpoints and ensure your frontend files are properly placed in the `public/` folder.

## License

MIT License
