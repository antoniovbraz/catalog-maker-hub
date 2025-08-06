import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useCreateAssistant, useUpdateAssistant } from "@/hooks/useAssistants";
import type { Assistant, AssistantFormData } from "@/types/assistants";
import { AVAILABLE_MODELS, MARKETPLACE_OPTIONS, MODE_OPTIONS } from "@/types/assistants";
import { useEffect, useState } from "react";

const assistantSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  marketplace: z.enum(['mercado_livre', 'shopee', 'instagram'], {
    required_error: "Marketplace é obrigatório",
  }),
  mode: z.enum(['quick', 'strategic'], {
    required_error: "Modo é obrigatório",
  }),
  model: z.string().min(1, "Modelo é obrigatório"),
  instructions: z.string().min(50, "Instruções devem ter pelo menos 50 caracteres"),
});

interface AssistantFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistant?: Assistant | null;
  onSuccess?: () => void;
}

export function AssistantForm({ open, onOpenChange, assistant, onSuccess }: AssistantFormProps) {
  const [characterCount, setCharacterCount] = useState(0);
  const createMutation = useCreateAssistant();
  const updateMutation = useUpdateAssistant();

  const isEditing = !!assistant;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const form = useForm<AssistantFormData>({
    resolver: zodResolver(assistantSchema),
    defaultValues: {
      name: "",
      marketplace: "mercado_livre",
      mode: "quick",
      model: "gpt-4o",
      instructions: "",
    },
  });

  // Resetar form quando abrir/fechar ou quando assistant mudar
  useEffect(() => {
    if (open) {
      if (assistant) {
        form.reset({
          name: assistant.name,
          marketplace: assistant.marketplace,
          mode: assistant.mode,
          model: assistant.model,
          instructions: assistant.instructions,
        });
        setCharacterCount(assistant.instructions.length);
      } else {
        form.reset({
          name: "",
          marketplace: "mercado_livre",
          mode: "quick",
          model: "gpt-4o",
          instructions: "",
        });
        setCharacterCount(0);
      }
    }
  }, [open, assistant, form]);

  // Monitorar mudanças no campo instructions para atualizar contador
  const watchInstructions = form.watch("instructions");
  useEffect(() => {
    setCharacterCount(watchInstructions?.length || 0);
  }, [watchInstructions]);

  const onSubmit = async (data: AssistantFormData) => {
    try {
      if (isEditing && assistant) {
        await updateMutation.mutateAsync({ id: assistant.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      // Error handling é feito pelos hooks
      console.error('Erro no formulário:', error);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Assistente IA' : 'Novo Assistente IA'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize as configurações do assistente IA.' 
              : 'Crie um novo assistente IA para um marketplace específico.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="grid md:grid-cols-[2fr_3fr] gap-6 space-y-0">
                  <FormLabel>Nome do Assistente</FormLabel>
                  <div className="space-y-1">
                    <FormControl>
                      <Input
                        placeholder="Ex: Assistente Mercado Livre Premium"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Nome descritivo para identificar o assistente.
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="marketplace"
              render={({ field }) => (
                <FormItem className="grid md:grid-cols-[2fr_3fr] gap-6 space-y-0">
                  <FormLabel>Marketplace</FormLabel>
                  <div className="space-y-1">
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o marketplace" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MARKETPLACE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Marketplace para o qual este assistente será usado.
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mode"
              render={({ field }) => (
                <FormItem className="grid md:grid-cols-[2fr_3fr] gap-6 space-y-0">
                  <FormLabel>Modo</FormLabel>
                  <div className="space-y-1">
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o modo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MODE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Modo de geração do assistente.
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem className="grid md:grid-cols-[2fr_3fr] gap-6 space-y-0">
                  <FormLabel>Modelo OpenAI</FormLabel>
                  <div className="space-y-1">
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o modelo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AVAILABLE_MODELS.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Modelo da OpenAI que será usado pelo assistente.
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem className="grid md:grid-cols-[2fr_3fr] gap-6 space-y-0">
                  <FormLabel>Instruções</FormLabel>
                  <div className="space-y-1">
                    <FormControl>
                      <Textarea
                        placeholder="Descreva detalhadamente como o assistente deve se comportar..."
                        className="min-h-[120px] resize-none"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Instruções detalhadas para o comportamento do assistente. ({characterCount} caracteres, mínimo 50)
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
                {isEditing ? 'Atualizar' : 'Criar'} Assistente
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}