import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import your components here
// import Home from './pages/Home';
// import Menu from './pages/Menu';
// import Orders from './pages/Orders';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Cafe Management System</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            {/* Add more routes here */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// Temporary Home component
function Home() {
  return (
    <div className="home">
      <h2>Welcome to Cafe Management System</h2>
      <p>Your modern solution for managing cafe operations</p>
    </div>
  );
}

export default App;
