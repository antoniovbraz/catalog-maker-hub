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
            <CardTitle className="flex items-center gap-2 text-foreground">
              {title}
              {isEditing && <Badge variant="secondary">{editingLabel}</Badge>}
            </CardTitle>
            {description && (
              <p className="mt-1 text-muted-foreground">{description}</p>
            )}
          </div>
          
          {isDirty && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="size-4" />
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
              <div className="flex items-center gap-2 border-b border-border pb-2">
                {section.icon && (
                  <div className="rounded bg-primary/10 p-1.5 text-primary">
                    {section.icon}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="flex items-center gap-2 font-semibold text-foreground">
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
                <hr className="my-6 border-border" />
              )}
            </div>
          ))}
          
          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isSubmitting}
              >
                <X className="mr-2 size-4" />
                {cancelLabel}
              </Button>
            )}
            
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              <Save className="mr-2 size-4" />
              {isSubmitting ? "Salvando..." : submitLabel}
            </Button>
          </div>
          
          {hasRequiredSections && (
            <p className="pt-2 text-center text-xs text-muted-foreground">
              * Campos obrigatórios devem ser preenchidos
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}