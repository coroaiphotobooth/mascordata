import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CameraPageProps {
  onCapture: (image: string) => void;
  onGenerate: () => void;
  onBack: () => void;
  capturedImage: string | null;
  orientation: 'portrait' | 'landscape';
}

const CameraPage: React.FC<CameraPageProps> = ({ onCapture, onGenerate, onBack, capturedImage, orientation }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const isPortrait = orientation === 'portrait';
  const targetWidth = isPortrait ? 768 : 1344;
  const targetHeight = isPortrait ? 1344 : 768;
  const aspectRatioClass = isPortrait ? 'aspect-[9/16]' : 'aspect-[16/9]';
  const maxWidthClass = isPortrait ? 'max-w-[420px]' : 'max-w-[900px]';

  useEffect(() => {
    async function setupCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: targetWidth }, 
            height: { ideal: targetHeight }, 
            facingMode: 'user' 
          } 
        });
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      } catch (err) {
        console.error("Camera error:", err);
      }
    }
    setupCamera();
    return () => stream?.getTracks().forEach(track => track.stop());
  }, [targetWidth, targetHeight]);

  const capture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        const videoRatio = video.videoWidth / video.videoHeight;
        const targetRatio = targetWidth / targetHeight;
        
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = video.videoWidth;
        let sourceHeight = video.videoHeight;

        if (videoRatio > targetRatio) {
          sourceWidth = video.videoHeight * targetRatio;
          sourceX = (video.videoWidth - sourceWidth) / 2;
        } else {
          sourceHeight = video.videoWidth / targetRatio;
          sourceY = (video.videoHeight - sourceHeight) / 2;
        }

        ctx.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        onCapture(dataUrl);
        // Automatically proceed to generation
        onGenerate();
      }
    }
  }, [onCapture, onGenerate, targetWidth, targetHeight]);

  const startCountdown = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) {
          clearInterval(interval);
          capture();
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-start p-6 bg-black relative overflow-y-auto">
      <div className="flex justify-between items-center w-full mb-8 max-w-5xl z-20">
        <button onClick={onBack} className="text-white hover:text-purple-400 font-bold tracking-widest uppercase text-xs md:text-base transition-colors">BACK</button>
        <h2 className="text-xs md:text-xl font-heading text-white neon-text">POSITION YOURSELF</h2>
        <div className="w-10" />
      </div>

      <div className={`relative w-full ${maxWidthClass} ${aspectRatioClass} border-2 border-white/20 overflow-hidden bg-gray-900 shadow-[0_0_50px_rgba(188,19,254,0.3)] mb-8`}>
        {!capturedImage ? (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            {/* Guide Frame */}
            <div className="absolute inset-0 border-[20px] md:border-[40px] border-black/50 pointer-events-none">
              <div className="w-full h-full border-2 border-dashed border-purple-500/30 flex items-center justify-center">
                <div className="w-[60%] h-[60%] border border-purple-500/20 rounded-full opacity-30" />
              </div>
            </div>
            {countdown && (
              <div className="absolute inset-0 flex items-center justify-center z-30">
                <span className="text-[120px] md:text-[200px] font-heading text-white neon-text animate-ping">{countdown}</span>
              </div>
            )}
            <div className="scan-line" />
          </>
        ) : (
          <img src={capturedImage} alt="Capture" className="w-full h-full object-cover" />
        )}
      </div>

      <div className={`flex flex-col sm:flex-row gap-4 md:gap-6 z-20 w-full ${maxWidthClass} pb-10`}>
        {!capturedImage && (
          <button 
            disabled={countdown !== null}
            onClick={startCountdown}
            className="w-full py-5 bg-white text-black font-heading font-bold rounded-none hover:bg-purple-500 hover:text-white transition-all disabled:opacity-50 text-xl tracking-[0.2em]"
          >
            CAPTURE
          </button>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraPage;