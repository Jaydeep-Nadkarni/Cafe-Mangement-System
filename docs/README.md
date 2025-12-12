# Cafe Management System - Documentation

## Project Overview
A modern cafe management system built with React + Vite and Express.js backend, featuring AI-powered assistant integration.

## Architecture

### Client (`/client`)
- **Framework**: React 18.2 with Vite
- **Styling**: Tailwind CSS v4 with custom theme
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Development Port**: 3000

### Server (`/server`)
- **Runtime**: Node.js
- **Framework**: Express.js
- **API Integration**: OpenAI API
- **Port**: 5000

### Docs (`/docs`)
- Project documentation and guides

## Project Structure
```
cafe-management-system/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── App.jsx         # Root component
│   │   ├── main.jsx        # Entry point
│   │   └── index.css       # Tailwind styles
│   ├── index.html          # HTML template
│   ├── vite.config.js      # Vite configuration
│   └── package.json        # Dependencies
├── server/                 # Express.js backend
│   ├── routes/             # API routes
│   ├── config/             # Configuration files
│   ├── server.js           # Entry point
│   └── package.json        # Dependencies
└── docs/                   # Documentation
```

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

1. **Install client dependencies**:
```bash
cd client
npm install
```

2. **Install server dependencies**:
```bash
cd server
npm install
```

3. **Configure environment variables**:
   - Client: Create `.env` in `client/` (optional, has defaults)
   - Server: Create `.env` in `server/` based on `.env.example` with Razorpay keys

### Running the Application

**Development** (open 2 terminals):

Terminal 1 - Start client (Vite dev server on port 3000):
```bash
cd client
npm run dev
```

Terminal 2 - Start server (Express on port 5000):
```bash
cd server
npm run dev
```

**Production Build**:
```bash
# Client
cd client
npm run build

# Server (deploy based on your hosting platform)
cd server
npm start
```

The application will be available at `http://localhost:3000`

## Features
- Menu management and display
- Shopping cart with real-time quantity updates
- Order and payment processing with Razorpay
- Payment success confirmation page
- Mobile-responsive design
- Smooth page transitions
- Coming soon games section

## API Endpoints

### Menu
- `GET /api/menu` - Get all menu items
- `GET /api/menu/:id` - Get single menu item

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:orderId` - Get order details

### Razorpay Payment
- `POST /api/razorpay/create-order` - Create Razorpay order
- `POST /api/razorpay/verify-payment` - Verify payment signature

See `server/API_TESTING.md` for detailed endpoint documentation and testing examples.

## Customization

### Theme Colors
Edit `client/src/index.css` to modify the primary color:
```css
--color-primary: #FDD835;        /* Main yellow */
--color-primary-dark: #F9A825;   /* Darker yellow */
--color-primary-light: #FEE082;  /* Lighter yellow */
```

### Tailwind Configuration
The Tailwind v4 configuration uses the `@tailwindcss/vite` plugin. Customize in `client/src/index.css` using the `@theme` directive.

## API Endpoints
- `POST /api/ai/chat` - Send message to AI assistant
- Additional endpoints documented in server routes

## Development Notes
- Mobile-first design approach
- Responsive breakpoints: sm, md, lg, xl, 2xl
- Custom animations for UI feedback
- Accessibility best practices implemented

## License
Proprietary - Cafe Management System
