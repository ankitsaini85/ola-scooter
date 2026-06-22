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