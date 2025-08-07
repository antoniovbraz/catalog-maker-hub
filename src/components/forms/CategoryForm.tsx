import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { useCollapsibleSection } from '@/hooks/useCollapsibleSection';
import { InputField, TextareaField, Form } from '@/components/ui/form';
import { FolderOpen, Save, X, Loader2, Check } from '@/components/ui/icons';
import { useCreateCategory, useUpdateCategory } from '@/hooks/useCategories';
import { CategoryType } from '@/types/categories';
import { useToast } from '@/components/ui/use-toast';

const formSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CategoryFormProps {
  onCancel?: () => void;
  editingCategory?: CategoryType | null;
}

export const CategoryForm = ({ onCancel, editingCategory }: CategoryFormProps = {}) => {
  const { toast } = useToast();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    if (editingCategory) {
      form.reset({
        name: editingCategory.name,
        description: editingCategory.description || '',
      });
      setEditingId(editingCategory.id);
    } else {
      form.reset({ name: '', description: '' });
      setEditingId(null);
    }
  }, [editingCategory, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 2000);
      form.reset({ name: '', description: '' });
      setEditingId(null);
    } catch (error) {
      // Error handling via hooks
    }
  };

  const onInvalid = () => {
    toast({
      title: 'Erro de validação',
      description: 'Corrija os erros no formulário antes de continuar',
      variant: 'destructive',
    });
  };

  const handleReset = () => {
    setIsResetting(true);
    form.reset({ name: '', description: '' });
    setEditingId(null);
    onCancel?.();
    setTimeout(() => {
      setIsResetting(false);
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 2000);
    }, 500);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const optionalFields = useCollapsibleSection({
    storageKey: 'categories-optional-fields',
    defaultOpen: false,
  });

  return (
    <Card className="border-border/50">
      <CardHeader className="bg-card">
        <CardTitle className="flex items-center gap-2 text-xl">
          <FolderOpen className="size-6" />
          {editingId ? 'Editar Categoria' : 'Nova Categoria'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, onInvalid)}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h3 className="border-b border-border pb-2 text-lg font-semibold text-foreground">
                Informações da Categoria
              </h3>

              <InputField
                control={form.control}
                name="name"
                label="Nome *"
                placeholder="Ex: Eletrônicos, Casa e Decoração..."
              />
            </div>

            <CollapsibleCard
              title="Campo Opcional"
              icon={<FolderOpen className="size-4" />}
              isOpen={optionalFields.isOpen}
              onToggle={optionalFields.toggle}
            >
              <TextareaField
                control={form.control}
                name="description"
                label="Descrição"
                placeholder="Descrição detalhada da categoria..."
              />
            </CollapsibleCard>

            <div className="flex gap-3 border-t border-border pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 flex-1"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : submitSuccess ? (
                  <Check className="mr-2 size-4" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                {editingId ? 'Atualizar Categoria' : 'Criar Categoria'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="h-11 min-w-[120px]"
              >
                {isResetting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : resetSuccess ? (
                  <Check className="mr-2 size-4" />
                ) : (
                  <X className="mr-2 size-4" />
                )}
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
