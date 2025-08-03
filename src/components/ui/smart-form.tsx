import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FormSection {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  required?: boolean;
}

interface SmartFormProps {
  title: string;
  description?: string;
  sections: FormSection[];
  isEditing?: boolean;
  isDirty?: boolean;
  isSubmitting?: boolean;
  onSubmit?: (e: React.FormEvent) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  className?: string;
}

export function SmartForm({
  title,
  description,
  sections,
  isEditing = false,
  isDirty = false,
  isSubmitting = false,
  onSubmit,
  onCancel,
  submitLabel = "Salvar",
  cancelLabel = "Cancelar",
  className
}: SmartFormProps) {
  const editingLabel = isEditing ? "Editando" : "Novo";
  const hasRequiredSections = sections.some(section => section.required);

  return (
    <Card className={cn("shadow-card", className)}>
      <CardHeader className="bg-card">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground flex items-center gap-2">
              {title}
              {isEditing && <Badge variant="secondary">{editingLabel}</Badge>}
            </CardTitle>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          
          {isDirty && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Alterações não salvas</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-lg">
        <form onSubmit={onSubmit} className="space-y-lg">
          {sections.map((section, index) => (
            <div key={section.id} className="space-y-md">
              {/* Section Header */}
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                {section.icon && (
                  <div className="p-1.5 bg-primary/10 rounded text-primary">
                    {section.icon}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    {section.title}
                    {section.required && (
                      <Badge variant="outline" className="text-xs">
                        Obrigatório
                      </Badge>
                    )}
                  </h3>
                  {section.description && (
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Section Content */}
              <div className="pl-6">
                {section.children}
              </div>
              
              {/* Divider between sections */}
              {index < sections.length - 1 && (
                <hr className="border-border my-6" />
              )}
            </div>
          ))}
          
          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isSubmitting}
              >
                <X className="w-4 h-4 mr-2" />
                {cancelLabel}
              </Button>
            )}
            
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? "Salvando..." : submitLabel}
            </Button>
          </div>
          
          {hasRequiredSections && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              * Campos obrigatórios devem ser preenchidos
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}