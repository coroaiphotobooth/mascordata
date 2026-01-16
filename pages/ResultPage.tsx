import React, { useEffect, useState, useRef } from 'react';
import { Concept, PhotoboothSettings } from '../types';
import { generateAIImage } from '../lib/gemini';
import { uploadToDrive } from '../lib/appsScript';

interface ResultPageProps {
  capturedImage: string;
  concept: Concept;
  settings: PhotoboothSettings;
  onDone: () => void;
  onGallery: () => void;
}

const ResultPage: React.FC<ResultPageProps> = ({ capturedImage, concept, settings, onDone, onGallery }) => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadData, setUploadData] = useState<{ downloadUrl: string; shareUrl: string } | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [progress, setProgress] = useState("INITIALIZING NEURAL LINK");
  const [logs, setLogs] = useState<string[]>(["[SYS] Waking up AI cores...", "[SYS] Analyzing facial geometry..."]);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isPortrait = settings.orientation === 'portrait';
  const aspectRatio = isPortrait ? '9:16' : '16:9';
  const targetWidth = isPortrait ? 1024 : 1792; // Optimized for high quality
  const targetHeight = isPortrait ? 1792 : 1024;

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);

    const addLog = (msg: string) => {
      setLogs(prev => [...prev.slice(-4), `> ${msg}`]);
    };

    const processFlow = async () => {
      try {
        addLog("Injecting concept: " + concept.name.toUpperCase());
        addLog("Requesting Gemini Vision 2.5...");
        
        const aiOutput = await generateAIImage(capturedImage, concept.prompt, aspectRatio);
        
        setProgress("COMPOSING FINAL FRAME");
        addLog("Neural synthesis complete.");
        addLog("Applying event branding...");
        
        const finalImageWithOverlay = await applyOverlay(aiOutput, settings.overlayImage);
        setResultImage(finalImageWithOverlay);
        
        setIsProcessing(false);
        if (timerRef.current) clearInterval(timerRef.current);
        
        // Background Upload
        addLog("Transmitting to neural cloud...");
        const res = await uploadToDrive(finalImageWithOverlay, {
          conceptName: concept.name,
          eventName: settings.eventName
        });
        
        if (res.ok) {
          addLog("Cloud link established.");
          setUploadData({
            downloadUrl: res.downloadUrl,
            shareUrl: res.viewUrl
          });
        }
      } catch (err: any) {
        console.error("Process Flow Error:", err);
        setError(err.message || "NEURAL LINK SEVERED");
        setIsProcessing(false);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };

    processFlow();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [capturedImage, concept, settings, aspectRatio]);

  const applyOverlay = (base: string, overlay: string | null): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject("Canvas Error");
      
      const baseImg = new Image();
      baseImg.onload = () => {
        ctx.drawImage(baseImg, 0, 0, targetWidth, targetHeight);
        if (!overlay) return resolve(canvas.toDataURL('image/jpeg', 0.9));
        
        const ovrImg = new Image();
        ovrImg.crossOrigin = "anonymous"; 
        ovrImg.onload = () => {
          ctx.drawImage(ovrImg, 0, 0, targetWidth, targetHeight);
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        ovrImg.onerror = () => {
            console.warn("Overlay failed to load, returning base.");
            resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        ovrImg.src = overlay;
      };
      baseImg.onerror = () => reject("Base Image Error");
      baseImg.src = base;
    });
  };

  if (isProcessing) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center relative p-6 bg-[#020202]">
        {/* Futuristic Grid Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ 
          backgroundImage: 'radial-gradient(circle at 2px 2px, #bc13fe 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
        
        <div className="relative z-10 flex flex-col items-center max-w-lg w-full">
          {/* Animated Spinner Core */}
          <div className="relative w-48 h-48 md:w-64 md:h-64 mb-12">
            <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-t-purple-500 rounded-full animate-spin" />
            <div className="absolute inset-4 border border-blue-500/30 rounded-full animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
               <span className="text-5xl md:text-7xl font-heading text-white neon-text italic">{timer}</span>
            </div>
          </div>

          <h2 className="text-2xl md:text-4xl font-heading mb-2 neon-text italic uppercase tracking-tighter text-white animate-pulse">
            {progress}
          </h2>
          
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-8">
            <div className="h-full bg-purple-600 animate-[loading_15s_ease-in-out_infinite]" style={{width: '60%'}} />
          </div>

          {/* Terminal Logs */}
          <div className="w-full bg-black/50 border border-white/5 p-4 rounded-lg font-mono text-[9px] md:text-xs text-purple-400 text-left space-y-1 shadow-2xl">
            {logs.map((log, i) => (
              <div key={i} className="opacity-80 flex gap-2">
                <span className="text-purple-600 font-bold">[!]</span>
                {log}
              </div>
            ))}
            <div className="animate-bounce">_</div>
          </div>
          
          <p className="mt-12 text-white/30 font-mono text-[8px] tracking-[0.6em] uppercase">Neural Synthesis Engine v2.5</p>
        </div>
        
        {/* Floating Scanline */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent h-1/2 w-full animate-[scan_3s_linear_infinite] pointer-events-none" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#050505]">
        <div className="w-20 h-20 mb-6 text-red-600 border-2 border-red-600 rounded-full flex items-center justify-center animate-pulse">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h2 className="text-red-500 text-3xl font-heading mb-4 uppercase italic">NEURAL LINK FAILED</h2>
        <p className="text-white/60 mb-12 max-w-md font-mono text-xs uppercase tracking-widest">{error}</p>
        <button onClick={onDone} className="px-16 py-6 bg-white text-black font-heading hover:bg-red-600 hover:text-white transition-all italic text-xl">RESTART SYSTEM</button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-6 bg-[#050505] relative overflow-hidden">
      {/* Background Ambiance */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-purple-900/10 blur-[150px]" />
      </div>

      <div className={`relative z-10 ${isPortrait ? "w-full max-w-[450px] aspect-[9/16]" : "w-full max-w-4xl aspect-[16/9]"} border border-white/10 shadow-[0_0_80px_rgba(188,19,254,0.15)] rounded-2xl overflow-hidden mb-10 transition-all duration-1000 animate-in zoom-in-95 duration-700`}>
        <img src={resultImage!} alt="Result" className="w-full h-full object-cover" />
        
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Overlay Interaction Layer */}
        <div className="absolute inset-0 flex flex-col items-center justify-end p-8">
          {!showQR ? (
            <button 
              onClick={() => setShowQR(true)}
              className="group relative bg-purple-600 text-white px-12 py-5 font-heading text-sm tracking-[0.3em] uppercase italic transition-all hover:bg-purple-500 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(188,19,254,0.5)] rounded-none"
            >
              GENERATE ACCESS CODE
              <div className="absolute inset-0 border border-white/20 translate-x-1 translate-y-1 -z-10" />
            </button>
          ) : (
            <div className="w-full bg-black/95 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 flex flex-col items-center animate-in slide-in-from-bottom duration-500">
              <div className="bg-white p-4 rounded-2xl mb-6 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                {uploadData ? (
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(uploadData.shareUrl)}`} className="w-48 h-48 md:w-64 md:h-64" alt="QR" />
                ) : (
                  <div className="w-48 h-48 md:w-64 md:h-64 flex flex-col items-center justify-center text-black">
                     <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
                     <span className="font-mono text-[10px] uppercase font-bold tracking-widest">UPLOADING...</span>
                  </div>
                )}
              </div>
              <p className="text-purple-400 font-mono text-[10px] uppercase tracking-[0.4em] mb-6 font-bold">Scan to Download Asset</p>
              <button onClick={() => setShowQR(false)} className="text-white/30 hover:text-white transition-colors text-[10px] uppercase tracking-widest py-2">Close Code</button>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row gap-6 w-full max-w-md md:max-w-xl">
        <button onClick={onDone} className="flex-1 py-6 bg-white/5 border border-white/10 text-white font-heading hover:bg-white/10 transition-all uppercase italic tracking-widest text-lg">TERMINATE</button>
        <button onClick={onGallery} className="flex-1 py-6 bg-purple-600/10 border border-purple-500/50 text-purple-300 font-heading hover:bg-purple-600/20 transition-all uppercase italic tracking-widest text-lg">ARCHIVE</button>
      </div>
      
      <div className="mt-10 font-mono text-[8px] text-gray-600 uppercase tracking-[1em] animate-pulse">Neural Identity Established</div>
    </div>
  );
};

export default ResultPage;