import { useState } from "react";
import { CustomModal } from "./CustomModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CustomModalExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSave = async () => {
    setIsLoading(true);
    
    // Simular uma operação assíncrona
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log("Dados salvos:", formData);
    setIsLoading(false);
    setIsOpen(false);
    
    // Reset form
    setFormData({ name: "", email: "", message: "" });
  };

  const handleCancel = () => {
    setFormData({ name: "", email: "", message: "" });
    setIsOpen(false);
  };

  return (
    <div className="p-6">
      <Button onClick={() => setIsOpen(true)}>
        Abrir Modal de Exemplo
      </Button>

      <CustomModal
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Adicionar Novo Contato"
        description="Preencha as informações abaixo para adicionar um novo contato."
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={isLoading}
        size="md"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              placeholder="Digite o nome completo"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="Digite o e-mail"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              placeholder="Digite uma mensagem opcional"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={4}
            />
          </div>
        </div>
      </CustomModal>
    </div>
  );
}