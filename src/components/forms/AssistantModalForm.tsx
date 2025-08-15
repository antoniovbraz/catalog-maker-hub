import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateAssistant, useUpdateAssistant } from "@/hooks/useAssistants";
import type { Assistant } from "@/types/assistants";

const assistantSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  marketplace: z.enum(["mercado_livre", "shopee", "instagram"]),
  model: z.string().min(1, "Modelo é obrigatório"),
  instructions: z.string().min(10, "Instruções devem ter pelo menos 10 caracteres"),
});

type AssistantFormData = z.infer<typeof assistantSchema>;

interface AssistantModalFormProps {
  assistant?: Assistant;
  onSuccess: () => void;
  onSubmitForm: (submitFn: () => Promise<void>) => void;
}

export function AssistantModalForm({ assistant, onSuccess, onSubmitForm }: AssistantModalFormProps) {
  const [charCount, setCharCount] = useState(0);
  const isEdit = !!assistant;

  const form = useForm<AssistantFormData>({
    resolver: zodResolver(assistantSchema),
    defaultValues: {
      name: assistant?.name || "",
      marketplace: assistant?.marketplace || "mercado_livre",
      model: assistant?.model || "gpt-4o-mini",
      instructions: assistant?.instructions || "",
    },
  });

  const createAssistantMutation = useCreateAssistant();
  const updateAssistantMutation = useUpdateAssistant();

  const watchInstructions = form.watch("instructions");

  useEffect(() => {
    setCharCount(watchInstructions.length);
  }, [watchInstructions]);

  useEffect(() => {
    if (assistant) {
      form.reset({
        name: assistant.name,
        marketplace: assistant.marketplace,
        model: assistant.model,
        instructions: assistant.instructions,
      });
    } else {
      form.reset({
        name: "",
        marketplace: "mercado_livre",
        model: "gpt-4o-mini",
        instructions: "",
      });
    }
  }, [assistant, form]);

  const onSubmit = async (formData: AssistantFormData) => {
    try {
      if (isEdit) {
        await updateAssistantMutation.mutateAsync({
          id: assistant!.id,
          data: formData,
        });
      } else {
        await createAssistantMutation.mutateAsync(formData as any);
      }
      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar assistente:", error);
    }
  };

  const handleSubmit = async () => {
    return new Promise<void>((resolve, reject) => {
      form.handleSubmit(
        async (data) => {
          try {
            await onSubmit(data);
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        () => reject(new Error("Validação falhou"))
      )();
    });
  };

  // Register submit function with parent modal
  useEffect(() => {
    onSubmitForm(handleSubmit);
  }, [onSubmitForm]);

  const isLoading = createAssistantMutation.isPending || updateAssistantMutation.isPending;

  return (
    <Form {...form}>
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Assistente</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Digite o nome do assistente" 
                  {...field} 
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="marketplace"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marketplace</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um marketplace" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="mercado_livre">Mercado Livre</SelectItem>
                  <SelectItem value="shopee">Shopee</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Modelo OpenAI</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um modelo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="gpt-4o-mini">GPT-4O Mini</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4O</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Instruções do Assistente 
                <span className="text-xs text-muted-foreground ml-2">
                  ({charCount} caracteres)
                </span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Digite as instruções específicas para este assistente..."
                  className="min-h-[120px] resize-none"
                  maxLength={2000}
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}