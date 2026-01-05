import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Pill, Plus, Trash2, Loader, Save, RefreshCw } from 'lucide-react'; // Added RefreshCw icon
import { Link } from 'react-router-dom';

const DEFAULT_MEDS_SEED = [
  { name: "Warfarin", dose: "5mg • Daily" },
  { name: "Lisinopril", dose: "10mg • Daily" },
  { name: "Metformin", dose: "500mg • Twice daily" },
  { name: "Atorvastatin", dose: "20mg • Daily" }
];

export default function Medications() {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newDose, setNewDose] = useState('');
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchMeds();
      else setLoading(false);
    });
  }, []);

  const fetchMeds = async () => {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) console.error(error);
    else setMeds(data);
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName) return;

    const { data, error } = await supabase
      .from('medications')
      .insert([{ user_id: session.user.id, name: newName, dose: newDose }])
      .select();

    if (!error) {
      setMeds([...meds, data[0]]);
      setNewName('');
      setNewDose('');
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('medications').delete().eq('id', id);
    if (!error) {
      setMeds(meds.filter(m => m.id !== id));
    }
  };

  // NEW: Helper to manually load defaults if list is empty
  const handleRestoreDefaults = async () => {
    setLoading(true);
    const medsToInsert = DEFAULT_MEDS_SEED.map(med => ({
      user_id: session.user.id,
      name: med.name,
      dose: med.dose
    }));
    
    await supabase.from('medications').insert(medsToInsert);
    await fetchMeds(); // Refresh list
  };

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Please Sign In</h2>
        <Link to="/login" className="bg-emerald-500 text-slate-900 font-bold py-2 px-6 rounded-lg">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-emerald-500/10 p-3 rounded-xl">
          <Pill className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">My Medications</h1>
          <p className="text-slate-400">Manage the list of drugs checked during analysis.</p>
        </div>
      </div>

      {/* ADD FORM */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-8 shadow-lg">
        <h3 className="text-white font-medium mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-400" /> Add New Medication
        </h3>
        <form onSubmit={handleAdd} className="flex gap-4 flex-col sm:flex-row">
          <input
            type="text"
            placeholder="Drug Name (e.g. Lisinopril)"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Dose (Optional)"
            className="w-full sm:w-40 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
            value={newDose}
            onChange={e => setNewDose(e.target.value)}
          />
          <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold px-6 py-2 rounded-lg transition flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Save
          </button>
        </form>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8"><Loader className="animate-spin w-8 h-8 mx-auto text-emerald-500" /></div>
        ) : meds.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-700 rounded-2xl bg-slate-800/30">
            <p className="text-slate-400 mb-4">You haven't added any medications yet.</p>
            <button 
              onClick={handleRestoreDefaults}
              className="flex items-center gap-2 mx-auto bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 px-5 py-2 rounded-lg transition"
            >
              <RefreshCw className="w-4 h-4" /> Load Default List (Demo)
            </button>
          </div>
        ) : (
          meds.map((med) => (
            <div key={med.id} className="flex items-center justify-between bg-slate-800/50 border border-slate-700 p-4 rounded-xl group hover:border-emerald-500/30 transition">
              <div>
                <div className="font-bold text-lg text-white">{med.name}</div>
                {med.dose && <div className="text-sm text-slate-400 font-mono">{med.dose}</div>}
              </div>
              <button 
                onClick={() => handleDelete(med.id)}
                className="p-2 text-slate-600 hover:text-red-400 hover:bg-slate-900/50 rounded-lg transition"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}