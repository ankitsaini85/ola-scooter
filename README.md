🛵 OLA-EV Scooter MERN Application

A modern mobile-first MERN Stack application designed for OLA-EV Scooter users with secure authentication, investment plans, admin management, and responsive user experience.

🚀 Features
🔐 User Authentication
User Registration with:
Phone Number
Password
Confirm Password
Withdrawal Password
Secure JWT Authentication
Login & Logout Functionality
Protected User Routes

🎉 Welcome Popup
Company instructions displayed after successful login.
Customizable content through environment variables.
📱 Mobile-First Responsive UI
Attractive homepage design
Responsive image carousel/banner slider
Modern action buttons
Investment/earning plan cards
Bottom navigation for mobile devices

💰 Scooter Investment Plans
View available OLA-EV scooter plans
Plan details including:
Investment Amount
Daily Income
Total Return
Validity Period

👨‍💼 Admin Dashboard
Secure Admin Login
Add New Plans
Edit Existing Plans
Delete Plans
Manage Application Content
⚙️ Environment-Based Configuration

All important settings are configurable through .env files:

MongoDB Database URL
JWT Secret Key
Company Name
Telegram/WhatsApp Channel Link
Customer Service Link
Banner Image URLs
Admin Credentials

🛠️ Technology Stack
Frontend
React.js
Vite
React Router DOM
Axios
CSS / Tailwind CSS (Optional)
Backend
Node.js
Express.js
MongoDB
Mongoose
JWT Authentication
bcryptjs

📂 Project Structure
ola-ev-scooter/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── .env
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   └── App.jsx
│   ├── .env
│   └── vite.config.js
│
└── README.md

⚡ Installation
1. Clone Repository
git clone https://github.com/yourusername/ola-ev-scooter.git

cd ola-ev-scooter
2. Install Dependencies
npm install
npm run install:all

3. Configure Environment Variables
Backend Environment

Create:

backend/.env

Example:

PORT=5000

MONGO_URI=YOUR_MONGODB_CONNECTION_STRING

JWT_SECRET=YOUR_SECRET_KEY

COMPANY_NAME=OLA-EV Scooter

CHANNEL_LINK=https://your-channel-link.com

SERVICE_LINK=https://your-service-link.com

BANNER_IMAGE_1=https://your-image-url.com

BANNER_IMAGE_2=https://your-image-url.com

ADMIN_PHONE=9999999999

ADMIN_PASSWORD=admin123

Frontend Environment

Create:

frontend/.env

Example:

VITE_API_URL=http://localhost:5000/api


▶️ Run Project

Development Mode
npm run dev
Backend
cd backend
npm run dev
Frontend
cd frontend
npm run dev

🔑 Admin Access

Admin credentials are managed through environment variables.

Example:

ADMIN_PHONE=9999999999
ADMIN_PASSWORD=admin123

After login, admin can:

Create Plans
Update Plans
Delete Plans
Manage Homepage Data

📊 Default Seed Data

The application automatically provides sample scooter plans on first startup to ensure the homepage has content.

Example:

OLA S1 Basic
OLA S1 Pro

Admins can modify or remove these plans anytime.

🔒 Security Features
JWT Authentication
Password Hashing (bcryptjs)
Protected Routes
Secure API Validation
Environment-Based Secrets

🌐 Future Enhancements
Recharge System
Wallet Management
Withdrawal Requests
Referral Program
Team Income System
Daily Earnings Tracking
Notification System
Payment Gateway Integration
Multi-Language Support

