import { useState, useRef } from "react";
import { Upload, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocSideProps {
  label: string;
  image: string | null;
  onUpload: (file: File) => void;
  onClear: () => void;
}

const DocSide = ({ label, image, onUpload, onClear }: DocSideProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex-1">
      <p className="text-sm font-semibold text-card-foreground mb-2">{label}</p>
      <div
        className="relative border-2 border-dashed rounded-lg aspect-[3/2] flex items-center justify-center bg-muted/50 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => !image && inputRef.current?.click()}
      >
        {image ? (
          <>
            <img src={image} alt={label} className="w-full h-full object-contain p-2" />
            <button
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="absolute top-2 right-2 bg-card rounded-full p-1.5 shadow border hover:bg-muted transition"
            >
              <RotateCcw size={14} className="text-muted-foreground" />
            </button>
          </>
        ) : (
          <div className="text-center p-4">
            <Upload size={28} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">Clique para enviar</p>
            <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG ou PDF</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
          }}
        />
      </div>
    </div>
  );
};

const DocumentFrame = () => {
  const [front, setFront] = useState<string | null>(null);
  const [back, setBack] = useState<string | null>(null);

  const handleUpload = (setter: (v: string | null) => void) => (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setter(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <DocSide label="Frente do Documento" image={front} onUpload={handleUpload(setFront)} onClear={() => setFront(null)} />
        <DocSide label="Verso do Documento" image={back} onUpload={handleUpload(setBack)} onClear={() => setBack(null)} />
      </div>
      {front && back && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
          <p className="text-primary text-sm font-medium">✓ Documento completo — frente e verso enviados</p>
        </div>
      )}
      {(!front || !back) && (
        <p className="text-xs text-muted-foreground text-center">
          Envie a frente e o verso do seu RG, CNH ou outro documento com foto.
        </p>
      )}
    </div>
  );
};

export default DocumentFrame;
