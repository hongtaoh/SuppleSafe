import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, Loader } from 'lucide-react';

// The defaults we want every new user to start with
const DEFAULT_MEDS_SEED = [
  { name: "Warfarin", dose: "5mg • Daily" },
  { name: "Lisinopril", dose: "10mg • Daily" },
  { name: "Metformin", dose: "500mg • Twice daily" },
  { name: "Atorvastatin", dose: "20mg • Daily" }
];

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); 
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    const fakeEmail = `${username}@supplesafe.local`;

    try {
      if (isRegistering) {
        // --- REGISTER ---
        const { data, error } = await supabase.auth.signUp({
          email: fakeEmail,
          password: password,
          options: { data: { username: username } }
        });
        if (error) throw error;

        // *** NEW: SEED DEFAULT MEDICATIONS ***
        if (data.user) {
          const userId = data.user.id;
          const medsToInsert = DEFAULT_MEDS_SEED.map(med => ({
            user_id: userId,
            name: med.name,
            dose: med.dose
          }));
          
          await supabase.from('medications').insert(medsToInsert);
        }

        alert("Registration successful! Default medications added.");
        navigate('/'); 
      } else {
        // --- LOGIN ---
        const { error } = await supabase.auth.signInWithPassword({
          email: fakeEmail,
          password: password,
        });
        if (error) throw error;
        navigate('/'); 
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-2">
          {isRegistering ? "Create an Account" : "Welcome Back"}
        </h2>
        <p className="text-slate-400 text-center mb-8 text-sm">
          {isRegistering ? "Sign up to get a default medication list" : "Sign in to access your profile"}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input 
                type="text" 
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition"
                placeholder="Enter a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input 
                type="password" 
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 rounded-xl transition flex justify-center items-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? <Loader className="animate-spin w-5 h-5" /> : (isRegistering ? "Create Account" : "Sign In")}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-700 text-center">
          <p className="text-slate-400 text-sm">
            {isRegistering ? "Already have an account?" : "Don't have an account?"}
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="ml-2 text-emerald-400 hover:text-emerald-300 font-medium hover:underline"
            >
              {isRegistering ? "Sign In" : "Register"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}