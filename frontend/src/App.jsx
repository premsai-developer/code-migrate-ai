import React, { useState } from 'react';
import axios from 'axios';
import { Upload, ArrowRight, Activity, AlertTriangle, CheckCircle, Zap, ClipboardList, RotateCcw } from 'lucide-react';
import Editor, { DiffEditor } from '@monaco-editor/react';

function App() {
  // 🟢 THIS IS THE MISSING LINE YOU WERE LOOKING FOR
  // Change this URL to your Render link (e.g., https://your-app.onrender.com)
  const API_BASE = "https://code-migrate-api.onrender.com"; 

  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [sourceCode, setSourceCode] = useState("// Upload a file to see code...");
  const [migratedCode, setMigratedCode] = useState(null);
  const [migrationSteps, setMigrationSteps] = useState([]); 
  
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [activeTab, setActiveTab] = useState('code'); 
  
  const [sourceLang, setSourceLang] = useState('Auto-Detect');
  const [targetLang, setTargetLang] = useState('React (Hooks)');

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      // 🟢 UPDATED: Uses API_BASE
      const response = await axios.post(`${API_BASE}/analyze`, formData);
      
      let aiData = response.data.analysis;
      if (typeof aiData === 'string') {
          aiData = aiData.replace(/```json/g, '').replace(/```/g, '');
          try { aiData = JSON.parse(aiData); } catch (err) {}
      }
      
      setAnalysis(aiData);
      setSourceCode(response.data.source_code); 
      setMigratedCode(null);
      setMigrationSteps([]); 
      setActiveTab('code');
    } catch (error) {
      console.error("Error:", error);
      alert("Backend error. Ensure backend is running and URL is correct.");
    }
    setLoading(false);
  };

  const handleMigrate = async () => {
    setMigrating(true);
    try {
        // 🟢 UPDATED: Uses API_BASE
        const response = await axios.post(`${API_BASE}/migrate`, {
            code: sourceCode,
            target_lang: targetLang 
        });
        
        setMigratedCode(response.data.migrated_code);
        setMigrationSteps(response.data.migration_steps || ["Review code for changes."]);
        setActiveTab('diff'); 
    } catch (error) {
        console.error("Migration failed:", error);
        alert("Migration failed. Check console.");
    }
    setMigrating(false);
  };

  const handleRollback = () => {
      if (window.confirm("Are you sure? This will discard the migrated code and unit tests.")) {
          setMigratedCode(null);
          setMigrationSteps([]);
          setActiveTab('code'); 
      }
  };

  const handleGenerateTests = async () => {
    try {
        // 🟢 UPDATED: Uses API_BASE
        const res = await axios.post(`${API_BASE}/generate-tests`, { 
            migrated_code: migratedCode 
        });
        setMigratedCode(res.data.test_code); 
        setActiveTab('diff');
        alert("Tests Generated! The view has been updated with the test suite.");
    } catch (error) {
        console.error("Test gen failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-white font-sans bg-slate-950">
      {/* Sidebar */}
      <div className="w-full md:w-1/4 bg-slate-900 p-6 border-r border-slate-700 flex flex-col h-screen overflow-y-auto">
        <h1 className="text-2xl font-bold mb-8 text-blue-400 tracking-tight">CodeMigrate AI</h1>
        
        <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer relative group">
            <input type="file" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <Upload className="mx-auto h-12 w-12 text-slate-400 group-hover:text-blue-400 transition-colors mb-4" />
            <p className="text-slate-300 font-medium">Upload Legacy Code</p>
        </div>

        {analysis && (
            <div className="mt-8 space-y-6 animate-fade-in">
                <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-blue-500">
                    <p className="text-xs text-slate-400 uppercase font-bold">Detected Language</p>
                    <p className="font-bold text-lg">{analysis.language || "Unknown"}</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-bold block mb-2">Source Language</label>
                        <select 
                            value={sourceLang}
                            onChange={(e) => setSourceLang(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-blue-500 outline-none cursor-pointer"
                        >
                            <option>Auto-Detect</option>
                            <option value="jQuery">jQuery</option>
                            <option value="Python 2">Python 2</option>
                            <option value="AngularJS">AngularJS</option>
                            <option value="JavaScript ES5">JavaScript (ES5)</option>
                            <option value="React Class Component">React Class Components</option>
                        </select>
                    </div>
                    
                    <div className="flex justify-center">
                        <ArrowRight className="text-slate-600 rotate-90" size={20} />
                    </div>

                    <div>
                        <label className="text-xs text-slate-400 uppercase font-bold block mb-2">Target Language</label>
                        <select 
                            value={targetLang}
                            onChange={(e) => setTargetLang(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-blue-500 outline-none cursor-pointer"
                        >
                            <option value="React (Hooks)">React (Hooks)</option>
                            <option value="Vue.js 3">Vue.js 3</option>
                            <option value="Python 3">Python 3</option>
                            <option value="Angular (Modern)">Angular (Modern)</option>
                            <option value="JavaScript ES6+">JavaScript (ES6+)</option>
                        </select>
                    </div>
                </div>

                <button 
                    onClick={handleMigrate}
                    disabled={migrating}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-bold shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                    {migrating ? <Activity className="animate-spin" /> : <Zap fill="currentColor" />}
                    {migrating ? "Converting..." : `Migrate to ${targetLang}`}
                </button>

                {migratedCode && (
                    <div className="space-y-3">
                        <button 
                            onClick={handleGenerateTests}
                            className="w-full py-3 bg-slate-800 border border-green-500/50 text-green-400 rounded-lg font-bold hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={18} /> Generate Unit Tests
                        </button>
                        
                        <button 
                            onClick={handleRollback}
                            className="w-full py-3 bg-red-900/20 border border-red-500/50 text-red-400 rounded-lg font-bold hover:bg-red-900/40 transition-all flex items-center justify-center gap-2"
                        >
                            <RotateCcw size={18} /> Rollback to Original
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-slate-950 p-6 flex flex-col h-screen overflow-hidden">
        
        {/* TABS */}
        <div className="flex gap-6 mb-6 border-b border-slate-800">
            <button onClick={() => setActiveTab('code')} className={`pb-4 px-2 font-medium transition-colors ${activeTab === 'code' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-400'}`}>Source Code</button>
            <button onClick={() => setActiveTab('report')} className={`pb-4 px-2 font-medium transition-colors ${activeTab === 'report' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-400'}`}>Analysis Report</button>
            
            {migratedCode && (
                <>
                    <button onClick={() => setActiveTab('diff')} className={`pb-4 px-2 font-medium transition-colors ${activeTab === 'diff' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-400'}`}>Migration Diff</button>
                    <button onClick={() => setActiveTab('steps')} className={`pb-4 px-2 font-medium transition-colors ${activeTab === 'steps' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-400'}`}>Migration Guide</button>
                </>
            )}
        </div>

        {/* Content Container */}
        <div className="flex-1 bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden relative shadow-inner">
            
            {/* 1. Source Code View */}
            {activeTab === 'code' && (
                <Editor 
                    height="100%" 
                    defaultLanguage="javascript" 
                    theme="vs-dark"
                    value={sourceCode}
                    options={{ minimap: { enabled: false }, fontSize: 14 }}
                />
            )}

            {/* 2. Analysis Report View */}
            {activeTab === 'report' && (
                <div className="p-8 overflow-y-auto h-full scrollbar-thin scrollbar-thumb-slate-700">
                    {analysis ? (
                        <div className="max-w-4xl mx-auto space-y-8">
                            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity className="text-blue-400" /> Executive Summary</h3>
                                <p className="text-slate-300 leading-relaxed text-lg">{analysis.summary}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-red-900/10 p-6 rounded-xl border border-red-900/30">
                                    <h3 className="font-bold text-red-400 mb-4 flex items-center gap-2"><AlertTriangle size={18} /> Risks Identified</h3>
                                    <ul className="list-disc list-inside text-slate-300 space-y-2">
                                        {analysis.risks?.map((r,i) => <li key={i}>{r}</li>) || <li>High coupling detected</li>}
                                    </ul>
                                </div>
                                <div className="bg-green-900/10 p-6 rounded-xl border border-green-900/30">
                                    <h3 className="font-bold text-green-400 mb-4 flex items-center gap-2"><CheckCircle size={18} /> Recommended Path</h3>
                                    <ul className="space-y-2 text-slate-300">
                                        {analysis.modernization_suggestions?.map((s,i) => <li key={i} className="flex gap-2"><ArrowRight size={16} className="mt-1 text-slate-500 flex-shrink-0"/>{s}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500">Upload a file to generate report</div>
                    )}
                </div>
            )}

            {/* 3. Diff View */}
            {activeTab === 'diff' && (
                <DiffEditor 
                    height="100%" 
                    original={sourceCode} 
                    modified={migratedCode} 
                    theme="vs-dark" 
                    language="javascript"
                    options={{ readOnly: true, renderSideBySide: true }}
                />
            )}

            {/* 4. Manual Steps View */}
            {activeTab === 'steps' && (
                <div className="p-8 overflow-y-auto h-full">
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-xl">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-blue-400">
                                <ClipboardList size={28} /> Manual Migration Steps
                            </h2>
                            <p className="text-slate-400 mb-8">
                                The following steps were executed to convert the codebase. Review these changes manually to ensure business logic preservation.
                            </p>
                            
                            <div className="space-y-4">
                                {migrationSteps.map((step, index) => (
                                    <div key={index} className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-blue-500/30 transition-colors">
                                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center font-bold">
                                            {index + 1}
                                        </div>
                                        <div className="pt-1">
                                            <p className="text-slate-200 text-lg">{step}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
}

export default App;