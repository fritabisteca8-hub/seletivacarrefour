import { useState, useRef, useCallback, useEffect } from "react";
import { X } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (image: string) => void;
  onClose: () => void;
  side?: string;
}

const CameraCapture = ({ onCapture, onClose, side }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Erro ao acessar câmera:", err);
      }
    };
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;

    // Crop to the frame area (matches the CSS overlay: 15% top/bottom, 8% left/right)
    const sx = Math.round(vw * 0.08);
    const sy = Math.round(vh * 0.15);
    const sw = Math.round(vw * 0.84);
    const sh = Math.round(vh * 0.70);

    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onCapture(dataUrl);
  }, [onCapture]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between p-3 relative z-10">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
          <X size={20} className="text-white" />
        </button>
        <p className="text-white text-sm font-medium">
          {side ? `Documento — ${side}` : "Enquadre o documento"}
        </p>
        <div className="w-10" />
      </div>

      {/* Camera */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />

        {/* Dark overlay around frame */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 bg-black/60" style={{ height: "15%" }} />
          <div className="absolute bottom-0 left-0 right-0 bg-black/60" style={{ height: "15%" }} />
          <div className="absolute left-0 bg-black/60" style={{ top: "15%", bottom: "15%", width: "8%" }} />
          <div className="absolute right-0 bg-black/60" style={{ top: "15%", bottom: "15%", width: "8%" }} />
        </div>

        {/* Document frame guide */}
        <div
          className="absolute pointer-events-none border-2 border-white/80 rounded-2xl"
          style={{ top: "15%", bottom: "15%", left: "8%", right: "8%" }}
        >
          <div className="absolute -top-[2px] -left-[2px] w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl" />
          <div className="absolute -top-[2px] -right-[2px] w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl" />
          <div className="absolute -bottom-[2px] -left-[2px] w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl" />
          <div className="absolute -bottom-[2px] -right-[2px] w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl" />
        </div>

        {/* Guide text */}
        <div className="absolute bottom-[17%] left-0 right-0 text-center space-y-1 z-10">
          <p className="text-white/90 text-xs font-medium">
            Posicione o documento dentro da moldura
          </p>
          <p className="text-yellow-400 text-[11px] font-medium">
            Retire o documento do plástico para melhor leitura
          </p>
        </div>
      </div>

      {/* Capture button */}
      <div className="flex justify-center py-4 bg-black">
        <button
          onClick={capture}
          className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition"
        >
          <div className="w-12 h-12 rounded-full bg-white" />
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;
