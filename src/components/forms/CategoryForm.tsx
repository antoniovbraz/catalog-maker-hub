import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, Save, X, AlertCircle } from '@/components/ui/icons';
import { useCreateCategory, useUpdateCategory } from "@/hooks/useCategories";
import { CategoryType, CategoryFormData } from "@/types/categories";

import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { useCollapsibleSection } from "@/hooks/useCollapsibleSection";

interface CategoryFormProps {
  onCancel?: () => void;
  editingCategory?: CategoryType | null;
}

export const CategoryForm = ({ onCancel, editingCategory }: CategoryFormProps = {}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: ""
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<CategoryFormData>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof CategoryFormData, boolean>>>({});

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  // Validação em tempo real
  const validateField = (name: keyof CategoryFormData, value: string) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'Nome é obrigatório';
        } else if (value.length < 2) {
          newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
        } else {
          delete newErrors.name;
        }
        break;
      default:
        delete newErrors[name];
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (name: keyof CategoryFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos antes de enviar
    const isValid = validateField('name', formData.name);
    
    if (!isValid) {
      toast({
        title: "Erro de validação",
        description: "Corrija os erros no formulário antes de continuar",
        variant: "destructive"
      });
      return;
    }
    
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData }, {
        onSuccess: () => {
          resetForm();
          toast({
            title: "Sucesso",
            description: "Categoria atualizada com sucesso!"
          });
        }
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          resetForm();
          toast({
            title: "Sucesso",
            description: "Categoria criada com sucesso!"
          });
        }
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setEditingId(null);
    setErrors({});
    setTouched({});
  };

  // Efeito para preencher formulário quando editingCategory for passado
  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        description: editingCategory.description || ""
      });
      setEditingId(editingCategory.id);
      setErrors({});
      setTouched({});
    } else {
      resetForm();
    }
  }, [editingCategory]);

  const optionalFields = useCollapsibleSection({ 
    storageKey: 'categories-optional-fields', 
    defaultOpen: false 
  });

  return (
    <Card className="border-border/50">
      <CardHeader className="bg-card">
        <CardTitle className="flex items-center gap-2 text-xl">
          <FolderOpen className="size-6" />
          {editingId ? "Editar Categoria" : "Nova Categoria"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="border-b border-border pb-2 text-lg font-semibold text-foreground">
              Informações da Categoria
            </h3>
            
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Nome *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Ex: Eletrônicos, Casa e Decoração..."
                className={cn(
                  "mt-1",
                  errors.name && touched.name ? "border-destructive focus-visible:ring-destructive" : ""
                )}
                required
              />
              {errors.name && touched.name && (
                <div className="mt-1 flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="size-3" />
                  {errors.name}
                </div>
              )}
            </div>
          </div>

          {/* Campo Opcional */}
          <CollapsibleCard
            title="Campo Opcional"
            icon={<FolderOpen className="size-4" />}
            isOpen={optionalFields.isOpen}
            onToggle={optionalFields.toggle}
          >
            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Descrição detalhada da categoria..."
                className="mt-1 min-h-[80px]"
              />
            </div>
          </CollapsibleCard>

          {/* Botões de Ação */}
          <div className="flex gap-3 border-t border-border pt-4">
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="h-11 flex-1"
            >
              <Save className="mr-2 size-4" />
              {editingId ? "Atualizar Categoria" : "Criar Categoria"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                resetForm();
                onCancel?.();
              }}
              className="h-11 min-w-[120px]"
            >
              <X className="mr-2 size-4" />
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};