import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Shield, Menu, X, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const [session, setSession] = useState(null);
  const [isOpen, setIsOpen] = useState(false); // State for mobile menu
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsOpen(false); 
  };

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Logic: Get only the part before "@"
  const username = session?.user?.email?.split('@')[0];

  return (
    <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <Shield className="w-8 h-8 text-emerald-500 group-hover:text-emerald-400 transition" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              SuppleSafe
            </span>
          </Link>

          {/* DESKTOP Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-slate-300 hover:text-white transition">Home</Link>
            
            {session && (
              <>
                <Link to="/history" className="text-sm font-medium text-slate-300 hover:text-white transition">History</Link>
                <Link to="/medications" className="text-sm font-medium text-slate-300 hover:text-white transition">Medications</Link>
              </>
            )}

            <div className="pl-6 ml-6 border-l border-slate-700 flex items-center gap-4">
              {session ? (
                <>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Welcome,</p>
                    <p className="text-sm font-bold text-emerald-400 capitalize">{username}</p>
                  </div>
                  <button 
                    onClick={handleLogout} 
                    title="Sign Out"
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                  >
                    <LogOut size={20} />
                  </button>
                </>
              ) : (
                <Link 
                  to="/login" 
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-900 bg-emerald-500 hover:bg-emerald-400 rounded-lg transition"
                >
                  <User size={16} /> Sign In
                </Link>
              )}
            </div>
          </div>

          {/* MOBILE Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="text-slate-300 hover:text-white focus:outline-none p-2"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DROP-DOWN MENU */}
      {isOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 animate-fade-in-down">
          <div className="px-4 pt-2 pb-6 space-y-2 flex flex-col">
            <Link to="/" className="block px-3 py-3 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800">Home</Link>
            
            {session && (
              <>
                <Link to="/history" className="block px-3 py-3 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800">History</Link>
                <Link to="/medications" className="block px-3 py-3 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800">Medications</Link>
              </>
            )}

            <div className="pt-4 border-t border-slate-800 mt-2">
              {session ? (
                <div className="px-3">
                  <div className="flex items-center justify-between mb-4">
                     <div>
                        <p className="text-xs text-slate-500">Signed in as</p>
                        <p className="text-sm font-bold text-emerald-400 capitalize truncate max-w-[200px]">{username}</p>
                     </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-base font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
                  >
                    <LogOut size={18} /> Sign Out
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-base font-bold text-slate-900 bg-emerald-500 hover:bg-emerald-400 rounded-lg transition"
                >
                  <User size={18} /> Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}