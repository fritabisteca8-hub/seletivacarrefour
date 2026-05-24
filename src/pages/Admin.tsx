import { useState, useEffect, useCallback } from "react";
import { getSubmissions, deleteSubmission, deleteAllSubmissions, deleteSubmissions, updateSubmissionImage, Submission } from "@/lib/submissions";
import { Download, LogOut, FileText, CreditCard, Eye, Loader2, Trash2, Sun, Moon, KeyRound, Users, BarChart3, Pencil } from "lucide-react";
import { ImageEditor } from "@/components/ImageEditor";
import { getOnlineCount, getTotalVisits } from "@/lib/visits";
import { Input } from "@/components/ui/input";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// localStorage-based admin password functions
const isFirstAccess = () => !localStorage.getItem("admin_pass");
const getAdminPass = () => localStorage.getItem("admin_pass") || "";

const dataUrlToBlob = (dataUrl: string): Blob => {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
  return new Blob([array], { type: mime });
};

const downloadZip = async (sub: Submission) => {
  const zip = new JSZip();
  const folderName = sub.name.replace(/\s+/g, "_");
  const folder = zip.folder(folderName)!;

  folder.file("frente.jpg", dataUrlToBlob(sub.front));
  folder.file("verso.jpg", dataUrlToBlob(sub.back));
      folder.file("dados.txt", sub.name);
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${folderName}.zip`);
};

const SetupPassword = ({ onSetup }: { onSetup: () => void }) => {
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPass.length < 4) { setError("A senha deve ter pelo menos 4 caracteres"); return; }
    if (newPass !== confirmPass) { setError("As senhas não coincidem"); return; }
    localStorage.setItem("admin_pass", newPass);
    toast.success("Senha criada com sucesso!");
    onSetup();
  };

  return (
    <div className="dark min-h-screen bg-background flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-xs bg-card rounded-2xl shadow-lg border p-6 space-y-5">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <KeyRound size={20} className="text-primary" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Primeiro Acesso</h1>
          <p className="text-muted-foreground text-xs mt-1">Crie uma senha para acessar o painel</p>
        </div>
        <div className="space-y-3">
          <Input type="password" placeholder="Nova senha" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
          <Input type="password" placeholder="Confirmar senha" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
        </div>
        {error && <p className="text-destructive text-xs text-center">{error}</p>}
        <button type="submit" className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition">
          Criar Senha
        </button>
      </form>
    </div>
  );
};

const AdminLogin = ({ onLogin }: { onLogin: () => void }) => {
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === getAdminPass()) {
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="dark min-h-screen bg-background flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="w-full max-w-xs bg-card rounded-2xl shadow-lg border p-6 space-y-5">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-primary font-bold text-lg">C</span>
          </div>
          <h1 className="text-lg font-bold text-foreground">Painel</h1>
          <p className="text-muted-foreground text-xs mt-1">Acesso restrito</p>
        </div>
        <div className="space-y-2">
          <Input
            type="password"
            placeholder="Senha de acesso"
            value={pass}
            onChange={(e) => { setPass(e.target.value); setError(false); }}
          />
          {error && <p className="text-accent text-xs">Senha incorreta</p>}
        </div>
        <button type="submit" className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition">
          Entrar
        </button>
      </form>
    </div>
  );
};

const ImagePreview = ({ src, onClose }: { src: string; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
    <img src={src} alt="Preview" className="max-w-full max-h-full rounded-lg" />
  </div>
);

const SubmissionCard = ({ sub, onDelete, onUpdate, selected, onToggleSelect }: { sub: Submission; onDelete: () => void; onUpdate: () => void; selected: boolean; onToggleSelect: () => void }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [editing, setEditing] = useState<"front" | "back" | null>(null);
  const [extractedName, setExtractedName] = useState<string | null>(sub.extractedName || null);
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    if (!extractedName && !extracting) {
      extractName();
    }
  }, []);

  const extractName = async () => {
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-name", {
        body: { imageBase64: sub.front },
      });
      if (error) throw error;
      if (data?.name && data.name !== "NAO_IDENTIFICADO") {
        setExtractedName(data.name);
        // Save to localStorage too
        const subs = JSON.parse(localStorage.getItem("carrefour_submissions") || "[]");
        const found = subs.find((s: any) => s.id === sub.id);
        if (found) {
          found.extractedName = data.name;
          localStorage.setItem("carrefour_submissions", JSON.stringify(subs));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExtracting(false);
    }
  };

  const handleDownload = async () => {
    const nameToUse = extractedName || sub.name;
    const zip = new JSZip();
    const folder = zip.folder("1")!;

    folder.file("frente.jpg", dataUrlToBlob(sub.front));
    folder.file("verso.jpg", dataUrlToBlob(sub.back));
    folder.file("dados.txt", extractedName || sub.name);

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${nameToUse.replace(/\s+/g, "_")}.zip`);
  };

  return (
    <>
      {preview && <ImagePreview src={preview} onClose={() => setPreview(null)} />}
      {editing && (
        <ImageEditor
          src={editing === "front" ? sub.front : sub.back}
          onCancel={() => setEditing(null)}
          onSave={(dataUrl) => {
            updateSubmissionImage(sub.id, editing, dataUrl);
            setEditing(null);
            onUpdate();
            toast.success("Imagem salva");
          }}
        />
      )}
      <div
        onClick={onToggleSelect}
        className={`bg-card rounded-xl border p-5 space-y-4 cursor-pointer transition ${selected ? "ring-2 ring-primary" : "hover:border-primary/40"}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => {}}
              className="mt-1.5 w-4 h-4 accent-primary pointer-events-none"
            />
            <div>
              <h3 className="font-semibold text-foreground">{sub.name}</h3>
              {extractedName && (
                <p className="text-xs text-green-600 font-medium mt-0.5">✅ IA: {extractedName}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {sub.docType === "cnh" ? <CreditCard size={12} /> : <FileText size={12} />}
                  {sub.docType.toUpperCase()}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(sub.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition" title="Apagar">
            <Trash2 size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Frente</p>
            <div className="relative group rounded-lg overflow-hidden border aspect-[3/2] bg-muted">
              <img src={sub.front} alt="Frente" className="w-full h-full object-contain" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button onClick={() => setPreview(sub.front)} className="p-2 bg-card rounded-full shadow" title="Ver"><Eye size={14} className="text-foreground" /></button>
                <button onClick={() => setEditing("front")} className="p-2 bg-card rounded-full shadow" title="Editar"><Pencil size={14} className="text-foreground" /></button>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Verso</p>
            <div className="relative group rounded-lg overflow-hidden border aspect-[3/2] bg-muted">
              <img src={sub.back} alt="Verso" className="w-full h-full object-contain" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button onClick={() => setPreview(sub.back)} className="p-2 bg-card rounded-full shadow" title="Ver"><Eye size={14} className="text-foreground" /></button>
                <button onClick={() => setEditing("back")} className="p-2 bg-card rounded-full shadow" title="Editar"><Pencil size={14} className="text-foreground" /></button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {extracting && (
            <div className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium text-muted-foreground">
              <Loader2 size={16} className="animate-spin" /> Extraindo nome...
            </div>
          )}
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium text-primary hover:bg-primary/5 transition"
          >
            <Download size={16} /> Baixar Pasta
          </button>
        </div>
      </div>
    </>
  );
};

const ChangePasswordModal = ({ onClose }: { onClose: () => void }) => {
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (currentPass !== getAdminPass()) { setError("Senha atual incorreta"); return; }
    if (newPass.length < 4) { setError("A nova senha deve ter pelo menos 4 caracteres"); return; }
    if (newPass !== confirmPass) { setError("As senhas não coincidem"); return; }
    localStorage.setItem("admin_pass", newPass);
    toast.success("Senha alterada com sucesso!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="w-full max-w-xs bg-card rounded-2xl shadow-lg border p-6 space-y-4">
        <div className="text-center">
          <KeyRound size={24} className="mx-auto text-primary mb-2" />
          <h2 className="font-bold text-foreground">Trocar Senha</h2>
        </div>
        <div className="space-y-3">
          <Input type="password" placeholder="Senha atual" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} />
          <Input type="password" placeholder="Nova senha" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
          <Input type="password" placeholder="Confirmar nova senha" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
        </div>
        {error && <p className="text-destructive text-xs text-center">{error}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-muted-foreground hover:bg-muted transition">Cancelar</button>
          <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition">Salvar</button>
        </div>
      </form>
    </div>
  );
};

const Admin = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [darkMode, setDarkMode] = useState(true);
  const [showChangePass, setShowChangePass] = useState(false);
  const [activeTab, setActiveTab] = useState<"rg" | "cnh">("rg");
  const [onlineCount, setOnlineCount] = useState(0);
  const [totalVisits, setTotalVisits] = useState(0);

  useEffect(() => {
    if (!loggedIn) return;
    setSubmissions(getSubmissions());
    const updateCounters = async () => {
      const [online, total] = await Promise.all([getOnlineCount(), getTotalVisits()]);
      setOnlineCount(online);
      setTotalVisits(total);
    };
    void updateCounters();
    const interval = setInterval(() => {
      void updateCounters();
    }, 10000);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "carrefour_submissions") {
        setSubmissions(getSubmissions());
      }
    };
    window.addEventListener("storage", onStorage);

    const subInterval = setInterval(() => {
      setSubmissions(getSubmissions());
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(subInterval);
      window.removeEventListener("storage", onStorage);
    };
  }, [loggedIn]);

  const refresh = () => {
    setSubmissions(getSubmissions());
    setSelected(new Set());
  };

  const handleDelete = (id: string) => {
    deleteSubmission(id);
    refresh();
    toast.success("Envio apagado");
  };

  const handleDeleteAll = () => {
    if (!confirm("Apagar TODOS os envios?")) return;
    deleteAllSubmissions();
    refresh();
    toast.success("Todos os envios apagados");
  };

  const handleDeleteSelected = () => {
    if (selected.size === 0) return;
    if (!confirm(`Apagar ${selected.size} envio(s) selecionado(s)?`)) return;
    deleteSubmissions(Array.from(selected));
    refresh();
    toast.success(`${selected.size} envio(s) apagado(s)`);
  };

  const handleDownloadSelected = async () => {
    if (selected.size === 0) return;
    const selectedSubs = submissions.filter((s) => selected.has(s.id));
    const zip = new JSZip();

    for (let i = 0; i < selectedSubs.length; i++) {
      const sub = selectedSubs[i];
      const folder = zip.folder(`${i + 1}`)!;
      folder.file("frente.jpg", dataUrlToBlob(sub.front));
      folder.file("verso.jpg", dataUrlToBlob(sub.back));
      folder.file("dados.txt", sub.name);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `documentos_selecionados_${selectedSubs.length}.zip`);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!loggedIn && isFirstAccess()) return <SetupPassword onSetup={() => setLoggedIn(true)} />;
  if (!loggedIn) return <AdminLogin onLogin={() => setLoggedIn(true)} />;

  return (
    <div className={`${darkMode ? "dark" : ""} min-h-screen bg-background`}>
      {showChangePass && <ChangePasswordModal onClose={() => setShowChangePass(false)} />}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-foreground">Painel</h1>
            <p className="text-xs text-muted-foreground">{submissions.length} envio(s) — RG: {submissions.filter(s => s.docType === "rg").length} | CNH: {submissions.filter(s => s.docType === "cnh").length}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs font-medium text-green-500">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {onlineCount} online
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <BarChart3 size={12} />
                {totalVisits} acessos
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowChangePass(true)} className="text-muted-foreground hover:text-foreground transition" title="Trocar senha">
              <KeyRound size={18} />
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="text-muted-foreground hover:text-foreground transition">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setLoggedIn(false)} className="text-muted-foreground hover:text-foreground transition">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {submissions.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 pt-4 flex flex-wrap gap-2">
          <button
            onClick={() => {
              if (selected.size === submissions.length) {
                setSelected(new Set());
              } else {
                setSelected(new Set(submissions.map((s) => s.id)));
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium text-foreground hover:bg-muted transition"
          >
            {selected.size === submissions.length ? "Desmarcar todos" : "Selecionar todos"}
          </button>
          {selected.size > 0 && (
            <>
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-destructive text-destructive text-xs font-medium hover:bg-destructive/10 transition"
              >
                <Trash2 size={14} /> Apagar selecionados ({selected.size})
              </button>
              <button
                onClick={handleDownloadSelected}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-primary text-xs font-medium hover:bg-primary/5 transition"
              >
                <Download size={14} /> Baixar selecionados ({selected.size})
              </button>
            </>
          )}
          <button
            onClick={handleDeleteAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-destructive text-destructive text-xs font-medium hover:bg-destructive/10 transition ml-auto"
          >
            <Trash2 size={14} /> Apagar todos
          </button>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {submissions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">Nenhum envio recebido ainda.</p>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("rg")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === "rg" ? "bg-primary text-primary-foreground" : "border text-muted-foreground hover:text-foreground hover:border-primary/40"}`}
              >
                <FileText size={16} /> RG
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === "rg" ? "bg-primary-foreground/20" : "bg-muted"}`}>
                  {submissions.filter(s => s.docType === "rg").length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("cnh")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${activeTab === "cnh" ? "bg-primary text-primary-foreground" : "border text-muted-foreground hover:text-foreground hover:border-primary/40"}`}
              >
                <CreditCard size={16} /> CNH
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === "cnh" ? "bg-primary-foreground/20" : "bg-muted"}`}>
                  {submissions.filter(s => s.docType === "cnh").length}
                </span>
              </button>
            </div>

            <div className="space-y-4">
              {submissions.filter(s => s.docType === activeTab).length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-sm">Nenhum {activeTab.toUpperCase()} enviado ainda.</p>
                </div>
              ) : (
                submissions.filter(s => s.docType === activeTab).map((sub) => (
                  <SubmissionCard
                    key={sub.id}
                    sub={sub}
                    selected={selected.has(sub.id)}
                    onToggleSelect={() => toggleSelect(sub.id)}
                    onDelete={() => handleDelete(sub.id)}
                    onUpdate={refresh}
                  />
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Admin;
