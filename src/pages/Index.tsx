import { useState, useRef, useEffect } from "react";
import { Upload, FileText, CreditCard, Camera, Trash2 } from "lucide-react";
import carrefourLogo from "@/assets/carrefour-logo.png";
import { saveSubmission } from "@/lib/submissions";
import { startHeartbeat } from "@/lib/visits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DocSide = ({ label, image, onUpload, onClear }: { label: string; image: string | null; onUpload: (f: File) => void; onClear: () => void }) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onUpload(file);
    event.target.value = "";
  };

  return (
    <div className="flex-1">
      <p className="text-sm font-semibold text-foreground mb-2">{label} <span className="text-accent">*</span></p>
      <div className="relative border-2 border-dashed border-primary/30 rounded-xl aspect-[3/2] flex items-center justify-center bg-primary/5 overflow-hidden">
        {image ? (
          <img src={image} alt={label} className="w-full h-full object-contain p-2" />
        ) : (
          <div className="flex gap-3">
            <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex flex-col items-center gap-1 text-primary hover:opacity-70 transition">
              <Camera size={22} />
              <span className="text-[10px] font-medium">Câmera</span>
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition">
              <Upload size={22} />
              <span className="text-[10px] font-medium">Arquivo</span>
            </button>
          </div>
        )}
        {image && (
          <div className="absolute bottom-1 right-1">
            <button type="button" onClick={onClear} className="bg-card rounded-full p-1.5 shadow border text-destructive hover:bg-destructive/10 transition">
              <Trash2 size={14} />
            </button>
          </div>
        )}
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
    </div>
  );
};

const SuccessScreen = () => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4">
    <div className="w-full max-w-sm bg-card rounded-2xl shadow-lg border p-8 text-center space-y-5">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary text-3xl">✓</span>
        </div>
      </div>
      <h2 className="text-xl font-bold text-foreground">Documento Enviado!</h2>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Recebemos seu documento com sucesso. Nossa equipe já está analisando suas informações e em breve entraremos em contato com os próximos passos do processo seletivo.
      </p>
      <div className="bg-muted rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-foreground">📋 O que acontece agora?</p>
        <ul className="text-xs text-muted-foreground space-y-1 text-left">
          <li>• Análise do documento em até 48h úteis</li>
          <li>• Você receberá um e-mail com a confirmação</li>
          <li>• Fique atento ao seu telefone para contato</li>
        </ul>
      </div>
      <p className="text-xs text-muted-foreground">Obrigado por querer fazer parte do <strong className="text-foreground">Carrefour</strong>! 💙</p>
    </div>
  </div>
);

const Index = () => {
  const [front, setFront] = useState<string | null>(null);
  const [back, setBack] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [docType, setDocType] = useState<"cnh" | "rg">("rg");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    return startHeartbeat();
  }, []);

  const handleUpload = (setter: (v: string | null) => void) => (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setter(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  if (submitted) return <SuccessScreen />;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-lg border p-6 space-y-6">
        <div className="flex justify-center">
          <img src={carrefourLogo} alt="Carrefour" width={80} height={80} />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">Carrefour - Envio de Documento</h1>
          <p className="text-sm text-muted-foreground mt-1">Processo seletivo para novas vagas de trabalho</p>
        </div>

        <div className="bg-primary/5 rounded-xl p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Para dar continuidade ao seu cadastro no processo seletivo do <strong className="text-foreground">Carrefour</strong>, envie a foto do seu documento (frente e verso). Suas informações serão utilizadas exclusivamente para fins de admissão.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Cargo desejado</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">💼</span>
            <Input id="name" placeholder="Ex: Repositor, Caixa, Padeiro..." value={name} onChange={(e) => setName(e.target.value)} className="pl-10" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tipo de documento</Label>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setDocType("rg")} className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition ${docType === "rg" ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground hover:border-primary/30"}`}>
              <FileText size={16} /> RG
            </button>
            <button onClick={() => setDocType("cnh")} className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition ${docType === "cnh" ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground hover:border-primary/30"}`}>
              <CreditCard size={16} /> CNH
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <DocSide label="Frente" image={front} onUpload={handleUpload(setFront)} onClear={() => setFront(null)} />
          <DocSide label="Verso" image={back} onUpload={handleUpload(setBack)} onClear={() => setBack(null)} />
        </div>

        <button
          onClick={() => {
            if (front && back && name.trim()) {
              saveSubmission({ name: name.trim(), docType, front, back });
              setSubmitted(true);
            }
          }}
          disabled={!front || !back || !name.trim()}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Enviar Documento
        </button>
      </div>

      <footer className="w-full max-w-sm px-4 py-6 text-center space-y-2">
        <p className="text-[11px] text-muted-foreground">
          CARREFOUR COMÉRCIO E INDÚSTRIA LTDA — CNPJ: 45.543.915/0001-81
        </p>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Ao enviar seus documentos, você concorda com nossa{" "}
          <a href="https://www.carrefour.com.br/politica-de-privacidade" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:opacity-80">
            Política de Privacidade
          </a>. Seus dados serão utilizados exclusivamente para fins de recrutamento e seleção, conforme a LGPD (Lei nº 13.709/2018).
        </p>
      </footer>
    </div>
  );
};

export default Index;
