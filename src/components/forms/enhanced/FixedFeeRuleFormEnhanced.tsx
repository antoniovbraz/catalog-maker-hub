import { useState, useEffect } from "react";
import { SmartForm } from "@/components/ui/smart-form";
import { Calculator, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMarketplaces } from "@/hooks/useMarketplaces";
import { useCreateFixedFee, useUpdateFixedFee, FixedFeeRule, FixedFeeRuleFormData } from "@/hooks/useFixedFees";

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

interface FixedFeeRuleFormEnhancedProps {
  editingFee?: FixedFeeRule | null;
  onCancelEdit?: () => void;
}

export function FixedFeeRuleFormEnhanced({ 
  editingFee, 
  onCancelEdit 
}: FixedFeeRuleFormEnhancedProps) {
  const [formData, setFormData] = useState<FixedFeeRuleFormData>({
    marketplace_id: "",
    rule_type: "",
    range_min: "",
    range_max: "",
    value: ""
  });

  const { data: marketplaces = [] } = useMarketplaces();
  const createMutation = useCreateFixedFee();
  const updateMutation = useUpdateFixedFee();

  useEffect(() => {
    if (editingFee) {
      setFormData({
        marketplace_id: editingFee.marketplace_id,
        rule_type: editingFee.rule_type,
        range_min: editingFee.range_min?.toString() || "",
        range_max: editingFee.range_max?.toString() || "",
        value: editingFee.value.toString()
      });
    } else {
      setFormData({
        marketplace_id: "",
        rule_type: "",
        range_min: "",
        range_max: "",
        value: ""
      });
    }
  }, [editingFee]);

  const showRangeFields = formData.rule_type === "faixa" || formData.rule_type === "percentual";
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = () => {
    if (editingFee) {
      updateMutation.mutate({ id: editingFee.id, data: formData }, {
        onSuccess: () => {
          setFormData({
            marketplace_id: "",
            rule_type: "",
            range_min: "",
            range_max: "",
            value: ""
          });
          onCancelEdit?.();
        }
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          setFormData({
            marketplace_id: "",
            rule_type: "",
            range_min: "",
            range_max: "",
            value: ""
          });
        }
      });
    }
  };

  const basicSection = {
    id: "basic",
    title: "Configuração de Taxa Fixa",
    icon: <Calculator className="w-4 h-4" />,
    required: true,
    children: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="after:content-['*'] after:text-destructive after:ml-1">
            Marketplace
          </Label>
          <Select 
            value={formData.marketplace_id} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, marketplace_id: value }))}
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

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="after:content-['*'] after:text-destructive after:ml-1">
              Tipo de Regra
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <div className="space-y-2">
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
            onValueChange={(value) => setFormData(prev => ({ ...prev, rule_type: value, range_min: "", range_max: "" }))}
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

        {showRangeFields && (
          <>
            <div className="space-y-2">
              <Label className="after:content-['*'] after:text-destructive after:ml-1">
                Valor Mínimo (R$)
              </Label>
              <Input
                type="number"
                step="0.01"
                value={formData.range_min}
                onChange={(e) => setFormData(prev => ({ ...prev, range_min: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="after:content-['*'] after:text-destructive after:ml-1">
                Valor Máximo (R$)
              </Label>
              <Input
                type="number"
                step="0.01"
                value={formData.range_max}
                onChange={(e) => setFormData(prev => ({ ...prev, range_max: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label className="after:content-['*'] after:text-destructive after:ml-1">
            {formData.rule_type === "percentual" ? "Valor (%)" : "Valor (R$)"}
          </Label>
          <Input
            type="number"
            step="0.01"
            value={formData.value}
            onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
            placeholder="0.00"
          />
        </div>
      </div>
    )
  };

  const sections = [basicSection];

  return (
    <SmartForm
      title={editingFee ? "Editar Taxa Fixa" : "Nova Taxa Fixa"}
      sections={sections}
      onSubmit={handleSubmit}
      onCancel={editingFee ? onCancelEdit : undefined}
      isSubmitting={isSubmitting}
      isEditing={!!editingFee}
    />
  );
}