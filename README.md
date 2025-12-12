# Cafe Management System

A modern, full-stack cafe management solution with integrated payment processing and AI-powered features.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   # Client
   cd client && npm install
   
   # Server
   cd ../server && npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env` in both `client/` and `server/`
   - Add your API keys (Razorpay, OpenAI/Gemini)

3. **Start development servers:**
   ```bash
   # Terminal 1 - Server
   cd server && npm run dev
   
   # Terminal 2 - Client
   cd client && npm start
   ```

## 📁 Project Structure

```
Cafe Management System/
├── client/              # React frontend
│   ├── public/         # Static assets
│   ├── src/            # Source code
│   │   ├── services/  # API services
│   │   ├── App.js     # Main component
│   │   └── index.js   # Entry point
│   ├── .env.example   # Environment template
│   └── package.json
│
├── server/             # Express backend
│   ├── config/        # Configuration
│   ├── routes/        # API routes
│   ├── .env.example   # Environment template
│   ├── server.js      # Server entry
│   └── package.json
│
└── docs/              # Documentation
    ├── README.md      # Overview
    ├── SETUP.md       # Setup guide
    ├── ENVIRONMENT.md # Env variables
    └── API.md         # API docs
```

## 📖 Documentation

- **[Setup Guide](./docs/SETUP.md)** - Detailed installation instructions
- **[Environment Variables](./docs/ENVIRONMENT.md)** - Configuration reference
- **[API Documentation](./docs/API.md)** - API endpoints reference

## 🛠️ Tech Stack

**Frontend:**
- React 18
- React Router v6
- Axios
- CSS3

**Backend:**
- Node.js & Express
- MongoDB
- Razorpay SDK
- OpenAI API

## ✨ Features

- 🍽️ Menu Management
- 📦 Order Processing  
- 💳 Payment Integration (Razorpay)
- 🤖 AI Recommendations (OpenAI/Gemini)
- 📊 Analytics Dashboard (Coming Soon)
- 👥 User Management (Coming Soon)

## 📝 License

ISC

---

**For detailed setup instructions, see [docs/SETUP.md](./docs/SETUP.md)**
