import { useState, useRef, useEffect, useCallback } from "react";
import { RotateCw, RotateCcw, Crop as CropIcon, Check, X } from "lucide-react";

interface Props {
  src: string;
  onCancel: () => void;
  onSave: (dataUrl: string) => void;
}

type Box = { x: number; y: number; w: number; h: number };
type Mode = "move" | "nw" | "ne" | "sw" | "se" | "n" | "s" | "w" | "e" | null;
const HANDLES: Exclude<Mode, null | "move">[] = ["nw", "ne", "sw", "se", "n", "s", "w", "e"];

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

async function rotateImage(src: string, rotation: number): Promise<string> {
  if (rotation % 360 === 0) return src;
  const image = await loadImage(src);
  const rad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const w = image.width * cos + image.height * sin;
  const h = image.width * sin + image.height * cos;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.translate(w / 2, h / 2);
  ctx.rotate(rad);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);
  return c.toDataURL("image/jpeg", 0.92);
}

async function cropImageData(src: string, box: Box, dispW: number, dispH: number): Promise<string> {
  const image = await loadImage(src);
  const sx = image.naturalWidth / dispW;
  const sy = image.naturalHeight / dispH;
  const c = document.createElement("canvas");
  c.width = Math.round(box.w * sx);
  c.height = Math.round(box.h * sy);
  const ctx = c.getContext("2d")!;
  ctx.drawImage(image, box.x * sx, box.y * sy, box.w * sx, box.h * sy, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.92);
}

const MIN = 30;

export const ImageEditor = ({ src, onCancel, onSave }: Props) => {
  const [workingSrc, setWorkingSrc] = useState(src);
  const [cropMode, setCropMode] = useState(false);
  const [box, setBox] = useState<Box>({ x: 0, y: 0, w: 0, h: 0 });
  const [saving, setSaving] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ mode: Mode; startX: number; startY: number; orig: Box } | null>(null);

  const resetBox = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const w = img.clientWidth, h = img.clientHeight;
    if (!w || !h) return;
    setBox({ x: w * 0.15, y: h * 0.15, w: w * 0.7, h: h * 0.7 });
  }, []);

  useEffect(() => {
    if (!cropMode) return;
    const id = setTimeout(resetBox, 60);
    return () => clearTimeout(id);
  }, [cropMode, workingSrc, resetBox]);

  const applyRotation = async (delta: number) => {
    setSaving(true);
    try {
      const rotated = await rotateImage(workingSrc, delta);
      setWorkingSrc(rotated);
      setCropMode(false);
    } finally {
      setSaving(false);
    }
  };

  const onPointerDown = (e: React.PointerEvent, mode: Mode) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { mode, startX: e.clientX, startY: e.clientY, orig: { ...box } };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    const img = imgRef.current;
    if (!d || !d.mode || !img) return;
    const W = img.clientWidth, H = img.clientHeight;
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
    const o = d.orig;
    let x = o.x, y = o.y, w = o.w, h = o.h;
    if (d.mode === "move") {
      x = Math.max(0, Math.min(W - w, o.x + dx));
      y = Math.max(0, Math.min(H - h, o.y + dy));
    } else {
      const m = d.mode;
      if (m.includes("e")) w = Math.max(MIN, Math.min(W - o.x, o.w + dx));
      if (m.includes("s")) h = Math.max(MIN, Math.min(H - o.y, o.h + dy));
      if (m.includes("w")) {
        const nx = Math.max(0, Math.min(o.x + o.w - MIN, o.x + dx));
        w = o.w + (o.x - nx);
        x = nx;
      }
      if (m.includes("n")) {
        const ny = Math.max(0, Math.min(o.y + o.h - MIN, o.y + dy));
        h = o.h + (o.y - ny);
        y = ny;
      }
    }
    setBox({ x, y, w, h });
  };

  const onPointerUp = () => { dragRef.current = null; };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalSrc = workingSrc;
      if (cropMode && imgRef.current && box.w > 5 && box.h > 5) {
        finalSrc = await cropImageData(finalSrc, box, imgRef.current.clientWidth, imgRef.current.clientHeight);
      }
      onSave(finalSrc);
    } finally {
      setSaving(false);
    }
  };

  const cursorFor = (h: string) =>
    h === "n" || h === "s" ? "ns-resize"
    : h === "e" || h === "w" ? "ew-resize"
    : h === "nw" || h === "se" ? "nwse-resize"
    : "nesw-resize";

  const handleStyle = (h: string): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: "absolute",
      width: 18,
      height: 18,
      background: "hsl(var(--primary))",
      border: "2px solid #fff",
      borderRadius: "50%",
      boxSizing: "border-box",
      touchAction: "none",
      cursor: cursorFor(h),
      zIndex: 2,
    };
    if (h.includes("n")) base.top = -10;
    if (h.includes("s")) base.bottom = -10;
    if (h.includes("w")) base.left = -10;
    if (h.includes("e")) base.right = -10;
    if (h === "n" || h === "s") { base.left = "50%"; base.marginLeft = -9; }
    if (h === "e" || h === "w") { base.top = "50%"; base.marginTop = -9; }
    return base;
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col">
      <div className="flex items-center justify-between p-3 bg-card border-b shrink-0">
        <h3 className="font-semibold text-foreground text-sm">Editar imagem</h3>
        <button onClick={onCancel} className="p-2 rounded-lg hover:bg-muted text-foreground">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden flex items-center justify-center p-3">
        <div
          className="relative inline-block"
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <img
            ref={imgRef}
            src={workingSrc}
            alt="Editar"
            draggable={false}
            onLoad={() => cropMode && resetBox()}
            style={{
              display: "block",
              maxHeight: "calc(100dvh - 188px)",
              maxWidth: "calc(100vw - 24px)",
              objectFit: "contain",
              userSelect: "none",
            }}
          />
          {cropMode && box.w > 0 && (
            <>
              {/* dark overlay using box-shadow */}
              <div
                onPointerDown={(e) => onPointerDown(e, "move")}
                style={{
                  position: "absolute",
                  left: box.x,
                  top: box.y,
                  width: box.w,
                  height: box.h,
                  border: "2px solid hsl(var(--primary))",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                  cursor: "move",
                  touchAction: "none",
                  zIndex: 1,
                }}
              >
                {HANDLES.map((h) => (
                  <div
                    key={h}
                    onPointerDown={(e) => onPointerDown(e, h)}
                    style={handleStyle(h)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-card border-t p-3 space-y-3 shrink-0">
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => applyRotation(-90)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium text-foreground hover:bg-muted transition"
          >
            <RotateCcw size={16} /> -90°
          </button>
          <button
            onClick={() => applyRotation(90)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium text-foreground hover:bg-muted transition"
          >
            <RotateCw size={16} /> +90°
          </button>
          <button
            onClick={() => setCropMode((c) => !c)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition ${
              cropMode ? "bg-primary text-primary-foreground border-primary" : "text-foreground hover:bg-muted"
            }`}
          >
            <CropIcon size={16} /> {cropMode ? "Recortando" : "Recortar"}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-muted-foreground hover:bg-muted transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
          >
            <Check size={16} /> {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
};
