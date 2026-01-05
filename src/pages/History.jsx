import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Trash2, Calendar, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchHistory(session.user.id);
      else setLoading(false);
    });
  }, []);

  const fetchHistory = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this history record?")) return;
    
    const { error } = await supabase.from('history').delete().eq('id', id);
    if (!error) {
      setHistory(history.filter(item => item.id !== id));
    }
  };

  if (!session) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-4">Please Sign In</h2>
        <p className="text-slate-400">You need to be logged in to view your history.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">Interaction History</h1>

      {loading ? (
        <div className="text-slate-400">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="bg-slate-800/50 rounded-xl p-8 text-center border border-slate-700">
          <p className="text-slate-400 mb-4">No history found.</p>
          <Link to="/" className="text-emerald-400 hover:underline">Check your first supplement</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-emerald-500/30 transition">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-emerald-400">{item.supplement_name || "Unknown"}</h3>
                    <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-900 px-2 py-1 rounded">
                      <Calendar size={12} />
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm">{item.analysis_result}</p>
                </div>
                
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition"
                  title="Delete Record"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}