import { SmartForm } from "@/components/ui/smart-form";
import { Calculator } from "lucide-react";

interface FixedFeeRuleFormEnhancedProps {
  editingFee?: any;
  onCancelEdit?: () => void;
}

export function FixedFeeRuleFormEnhanced({ 
  editingFee, 
  onCancelEdit 
}: FixedFeeRuleFormEnhancedProps) {
  const sections = [
    {
      id: "basic",
      title: "Configuração de Taxa Fixa",
      icon: <Calculator className="w-4 h-4" />,
      required: true,
      children: <div>Form implementation coming soon...</div>
    }
  ];

  return (
    <SmartForm
      title="Nova Taxa Fixa"
      sections={sections}
      onSubmit={() => {}}
    />
  );
}