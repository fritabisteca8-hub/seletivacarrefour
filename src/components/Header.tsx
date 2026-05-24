const Header = () => (
  <header className="bg-primary shadow-lg">
    <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-accent w-10 h-10 rounded-full flex items-center justify-center">
          <span className="text-accent-foreground font-extrabold text-lg">C</span>
        </div>
        <div>
          <h1 className="text-primary-foreground font-bold text-xl tracking-tight">Carrefour</h1>
          <p className="text-primary-foreground/70 text-xs font-medium">Trabalhe Conosco</p>
        </div>
      </div>
      <nav className="hidden md:flex gap-6 text-primary-foreground/80 text-sm font-medium">
        <a href="#vagas" className="hover:text-primary-foreground transition">Vagas</a>
        <a href="#candidatura" className="hover:text-primary-foreground transition">Candidatura</a>
        <a href="#documentos" className="hover:text-primary-foreground transition">Documentos</a>
      </nav>
    </div>
  </header>
);

export default Header;
