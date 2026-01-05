import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Pill, User, LogOut } from 'lucide-react'; // Added User & LogOut icons
import { supabase } from '../supabaseClient';

export default function Navbar() {
  const [session, setSession] = useState(null);
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) updateUsername(session);
    });

    // 2. Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) updateUsername(session);
      else setUsername('');
    });

    return () => subscription.unsubscribe();
  }, []);

  // Helper to extract username from metadata or fallback to email
  const updateUsername = (session) => {
    const userMeta = session.user.user_metadata;
    if (userMeta && userMeta.username) {
      setUsername(userMeta.username);
    } else {
      // Fallback: strip the "@supplesafe.local" part if metadata fails
      const emailName = session.user.email.split('@')[0];
      setUsername(emailName);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-400" />
          <span className="font-bold text-xl tracking-tight text-white">
            Supple<span className="text-emerald-400">Safe</span>
          </span>
        </Link>
        
        {/* Center Menu */}
        <div className="flex items-center gap-6 text-sm font-medium text-slate-400">
          <Link to="/" className="hover:text-emerald-400 transition">Check Interactions</Link>
          <Link to="/medications" className="hover:text-emerald-400 transition flex items-center gap-1">
             <Pill className="w-4 h-4" /> My Medications
          </Link>
          <Link to="/history" className="hover:text-emerald-400 transition">History</Link>
        </div>

        {/* Right Side: Auth Status */}
        <div>
          {session ? (
            <div className="flex items-center gap-4">
              {/* Display Username */}
              <div className="flex items-center gap-2 text-slate-200 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                <User className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium">{username}</span>
              </div>

              {/* Sign Out Button */}
              <button 
                onClick={handleLogout} 
                className="text-slate-500 hover:text-red-400 transition"
                title="Sign Out"
              >
               <LogOut className="w-5 h-5" />
             </button>
            </div>
          ) : (
            <Link 
              to="/login"
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium border border-slate-700 transition"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}