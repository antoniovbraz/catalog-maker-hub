import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

const mlCategoryMappingSchema = z.object({
  ml_category_id: z.string().min(1, "Categoria ML é obrigatória"),
  ml_category_name: z.string().min(1, "Nome da categoria ML é obrigatório"),
  category_id: z.string().optional(),
  description: z.string().optional(),
  is_default: z.boolean().default(false),
});

type MLCategoryMappingFormData = z.infer<typeof mlCategoryMappingSchema>;

interface MLCategoryMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mappingId?: string;
}

// Categorias ML mais comuns
const popularMLCategories = [
  { id: 'MLB1051', name: 'Eletrônicos, Áudio e Vídeo' },
  { id: 'MLB1000', name: 'Informática' },
  { id: 'MLB1071', name: 'Casa, Móveis e Decoração' },
  { id: 'MLB1430', name: 'Roupas, Bolsas e Calçados' },
  { id: 'MLB1246', name: 'Esportes e Fitness' },
  { id: 'MLB1253', name: 'Ferramentas e Construção' },
  { id: 'MLB1144', name: 'Carros, Motos e Outros' },
  { id: 'MLB1499', name: 'Indústria e Comércio' },
  { id: 'MLB1132', name: 'Saúde' },
  { id: 'MLB1276', name: 'Joias e Relógios' },
];

export function MLCategoryMappingModal({
  isOpen,
  onClose,
  mappingId,
}: MLCategoryMappingModalProps) {
  const queryClient = useQueryClient();
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const form = useForm<MLCategoryMappingFormData>({
    resolver: zodResolver(mlCategoryMappingSchema),
    defaultValues: {
      ml_category_id: "",
      ml_category_name: "",
      category_id: undefined,
      description: "",
      is_default: false,
    },
  });

  // Buscar categorias locais
  const { data: localCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Buscar mapping existente se estiver editando
  const { data: existingMapping, isLoading: isLoadingMapping } = useQuery({
    queryKey: ['ml-category-mapping', mappingId],
    queryFn: async () => {
      if (!mappingId) return null;
      
      const { data, error } = await supabase
        .from('ml_category_mapping')
        .select('*')
        .eq('id', mappingId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!mappingId,
  });

  // Preencher form com dados existentes
  if (existingMapping && !form.formState.isDirty) {
    form.reset({
      ml_category_id: existingMapping.ml_category_id,
      ml_category_name: existingMapping.ml_category_name,
      category_id: existingMapping.category_id || undefined,
      description: existingMapping.description || "",
      is_default: existingMapping.is_default,
    });
  }

  const saveMappingMutation = useMutation({
    mutationFn: async (data: MLCategoryMappingFormData) => {
      const payload = {
        ...data,
        category_id: data.category_id || null,
      };

      if (mappingId) {
        const { error } = await supabase
          .from('ml_category_mapping')
          .update(payload)
          .eq('id', mappingId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ml_category_mapping')
          .insert(payload);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml-category-mappings'] });
      toast({
        title: "Mapeamento salvo",
        description: "Mapeamento de categoria criado com sucesso.",
      });
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: MLCategoryMappingFormData) => {
    saveMappingMutation.mutate(data);
  };

  const handleCategoryChange = (value: string) => {
    const selectedCategory = popularMLCategories.find(cat => cat.id === value);
    if (selectedCategory) {
      form.setValue('ml_category_id', selectedCategory.id);
      form.setValue('ml_category_name', selectedCategory.name);
      setIsCustomCategory(false);
    } else if (value === 'custom') {
      setIsCustomCategory(true);
      form.setValue('ml_category_id', '');
      form.setValue('ml_category_name', '');
    }
  };

  if (isLoadingMapping) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner size="lg" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mappingId ? 'Editar' : 'Criar'} Mapeamento de Categoria ML
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria Local (Opcional)</FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Nenhuma categoria</SelectItem>
                        {localCategories?.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Categoria do seu sistema para mapear
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ml_category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria Mercado Livre</FormLabel>
                    <Select
                      value={isCustomCategory ? 'custom' : field.value}
                      onValueChange={handleCategoryChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione categoria ML" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {popularMLCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Outra categoria...</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isCustomCategory && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ml_category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID da Categoria ML</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ex: MLB1234" />
                      </FormControl>
                      <FormDescription>
                        ID oficial da categoria no Mercado Livre
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ml_category_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Categoria ML</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome da categoria" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Descreva como essa categoria será usada..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={saveMappingMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saveMappingMutation.isPending}
              >
                {saveMappingMutation.isPending && <LoadingSpinner size="sm" />}
                {mappingId ? 'Atualizar' : 'Criar'} Mapeamento
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}