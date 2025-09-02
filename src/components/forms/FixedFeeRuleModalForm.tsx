import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Info } from '@/components/ui/icons';
import { handleSupabaseError } from '@/utils/errors';
import { useAuth } from '@/contexts/AuthContext';

interface Marketplace {
  id: string;
  name: string;
}

const RULE_TYPES = [
  {
    value: 'constante',
    label: 'Constante',
    description: 'Valor fixo aplicado independente do preço do produto',
  },
  {
    value: 'faixa',
    label: 'Faixa',
    description: 'Valor aplicado quando o preço estiver dentro de uma faixa específica',
  },
  {
    value: 'percentual',
    label: 'Percentual',
    description: 'Percentual aplicado sobre o valor do produto dentro de uma faixa específica',
  },
];

export interface FixedFeeRule {
  id: string;
  marketplace_id: string;
  rule_type: string;
  range_min: number | null;
  range_max: number | null;
  value: number;
}

interface FixedFeeRuleModalFormProps {
  rule?: FixedFeeRule;
  onSuccess: () => void;
  onSubmitForm: (submitFn: () => Promise<void>) => void;
}

interface FixedFeeRuleFormData {
  marketplace_id: string;
  rule_type: string;
  range_min: string;
  range_max: string;
  value: string;
}

export function FixedFeeRuleModalForm({ rule, onSuccess, onSubmitForm }: FixedFeeRuleModalFormProps) {
  const isEdit = !!rule;
  const [formData, setFormData] = useState<FixedFeeRuleFormData>({
    marketplace_id: rule?.marketplace_id || '',
    rule_type: rule?.rule_type || '',
    range_min: rule?.range_min?.toString() || '',
    range_max: rule?.range_max?.toString() || '',
    value: rule ? rule.value.toString() : '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  const { data: marketplaces = [] } = useQuery({
    queryKey: ['marketplaces', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplaces')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data as Marketplace[];
    },
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: FixedFeeRuleFormData) => {
      const { error } = await supabase
        .from('marketplace_fixed_fee_rules')
        .insert([
          {
            marketplace_id: data.marketplace_id,
            rule_type: data.rule_type,
            range_min: data.range_min ? parseFloat(data.range_min) : null,
            range_max: data.range_max ? parseFloat(data.range_max) : null,
            value: parseFloat(data.value),
          },
        ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace_fixed_fee_rules', tenantId] });
      toast({ title: 'Taxa fixa criada com sucesso!' });
      onSuccess();
    },
    onError: (error) => {
      const friendlyMessage = handleSupabaseError(error);
      toast({
        title: 'Erro ao criar taxa fixa',
        description: friendlyMessage,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FixedFeeRuleFormData }) => {
      const { error } = await supabase
        .from('marketplace_fixed_fee_rules')
        .update({
          marketplace_id: data.marketplace_id,
          rule_type: data.rule_type,
          range_min: data.range_min ? parseFloat(data.range_min) : null,
          range_max: data.range_max ? parseFloat(data.range_max) : null,
          value: parseFloat(data.value),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace_fixed_fee_rules', tenantId] });
      toast({ title: 'Taxa fixa atualizada com sucesso!' });
      onSuccess();
    },
    onError: (error) => {
      const friendlyMessage = handleSupabaseError(error);
      toast({
        title: 'Erro ao atualizar taxa fixa',
        description: friendlyMessage,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = useCallback(async () => {
    if (isEdit && rule) {
      await updateMutation.mutateAsync({ id: rule.id, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
  }, [isEdit, rule, formData, createMutation, updateMutation]);

  const handleSubmit = useCallback(async () => {
    await onSubmit();
  }, [onSubmit]);

  useEffect(() => {
    onSubmitForm(handleSubmit);
  }, [onSubmitForm, handleSubmit]);

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const showRangeFields = formData.rule_type === 'faixa' || formData.rule_type === 'percentual';

  return (
    <div className="space-y-md">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="marketplace">Marketplace *</Label>
          <Select
            value={formData.marketplace_id}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, marketplace_id: value }))}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um marketplace" />
            </SelectTrigger>
            <SelectContent>
              {marketplaces.map((marketplace) => (
                <SelectItem key={marketplace.id} value={marketplace.id}>
                  {marketplace.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <Label htmlFor="rule_type">Tipo de Regra *</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="size-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <div className="space-y-sm">
                    {RULE_TYPES.map((type) => (
                      <div key={type.value}>
                        <p className="font-medium">{type.label}:</p>
                        <p className="text-sm">{type.description}</p>
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Select
            value={formData.rule_type}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, rule_type: value, range_min: '', range_max: '' }))
            }
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {RULE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {showRangeFields && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="range_min">Valor Mínimo (R$) *</Label>
            <Input
              id="range_min"
              type="number"
              step="0.01"
              value={formData.range_min}
              onChange={(e) => setFormData((prev) => ({ ...prev, range_min: e.target.value }))}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="range_max">Valor Máximo (R$) *</Label>
            <Input
              id="range_max"
              type="number"
              step="0.01"
              value={formData.range_max}
              onChange={(e) => setFormData((prev) => ({ ...prev, range_max: e.target.value }))}
              required
              disabled={isLoading}
            />
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="value">
          {formData.rule_type === 'percentual' ? 'Valor (%)' : 'Valor (R$)'} *
        </Label>
        <Input
          id="value"
          type="number"
          step="0.01"
          value={formData.value}
          onChange={(e) => setFormData((prev) => ({ ...prev, value: e.target.value }))}
          required
          disabled={isLoading}
        />
      </div>
    </div>
  );
}

export default FixedFeeRuleModalForm;
