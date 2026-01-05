import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Upload, FileText, Zap, X, Loader, Pill, Activity, AlertTriangle, ExternalLink, PlayCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

const DEMO_DRUGS = [
  { name: "Warfarin", dose: "5mg • Daily" },
  { name: "Lisinopril", dose: "10mg • Daily" },
  { name: "Metformin", dose: "500mg • Twice daily" },
  { name: "Atorvastatin", dose: "20mg • Daily" }
];

// NOTE: We removed the static MOCK_INTERACTIONS constant. 
// We now generate it dynamically in handleAnalyze.

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function Home() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  const [interactions, setInteractions] = useState(null);
  
  const [userDrugs, setUserDrugs] = useState([]); 
  const [session, setSession] = useState(null);
  const [loadingMeds, setLoadingMeds] = useState(true);

  // 1. Check Session & Load Meds
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserMeds(session.user.id);
      } else {
        setUserDrugs(DEMO_DRUGS); 
        setLoadingMeds(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserMeds(session.user.id);
      else setUserDrugs(DEMO_DRUGS);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserMeds = async (userId) => {
    setLoadingMeds(true);
    const { data, error } = await supabase.from('medications').select('*').eq('user_id', userId);
    
    if (error) {
      console.error("Error fetching meds:", error);
    } else {
      setUserDrugs(data || []);
    }
    setLoadingMeds(false);
  };

  const handleInitializeAccount = async () => {
    if (!session) return;
    const confirm = window.confirm("This will add 4 default medications to your list. Continue?");
    if (!confirm) return;

    setLoadingMeds(true);
    const medsToInsert = DEMO_DRUGS.map(med => ({
      user_id: session.user.id,
      name: med.name,
      dose: med.dose
    }));

    const { error } = await supabase.from('medications').insert(medsToInsert);

    if (error) {
      alert("Error adding medications: " + error.message);
    } else {
      alert("Success! Default medications added.");
      fetchUserMeds(session.user.id); 
    }
    setLoadingMeds(false);
  };

  const fileToGenerativePart = async (file) => {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
    return { inlineData: { data: await base64EncodedDataPromise, mimeType: file.type } };
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setIngredients([]);
      setInteractions(null);
    }
  };

  // --- UPDATED ANALYSIS LOGIC ---
  const handleAnalyze = async () => {
    if (!API_KEY) return alert("Missing API Key");
    if (!file) return alert("Please upload an image.");

    setIsAnalyzing(true);
    setInteractions(null);

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const drugList = userDrugs.map(d => d.name).join(", ");
      const imagePart = await fileToGenerativePart(file);
      
      const prompt = `
        Analyze this supplement label image.
        1. Extract the active ingredients.
        2. Return ONLY a JSON array of strings for the ingredients (e.g., ["Vitamin C", "Zinc"]).
        3. Do not include markdown formatting.
      `;

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedIngredients = JSON.parse(cleanJson);
      
      setIngredients(parsedIngredients);

      // --- NEW: DYNAMIC MOCK GENERATOR ---
      // We pick 2 random drugs from the user's ACTUAL list to make the demo look real.
      
      const shuffledDrugs = [...userDrugs].sort(() => 0.5 - Math.random());
      const selectedDrugs = shuffledDrugs.slice(0, 2); // Take top 2
      const detectedSupplement = parsedIngredients[0] || "Supplement";

      const dynamicInteractions = {
        Major: [],
        Moderate: [],
        Minor: [],
        Minimum: []
      };

      // 1. Create a "Major" interaction if we have at least 1 drug
      if (selectedDrugs.length > 0) {
        dynamicInteractions.Major.push({
          supplement: detectedSupplement,
          drug: selectedDrugs[0].name,
          details: `Potential pharmacokinetic interaction detected. ${detectedSupplement} may alter the absorption or metabolism of ${selectedDrugs[0].name}, leading to reduced efficacy. Consult your provider.`
        });
      }

      // 2. Create a "Moderate" interaction if we have a 2nd drug
      if (selectedDrugs.length > 1) {
        dynamicInteractions.Moderate.push({
          supplement: detectedSupplement,
          drug: selectedDrugs[1].name,
          details: `Moderate interaction risk. Concurrent use of ${detectedSupplement} and ${selectedDrugs[1].name} may increase the risk of adverse side effects.`
        });
      }

      // If user has NO drugs, we return an empty (safe) report
      if (selectedDrugs.length === 0) {
         // No interactions generated
      } else {
         setInteractions(dynamicInteractions);
      }

      // Save to History
      if (session) {
        await supabase.from('history').insert([{
          user_id: session.user.id,
          supplement_name: detectedSupplement,
          analysis_result: `Detected ${parsedIngredients.length} ingredients. Checked against: ${drugList}`
        }]);
      }

    } catch (error) {
      console.error(error);
      alert("Analysis failed. See console.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Check Your Supplement <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Interactions</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Upload a photo of your supplement label and we'll analyze potential interactions with your current medications.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Medications List */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-amber-400" />
                  <h2 className="font-semibold text-white">Your Medications</h2>
                </div>
                {session && (
                  <Link to="/medications" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                    Edit <ExternalLink size={12}/>
                  </Link>
                )}
              </div>
              
              <div className="space-y-4">
                {loadingMeds ? (
                    <div className="flex justify-center py-4"><Loader className="animate-spin text-emerald-500"/></div>
                ) : userDrugs.length === 0 ? (
                  <div className="text-center py-4">
                     <p className="text-sm text-slate-500 italic mb-3">No medications found.</p>
                     
                     {session && (
                       <button 
                         onClick={handleInitializeAccount}
                         className="flex items-center justify-center gap-2 w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 text-xs font-bold py-2 rounded-lg transition"
                       >
                         <PlayCircle className="w-4 h-4" /> Load Demo Data
                       </button>
                     )}
                  </div>
                ) : (
                  userDrugs.map((drug, i) => (
                    <div key={i} className="flex justify-between items-center py-3 border-b border-slate-700/50 last:border-0">
                      <span className="font-medium text-slate-200">{drug.name}</span>
                      <span className="text-xs text-slate-500 font-mono bg-slate-900 px-2 py-1 rounded">{drug.dose}</span>
                    </div>
                  ))
                )}
              </div>
              
              {!session && (
                <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-slate-500 text-center">
                  <Link to="/login" className="underline hover:text-emerald-400">Sign in</Link> to save your list.
                </div>
              )}
            </div>

            {/* Upload Area */}
             {!file && (
              <div className="bg-slate-800/30 border border-dashed border-slate-700 rounded-2xl p-6 text-center hover:border-emerald-500/50 transition cursor-pointer group relative">
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} accept="image/*" />
                <Upload className="w-8 h-8 text-slate-500 mx-auto mb-3 group-hover:text-emerald-400 transition" />
                <p className="text-sm text-slate-400 font-medium group-hover:text-white">Upload supplement photo</p>
              </div>
             )}
          </div>

          {/* RIGHT: Analysis Area */}
          <div className="lg:col-span-8">
            {!file && !interactions && (
              <div className="h-[400px] bg-slate-800/30 border border-dashed border-slate-700 rounded-3xl flex flex-col items-center justify-center text-slate-500">
                <FileText className="w-12 h-12 mb-4 text-slate-600" />
                <p className="text-lg font-medium">Upload scan to start</p>
              </div>
            )}

            {file && !interactions && (
              <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden relative shadow-2xl">
                <div className="h-[400px] w-full bg-black relative flex items-center justify-center">
                  <img src={preview} alt="Upload" className="max-h-full max-w-full object-contain" />
                  <button onClick={() => setFile(null)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-red-500/80 transition backdrop-blur-md">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 bg-slate-800 border-t border-slate-700 flex justify-between items-center">
                  <div>
                    <h3 className="text-white font-medium">Ready to scan</h3>
                    <p className="text-slate-400 text-sm">Checking against {userDrugs.length} medications</p>
                  </div>
                  <button onClick={handleAnalyze} disabled={isAnalyzing} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 px-8 rounded-xl transition disabled:opacity-50">
                    {isAnalyzing ? <Loader className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                    {isAnalyzing ? "Analyzing..." : "Check Interactions"}
                  </button>
                </div>
              </div>
            )}

            {interactions && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                  <h3 className="text-sm uppercase tracking-wider text-slate-500 font-bold mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Detected Ingredients
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {ingredients.map((ing, i) => (
                      <span key={i} className="px-3 py-1.5 bg-slate-900 text-emerald-400 border border-slate-700 rounded-lg text-sm font-medium">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Analysis Report</h3>
                    {interactions.Major.length > 0 && (
                      <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20 uppercase">Major Risk Detected</span>
                    )}
                  </div>

                  {interactions.Major.map((item, i) => (
                    <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex gap-4">
                      <div className="mt-1"><AlertTriangle className="w-6 h-6 text-red-500" /></div>
                      <div>
                        <h4 className="text-lg font-bold text-red-400 mb-1">Major Interaction: {item.supplement} + {item.drug}</h4>
                        <p className="text-red-200/80 leading-relaxed">{item.details}</p>
                      </div>
                    </div>
                  ))}
                  
                  {interactions.Moderate.map((item, i) => (
                    <div key={i} className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex gap-4">
                      <div className="mt-1"><Activity className="w-6 h-6 text-amber-500" /></div>
                      <div>
                        <h4 className="text-lg font-bold text-amber-400 mb-1">Moderate Interaction: {item.supplement} + {item.drug}</h4>
                        <p className="text-amber-200/80 leading-relaxed">{item.details}</p>
                      </div>
                    </div>
                  ))}

                  {interactions.Major.length === 0 && interactions.Moderate.length === 0 && (
                     <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex gap-4">
                        <div className="mt-1"><Pill className="w-6 h-6 text-emerald-500" /></div>
                        <div>
                          <h4 className="text-lg font-bold text-emerald-400 mb-1">No Major Interactions Detected</h4>
                          <p className="text-emerald-200/80 leading-relaxed">Based on your current medication list, no high-risk interactions were found.</p>
                        </div>
                     </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}