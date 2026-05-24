import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const ApplicationForm = () => {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-primary text-2xl">✓</span>
        </div>
        <h3 className="text-xl font-bold text-card-foreground">Candidatura Enviada!</h3>
        <p className="text-muted-foreground mt-2">Entraremos em contato em breve.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
      className="space-y-5"
    >
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome Completo</Label>
          <Input id="name" placeholder="Seu nome completo" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" placeholder="seu@email.com" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" placeholder="(11) 99999-9999" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF</Label>
          <Input id="cpf" placeholder="000.000.000-00" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="position">Vaga de Interesse</Label>
        <Input id="position" placeholder="Ex: Operador de Caixa" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Sobre Você</Label>
        <Textarea id="message" placeholder="Conte um pouco sobre sua experiência..." rows={4} />
      </div>
      <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
        Enviar Candidatura
      </Button>
    </form>
  );
};

export default ApplicationForm;
