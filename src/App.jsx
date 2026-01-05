import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import DisclaimerBanner from './components/DisclaimerBanner';
import Home from './pages/Home';
import History from './pages/History';
import Auth from './pages/Auth'; // Import the new Auth page
import Medications from './pages/Medications'; // Import Medications page

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-900 text-slate-200 font-sans selection:bg-emerald-500/30">
        <Navbar />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<History />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/medications" element={<Medications />} />
          </Routes>
        </main>

        <DisclaimerBanner />
      </div>
    </Router>
  );
}

export default App;