# Setup Guide - Cafe Management System

This guide will help you set up the Cafe Management System on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16.0 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **MongoDB** - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Git** (optional, for version control)

## API Keys Required

You'll need to obtain the following API keys:

### 1. Razorpay (Payment Gateway)
1. Sign up at [Razorpay](https://razorpay.com/)
2. Navigate to Settings → API Keys
3. Generate Test/Live API keys
4. Note down your `Key ID` and `Key Secret`

### 2. OpenAI (AI Features)
1. Sign up at [OpenAI Platform](https://platform.openai.com/)
2. Navigate to API Keys section
3. Create a new API key
4. Note down your API key

**OR**

### 3. Google Gemini (Alternative AI)
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Note down your API key

## Installation Steps

### Step 1: Install Client Dependencies

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Or using yarn
yarn install
```

### Step 2: Configure Client Environment

```bash
# In the client directory
cp .env.example .env
```

Edit the `.env` file and add your configuration:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id_here
```

### Step 3: Install Server Dependencies

```bash
# Navigate to server directory (from root)
cd ../server

# Install dependencies
npm install

# Or using yarn
yarn install
```

### Step 4: Configure Server Environment

```bash
# In the server directory
cp .env.example .env
```

Edit the `.env` file with your configurations:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/cafe_management

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo

# JWT
JWT_SECRET=your_random_jwt_secret_here
JWT_EXPIRE=7d
```

### Step 5: Setup MongoDB

#### Option A: Local MongoDB
1. Install MongoDB Community Edition
2. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

#### Option B: MongoDB Atlas (Cloud)
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user
3. Whitelist your IP address (or use 0.0.0.0/0 for development)
4. Get your connection string
5. Replace `MONGODB_URI` in `.env` with your Atlas connection string

### Step 6: Start the Development Servers

#### Terminal 1 - Start Backend Server
```bash
# In the server directory
npm run dev

# Or using npm start
npm start
```

The server should start on `http://localhost:5000`

#### Terminal 2 - Start Frontend Client
```bash
# In the client directory
npm start
```

The client should start on `http://localhost:3000`

## Verify Installation

1. **Backend Health Check**: Visit `http://localhost:5000/health`
   - You should see: `{"status":"OK","message":"Server is running"}`

2. **Frontend**: Visit `http://localhost:3000`
   - You should see the Cafe Management System homepage

3. **API Endpoints**: Visit `http://localhost:5000/api`
   - You should see the API welcome message with available endpoints

## Common Issues & Troubleshooting

### Port Already in Use

If ports 3000 or 5000 are already in use:

**For Client (Port 3000):**
- Edit `package.json` scripts to use a different port
- Or set environment variable: `PORT=3001 npm start`

**For Server (Port 5000):**
- Change `PORT` in `.env` file
- Update `REACT_APP_API_URL` in client `.env` accordingly

### MongoDB Connection Issues

1. **Local MongoDB not starting:**
   - Check if MongoDB service is running
   - Verify MongoDB is installed correctly
   - Check MongoDB logs for errors

2. **Atlas Connection Issues:**
   - Verify your IP is whitelisted
   - Check username/password are correct
   - Ensure network access is configured

### Missing Dependencies

If you encounter module errors:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### CORS Issues

If you experience CORS errors:
1. Verify `CLIENT_URL` in server `.env` matches your frontend URL
2. Check that CORS middleware is properly configured in `server.js`

## Next Steps

After successful setup:

1. **Explore the API**: Check `docs/API.md` for available endpoints
2. **Create Sample Data**: Add menu items, test orders
3. **Test Payments**: Use Razorpay test credentials
4. **Try AI Features**: Test menu recommendations

## Development Tips

- Use `npm run dev` in server for auto-restart on changes (requires nodemon)
- React hot-reloading is enabled by default in development
- Check browser console and terminal for error messages
- Use Postman or similar tools to test API endpoints

## Production Deployment

For production deployment instructions, see `docs/DEPLOYMENT.md` (coming soon).

## Getting Help

- Check existing issues in the project repository
- Review error messages carefully
- Ensure all environment variables are correctly set
- Verify API keys are valid and have necessary permissions

## Project Structure Reference

```
client/
├── public/              # Static files
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── App.js          # Main app component
│   └── index.js        # Entry point
└── package.json

server/
├── config/             # Configuration files
├── routes/             # API routes
├── models/             # Database models
├── middleware/         # Custom middleware
├── server.js           # Server entry point
└── package.json
```

---

**Happy Coding! 🚀**
