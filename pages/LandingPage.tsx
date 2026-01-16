import React from 'react';
import { PhotoboothSettings } from '../types';

interface LandingPageProps {
  onStart: () => void;
  onGallery: () => void;
  onAdmin: () => void;
  settings: PhotoboothSettings;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onGallery, onAdmin, settings }) => {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen relative p-6 text-center">
      {/* Tombol Admin Tersembunyi/Kecil */}
      <button 
        onClick={onAdmin} 
        className="absolute top-6 right-6 text-gray-800 hover:text-purple-500 transition-colors uppercase text-[10px] tracking-widest z-50"
      >
        System
      </button>

      <div className="mb-16 animate-in fade-in zoom-in duration-1000">
        <div className="inline-block px-3 py-1 border border-purple-500/30 bg-purple-500/10 text-purple-400 text-[10px] tracking-[0.3em] uppercase mb-4 rounded-full">
          Neural Frame V2.5
        </div>
        <h1 className="text-5xl md:text-8xl font-heading font-black neon-text text-white tracking-tighter italic leading-tight mb-4">
          {settings.eventName}
        </h1>
        <h2 className="text-sm md:text-xl tracking-[0.5em] text-gray-400 font-light uppercase">
          {settings.eventDescription}
        </h2>
      </div>

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-md md:max-w-none justify-center">
        <button 
          onClick={onStart}
          className="group relative px-12 py-6 bg-purple-600 hover:bg-purple-500 transition-all rounded-none font-heading text-xl tracking-widest neon-border overflow-hidden"
        >
          <span className="relative z-10">START CAPTURE</span>
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
        </button>

        <button 
          onClick={onGallery}
          className="group relative px-12 py-6 border border-white/20 hover:border-white transition-all rounded-none font-heading text-xl tracking-widest overflow-hidden"
        >
          <span className="relative z-10">ARCHIVE</span>
        </button>
      </div>

      <div className="mt-20 opacity-30 text-[10px] tracking-[0.8em] uppercase text-gray-500">
        AI GENERATIVE • CORO.AI • 2025
      </div>
    </div>
  );
};

export default LandingPage;
