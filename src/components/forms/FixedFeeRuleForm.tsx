import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Edit, Info } from '@/components/ui/icons';
import { handleSupabaseError } from "@/utils/errors";

interface FixedFeeRule {
  id: string;
  marketplace_id: string;
  rule_type: string;
  range_min: number | null;
  range_max: number | null;
  value: number;
  created_at: string;
  updated_at: string;
  marketplaces?: {
    name: string;
  };
}

interface Marketplace {
  id: string;
  name: string;
}

const RULE_TYPES = [
  { 
    value: "constante", 
    label: "Constante",
    description: "Valor fixo aplicado independente do preço do produto"
  },
  { 
    value: "faixa", 
    label: "Faixa",
    description: "Valor aplicado quando o preço estiver dentro de uma faixa específica"
  },
  { 
    value: "percentual", 
    label: "Percentual",
    description: "Percentual aplicado sobre o valor do produto dentro de uma faixa específica"
  }
];

interface FixedFeeRuleFormProps {
  onCancel?: () => void;
}

export const FixedFeeRuleForm = ({ onCancel }: FixedFeeRuleFormProps) => {
  interface FixedFeeRuleFormData {
    marketplace_id: string;
    rule_type: string;
    range_min: string;
    range_max: string;
    value: string;
  }

  const [formData, setFormData] = useState<FixedFeeRuleFormData>({
    marketplace_id: "",
    rule_type: "",
    range_min: "",
    range_max: "",
    value: ""
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: marketplaces = [] } = useQuery({
    queryKey: ["marketplaces"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplaces")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data as Marketplace[];
    }
  });

  const { data: fixedFeeRules = [], isLoading } = useQuery({
    queryKey: ["marketplace_fixed_fee_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_fixed_fee_rules")
        .select(`
          *,
          marketplaces (name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as FixedFeeRule[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: FixedFeeRuleFormData) => {
      const { error } = await supabase
        .from("marketplace_fixed_fee_rules")
        .insert([{
          marketplace_id: data.marketplace_id,
          rule_type: data.rule_type,
          range_min: data.range_min ? parseFloat(data.range_min) : null,
          range_max: data.range_max ? parseFloat(data.range_max) : null,
          value: parseFloat(data.value)
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace_fixed_fee_rules"] });
      setFormData({
        marketplace_id: "",
        rule_type: "",
        range_min: "",
        range_max: "",
        value: ""
      });
      toast({ title: "Taxa fixa criada com sucesso!" });
    },
    onError: (error) => {
      const friendlyMessage = handleSupabaseError(error);
      toast({ 
        title: "Erro ao criar taxa fixa", 
        description: friendlyMessage, 
        variant: "destructive" 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FixedFeeRuleFormData }) => {
      const { error } = await supabase
        .from("marketplace_fixed_fee_rules")
        .update({
          marketplace_id: data.marketplace_id,
          rule_type: data.rule_type,
          range_min: data.range_min ? parseFloat(data.range_min) : null,
          range_max: data.range_max ? parseFloat(data.range_max) : null,
          value: parseFloat(data.value)
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace_fixed_fee_rules"] });
      setFormData({
        marketplace_id: "",
        rule_type: "",
        range_min: "",
        range_max: "",
        value: ""
      });
      setEditingId(null);
      toast({ title: "Taxa fixa atualizada com sucesso!" });
    },
    onError: (error) => {
      const friendlyMessage = handleSupabaseError(error);
      toast({ 
        title: "Erro ao atualizar taxa fixa", 
        description: friendlyMessage, 
        variant: "destructive" 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketplace_fixed_fee_rules")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace_fixed_fee_rules"] });
      toast({ title: "Taxa fixa excluída com sucesso!" });
    },
    onError: (error) => {
      const friendlyMessage = handleSupabaseError(error);
      toast({ 
        title: "Erro ao excluir taxa fixa", 
        description: friendlyMessage, 
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (rule: FixedFeeRule) => {
    setFormData({
      marketplace_id: rule.marketplace_id,
      rule_type: rule.rule_type,
      range_min: rule.range_min?.toString() || "",
      range_max: rule.range_max?.toString() || "",
      value: rule.value.toString()
    });
    setEditingId(rule.id);
  };

  const handleCancelEdit = () => {
    setFormData({
      marketplace_id: "",
      rule_type: "",
      range_min: "",
      range_max: "",
      value: ""
    });
    setEditingId(null);
  };

  const showRangeFields = formData.rule_type === "faixa" || formData.rule_type === "percentual";

  return (
    <div className="space-y-lg">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Editar Taxa Fixa" : "Nova Taxa Fixa"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="marketplace">Marketplace *</Label>
                <Select value={formData.marketplace_id} onValueChange={(value) => setFormData(prev => ({ ...prev, marketplace_id: value }))}>
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
                        <Info className="w-4 h-4 text-muted-foreground" />
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
                <Select value={formData.rule_type} onValueChange={(value) => setFormData(prev => ({ ...prev, rule_type: value, range_min: "", range_max: "" }))}>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="range_min">Valor Mínimo (R$) *</Label>
                  <Input
                    id="range_min"
                    type="number"
                    step="0.01"
                    value={formData.range_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, range_min: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="range_max">Valor Máximo (R$) *</Label>
                  <Input
                    id="range_max"
                    type="number"
                    step="0.01"
                    value={formData.range_max}
                    onChange={(e) => setFormData(prev => ({ ...prev, range_max: e.target.value }))}
                    required
                  />
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="value">
                {formData.rule_type === "percentual" ? "Valor (%)" : "Valor (R$)"} *
              </Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                required
              />
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Atualizar" : "Criar"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel || handleCancelEdit}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Taxas Fixas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marketplace</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Faixa</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fixedFeeRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.marketplaces?.name}</TableCell>
                    <TableCell>
                      {RULE_TYPES.find(t => t.value === rule.rule_type)?.label}
                    </TableCell>
                    <TableCell>
                       {(rule.rule_type === "faixa" || rule.rule_type === "percentual") && rule.range_min !== null && rule.range_max !== null
                         ? `R$ ${rule.range_min.toFixed(2)} - R$ ${rule.range_max.toFixed(2)}`
                         : rule.rule_type === "constante" ? "Todas as faixas" : "-"
                       }
                     </TableCell>
                     <TableCell>
                       {rule.rule_type === "percentual"
                        ? `${rule.value.toFixed(2)}%`
                        : `R$ ${rule.value.toFixed(2)}`
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(rule.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};