import React, { useEffect, useState } from 'react';
import { GalleryItem } from '../types';
import { fetchGallery, deletePhoto } from '../lib/appsScript';

interface GalleryPageProps {
  onBack: () => void;
}

const GalleryPage: React.FC<GalleryPageProps> = ({ onBack }) => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGallery();
      setItems(data);
    } catch (err: any) {
      setError("GAGAL MENGAKSES DATABASE NEURAL");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    const pin = prompt("MASUKKAN PIN KEAMANAN UNTUK MENGHAPUS:");
    if (!pin) return;

    setIsDeleting(true);
    try {
      const res = await deletePhoto(selectedItem.id, pin);
      if (res.ok) {
        setItems(prev => prev.filter(i => i.id !== selectedItem.id));
        setSelectedItem(null);
        alert("DATA BERHASIL DIHAPUS DARI SISTEM");
      } else {
        alert("AKSES DITOLAK: " + (res.error === 'UNAUTHORIZED_ACCESS' ? "PIN Salah" : res.error));
      }
    } catch (err) {
      alert("KESALAHAN JARINGAN SAAT PENGHAPUSAN");
    } finally {
      setIsDeleting(false);
    }
  };

  const getImageUrl = (item: GalleryItem) => {
    return item.id ? `https://drive.google.com/thumbnail?id=${item.id}&sz=w800` : item.imageUrl;
  };

  return (
    <div className="w-full min-h-screen flex flex-col p-6 md:p-12 bg-[#050505] overflow-y-auto relative animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center w-full mb-12 max-w-7xl mx-auto gap-6 shrink-0 z-10">
        <button onClick={onBack} className="text-white/60 flex items-center gap-3 hover:text-white uppercase font-bold tracking-[0.3em] transition-all text-xs">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          KEMBALI KE TERMINAL
        </button>
        <div className="text-center">
          <h2 className="text-3xl md:text-5xl font-heading text-white neon-text italic uppercase tracking-tighter">NEURAL_ARCHIVE</h2>
          <p className="text-[10px] text-purple-400 tracking-[0.5em] uppercase mt-2 font-bold animate-pulse">Database Capture Aktif</p>
        </div>
        <button onClick={loadGallery} className={`p-4 bg-white/5 rounded-full text-white hover:bg-white/10 transition-all border border-white/10 ${loading ? 'animate-spin' : ''}`}>
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
            <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-purple-400 font-mono text-[10px] tracking-widest uppercase animate-pulse">Mensinkronisasi Memori...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-6">
             <p className="text-red-500 font-mono text-xs uppercase tracking-widest">{error}</p>
             <button onClick={loadGallery} className="px-12 py-4 border border-white/20 text-white font-heading text-xs uppercase italic hover:bg-white hover:text-black transition-all">RE-OTORISASI</button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center opacity-30">
             <div className="w-20 h-20 mb-6 border border-dashed border-white/20 rounded-full flex items-center justify-center text-white/20">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             </div>
             <h3 className="text-xl font-heading text-white uppercase tracking-widest">BANK_MEMORI_KOSONG</h3>
             <p className="text-[10px] font-mono mt-4 uppercase tracking-[0.3em]">Belum ada identitas yang terekam di sektor ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8 pb-32">
            {items.map((item, idx) => (
              <div 
                key={item.id || idx}
                onClick={() => setSelectedItem(item)}
                className="group relative aspect-[9/16] overflow-hidden bg-white/5 border border-white/10 cursor-pointer hover:border-purple-500 transition-all rounded-xl shadow-2xl hover:shadow-purple-500/20"
              >
                <img src={getImageUrl(item)} alt="Archive" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-4 left-4 right-4 text-[9px] text-white font-heading truncate uppercase italic tracking-tighter">
                  {item.conceptName || 'UNKNOWN_IDENTITY'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox dengan Fitur Delete */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-3xl p-6 md:p-12 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row gap-12 max-w-6xl w-full items-center">
            <div className="relative w-full max-w-[400px] aspect-[9/16] rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(188,19,254,0.2)]">
               <img src={getImageUrl(selectedItem)} className="w-full h-full object-cover" alt="Preview" />
            </div>
            
            <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1">
              <h3 className="text-4xl md:text-5xl font-heading text-white mb-2 italic uppercase tracking-tighter neon-text">HASIL_CAPTURE</h3>
              <p className="text-purple-500 font-mono text-[10px] mb-12 uppercase tracking-[0.5em]">{selectedItem.createdAt}</p>
              
              <div className="bg-white p-4 rounded-3xl mb-12 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(selectedItem.imageUrl)}`} className="w-48 h-48 md:w-64 md:h-64" alt="QR" />
              </div>
              
              <div className="flex flex-col gap-4 w-full max-w-xs">
                <button onClick={() => window.open(selectedItem.imageUrl, '_blank')} className="w-full py-5 bg-purple-600 text-white font-heading uppercase italic tracking-widest hover:bg-purple-500 transition-all text-sm shadow-lg shadow-purple-900/20">UNDUH ASSET</button>
                <button onClick={() => setSelectedItem(null)} className="w-full py-4 border border-white/20 text-white/50 font-heading text-[10px] uppercase italic tracking-widest hover:text-white transition-colors">TUTUP AKSES</button>
                <div className="h-px bg-white/5 w-full my-2" />
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full py-3 text-red-500/40 hover:text-red-500 font-mono text-[9px] uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  {isDeleting ? 'MENGHAPUS...' : 'HAPUS PERMANEN'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;