import { useState, useEffect } from "react";
import { Tag, FileText } from "lucide-react";
import { SmartForm } from "@/components/ui/smart-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCategory, useUpdateCategory } from "@/hooks/useCategories";
import { CategoryType } from "@/types/categories";

interface CategoryFormEnhancedProps {
  editingCategory?: CategoryType | null;
  onCancelEdit?: () => void;
}

export function CategoryFormEnhanced({ 
  editingCategory, 
  onCancelEdit 
}: CategoryFormEnhancedProps) {
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [isDirty, setIsDirty] = useState(false);

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const isEditing = !!editingCategory;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        description: editingCategory.description || ""
      });
      setIsDirty(false);
    } else {
      setFormData({ name: "", description: "" });
      setIsDirty(false);
    }
  }, [editingCategory]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formData }, {
        onSuccess: () => {
          setIsDirty(false);
          onCancelEdit?.();
        }
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          setFormData({ name: "", description: "" });
          setIsDirty(false);
        }
      });
    }
  };

  const sections = [
    {
      id: "basic",
      title: "Informações da Categoria",
      icon: <Tag className="w-4 h-4" />,
      required: true,
      children: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
          </div>
        </div>
      )
    }
  ];

  return (
    <SmartForm
      title={isEditing ? "Editar Categoria" : "Nova Categoria"}
      sections={sections}
      isEditing={isEditing}
      isDirty={isDirty}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      onCancel={isEditing ? () => onCancelEdit?.() : undefined}
    />
  );
}