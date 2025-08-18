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
import { Textarea } from "@/components/ui/textarea";
import { useCreateCategory, useUpdateCategory } from "@/hooks/useCategories";
import type { CategoryType } from "@/types/categories";

const categorySchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryModalFormProps {
  category?: CategoryType;
  onSuccess: () => void;
  onSubmitForm: (submitFn: () => Promise<void>) => void;
}

export function CategoryModalForm({ category, onSuccess, onSubmitForm }: CategoryModalFormProps) {
  const isEdit = !!category;

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
    },
  });

  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        description: category.description || "",
      });
    } else {
      form.reset({
        name: "",
        description: "",
      });
    }
  }, [category, form]);

  const onSubmit = async (formData: CategoryFormData) => {
    try {
      if (isEdit) {
        await updateCategoryMutation.mutateAsync({
          id: category!.id,
          data: formData,
        });
      } else {
        await createCategoryMutation.mutateAsync(formData);
      }
      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
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

  const isLoading = createCategoryMutation.isPending || updateCategoryMutation.isPending;

  return (
    <Form {...form}>
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Categoria</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: Eletrônicos, Casa e Decoração..." 
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descrição detalhada da categoria..."
                  className="min-h-[80px] resize-none"
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