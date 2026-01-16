import React, { useState, useRef, useEffect } from 'react';
import { Concept, PhotoboothSettings } from '../types';
import { saveSettingsToGas, saveConceptsToGas, resetAppData } from '../lib/appsScript';
import { DEFAULT_GAS_URL } from '../constants';

interface AdminPageProps {
  settings: PhotoboothSettings;
  concepts: Concept[];
  onSaveSettings: (settings: PhotoboothSettings) => void;
  onSaveConcepts: (concepts: Concept[]) => void;
  onBack: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ settings, concepts, onSaveSettings, onSaveConcepts, onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [localSettings, setLocalSettings] = useState(settings);
  const [localConcepts, setLocalConcepts] = useState(concepts);
  const [gasUrl, setGasUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'settings' | 'concepts'>('settings');
  const [isResetting, setIsResetting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const savedUrl = localStorage.getItem('APPS_SCRIPT_BASE_URL') || DEFAULT_GAS_URL;
    setGasUrl(savedUrl);
  }, []);

  const handleLogin = () => {
    if (pinInput === localSettings.adminPin) {
      setIsAuthenticated(true);
    } else {
      alert('PIN KEAMANAN SALAH');
      setPinInput('');
    }
  };

  const handleResetApp = async () => {
    const confirmed = window.confirm("!!! PERINGATAN KRITIS !!!\n\nIni akan menghapus seluruh daftar galeri di database (Spreadsheet). Foto di Drive akan aman.\n\nLanjutkan?");
    if (!confirmed) return;

    setIsResetting(true);
    try {
      const res = await resetAppData(localSettings.adminPin);
      if (res.ok) {
        alert("DATABASE BERHASIL DIKOSONGKAN");
      } else {
        alert("RESET GAGAL: " + (res.error || "Cek Koneksi"));
      }
    } catch (err) {
      alert("KESALAHAN JARINGAN");
    } finally {
      setIsResetting(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('APPS_SCRIPT_BASE_URL', gasUrl);
      const ok = await saveSettingsToGas(localSettings, localSettings.adminPin);
      onSaveSettings(localSettings);
      alert(ok ? 'Pengaturan tersimpan di Cloud!' : 'Tersimpan lokal saja.');
    } catch (e) {
      alert("Error saat menyimpan.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center p-6 bg-[#050505] animate-in fade-in duration-500">
        <h2 className="text-4xl md:text-5xl font-heading mb-12 neon-text italic text-center tracking-tighter uppercase">ROOT_ACCESS</h2>
        <div className="glass-card p-10 md:p-14 flex flex-col items-center gap-10 w-full max-w-sm border-purple-500/20 shadow-2xl rounded-2xl">
          <div className="w-full flex flex-col gap-4">
            <label className="text-[10px] text-gray-500 tracking-[0.5em] uppercase font-bold text-center">Terminal PIN</label>
            <input 
              type="password" 
              className="bg-black/50 border border-white/10 px-6 py-6 text-center text-4xl tracking-[0.8em] outline-none focus:border-purple-500 transition-all font-mono w-full text-white"
              value={pinInput}
              autoFocus
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <button 
            onClick={handleLogin}
            className="w-full py-5 bg-purple-600 font-heading tracking-widest hover:bg-purple-500 transition-all text-xl italic uppercase"
          >
            OTORISASI
          </button>
          <button onClick={onBack} className="text-gray-600 hover:text-white uppercase text-[10px] tracking-widest font-bold">Kembali</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col p-6 md:p-12 bg-[#050505] overflow-y-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 max-w-7xl mx-auto w-full border-b border-white/5 pb-12 gap-10">
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-20">
          <h2 className="text-3xl md:text-4xl font-heading text-white neon-text italic uppercase tracking-tighter">SISTEM_KONTROL</h2>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-10 py-3 rounded-lg text-[10px] font-bold tracking-[0.3em] uppercase transition-all ${activeTab === 'settings' ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/40' : 'text-gray-500 hover:text-white'}`}
            >
              Control
            </button>
            <button 
              onClick={() => setActiveTab('concepts')}
              className={`px-10 py-3 rounded-lg text-[10px] font-bold tracking-[0.3em] uppercase transition-all ${activeTab === 'concepts' ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/40' : 'text-gray-500 hover:text-white'}`}
            >
              Themes
            </button>
          </div>
        </div>
        <button onClick={() => setIsAuthenticated(false)} className="px-10 py-4 border border-red-900/50 text-red-500 hover:bg-red-500/10 uppercase tracking-widest text-xs font-bold italic">Logout</button>
      </div>

      <div className="max-w-7xl mx-auto w-full pb-32">
        {activeTab === 'settings' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="glass-card p-10 flex flex-col gap-10 border-white/5 rounded-3xl">
              <h3 className="font-heading text-xl text-purple-400 border-b border-white/5 pb-5 uppercase tracking-widest italic">Inti Konfigurasi</h3>
              
              <div className="flex flex-col gap-4">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Apps Script URL</label>
                <input 
                  type="text" 
                  className="bg-black/30 border border-white/10 p-5 rounded-xl text-white font-mono text-xs focus:border-purple-500 outline-none"
                  value={gasUrl}
                  onChange={(e) => setGasUrl(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Nama Event</label>
                  <input 
                    type="text" 
                    className="bg-black/30 border border-white/10 p-5 rounded-xl text-white font-heading text-xs"
                    value={localSettings.eventName}
                    onChange={(e) => setLocalSettings({...localSettings, eventName: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-4">
                  <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Admin PIN</label>
                  <input 
                    type="text" 
                    className="bg-black/30 border border-white/10 p-5 rounded-xl text-white font-mono text-center tracking-[0.5em]"
                    value={localSettings.adminPin}
                    onChange={(e) => setLocalSettings({...localSettings, adminPin: e.target.value})}
                  />
                </div>
              </div>

              <button 
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="w-full py-6 bg-white text-black font-heading hover:bg-purple-500 hover:text-white transition-all uppercase italic tracking-widest shadow-xl"
              >
                {isSaving ? 'MENYIMPAN...' : 'SIMPAN SEMUA PERUBAHAN'}
              </button>
            </div>

            <div className="glass-card p-10 flex flex-col gap-8 border-red-900/20 rounded-3xl border">
              <h3 className="font-heading text-xl text-red-500 border-b border-red-900/10 pb-5 uppercase tracking-widest italic">Zona Berbahaya</h3>
              <p className="text-xs text-gray-400 font-mono leading-relaxed">Operasi reset akan menghapus index galeri dari spreadsheet. Gunakan hanya jika ingin memulai event baru.</p>
              <button 
                onClick={handleResetApp}
                disabled={isResetting}
                className="w-full py-6 border-2 border-red-600 text-red-600 font-heading hover:bg-red-600 hover:text-white transition-all uppercase italic tracking-widest"
              >
                {isResetting ? 'MENGHAPUS DATABASE...' : 'RESET DATABASE GALERI'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-5">
            {localConcepts.map((concept, idx) => (
              <div key={concept.id} className="glass-card p-8 rounded-3xl border-white/5 flex flex-col gap-6 group hover:border-purple-500/50 transition-all">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono text-purple-500 font-bold uppercase tracking-widest">Theme #{idx + 1}</span>
                </div>
                <input 
                  className="bg-transparent border-b border-white/10 text-white font-heading text-lg focus:border-purple-500 outline-none pb-2"
                  value={concept.name}
                  onChange={(e) => {
                    const next = [...localConcepts];
                    next[idx].name = e.target.value;
                    setLocalConcepts(next);
                  }}
                />
                <textarea 
                  className="bg-black/20 border border-white/5 p-4 rounded-xl text-white/60 font-mono text-[10px] h-32 resize-none focus:text-white focus:border-purple-500 outline-none"
                  value={concept.prompt}
                  onChange={(e) => {
                    const next = [...localConcepts];
                    next[idx].prompt = e.target.value;
                    setLocalConcepts(next);
                  }}
                />
              </div>
            ))}
            <div className="col-span-full flex justify-end mt-12">
               <button 
                onClick={() => { onSaveConcepts(localConcepts); alert('Konsep diperbarui secara lokal.'); }}
                className="px-20 py-6 bg-purple-600 text-white font-heading hover:bg-purple-500 transition-all uppercase italic tracking-widest shadow-2xl shadow-purple-900/20"
              >
                UPDATE KONSEP
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;