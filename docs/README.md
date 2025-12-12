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
   - Create `.env` file in `server/` with `OPENAI_API_KEY`

### Running the Application

**Development**:
```bash
# Terminal 1 - Start client (Vite dev server on port 3000)
cd client
npm run dev

# Terminal 2 - Start server (Express on port 5000)
cd server
npm start
```

**Production Build**:
```bash
# Client
cd client
npm run build

# Server deployment depends on your hosting platform
```

## Features
- Menu management and display
- AI-powered product assistant
- Order and payment processing
- Mobile-responsive design
- Modern UI with Tailwind CSS

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
