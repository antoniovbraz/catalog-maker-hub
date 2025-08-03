import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FolderOpen, Save, X, AlertCircle } from "lucide-react";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories";
import { CategoryType, CategoryFormData } from "@/types/categories";
import { DataTable, Column } from "@/components/common/DataTable";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export const CategoryForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: ""
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<CategoryFormData>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof CategoryFormData, boolean>>>({});

  const { data: categories = [], isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  // Validação em tempo real
  const validateField = (name: keyof CategoryFormData, value: any) => {
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

  const handleInputChange = (name: keyof CategoryFormData, value: any) => {
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

  const handleEdit = (category: CategoryType) => {
    setFormData({
      name: category.name,
      description: category.description || ""
    });
    setEditingId(category.id);
    setErrors({});
    setTouched({});
  };

  // Configurar colunas da tabela
  const columns: Column<CategoryType>[] = [
    {
      key: 'name',
      header: 'Nome',
      render: (value) => (
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{value as string}</span>
        </div>
      )
    },
    {
      key: 'description',
      header: 'Descrição',
      render: (value) => (
        <span className="text-muted-foreground">
          {value as string || "Sem descrição"}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-8">
      {/* Form Section */}
      <Card className="shadow-form border border-border/50">
        <CardHeader className="bg-gradient-primary text-white rounded-t-lg">
          <CardTitle className="text-xl flex items-center gap-2">
            <FolderOpen className="w-6 h-6" />
            {editingId ? "✏️ Editar Categoria" : "➕ Nova Categoria"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seção de Informações */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                📂 Informações da Categoria
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
                  <div className="flex items-center gap-1 mt-1 text-sm text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    {errors.name}
                  </div>
                )}
              </div>
              
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
            </div>
            
            <Separator />

            {/* Botões de Ação */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 h-11 bg-gradient-primary hover:bg-gradient-primary/90 shadow-hover"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingId ? "💾 Atualizar Categoria" : "➕ Criar Categoria"}
              </Button>
              {editingId && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                  className="h-11 min-w-[120px] shadow-form"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Categorias */}
      <DataTable
        data={categories}
        columns={columns}
        onEdit={handleEdit}
        onDelete={(category) => deleteMutation.mutate(category.id)}
        loading={isLoading}
        title="📂 Categorias Cadastradas"
        searchPlaceholder="Buscar categorias..."
        emptyMessage="Nenhuma categoria cadastrada"
        emptyDescription="Crie sua primeira categoria usando o formulário acima"
      />
    </div>
  );
};