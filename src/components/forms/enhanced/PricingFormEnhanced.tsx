import { useState } from "react";
import { Calculator, Target, TrendingUp, Eye } from "lucide-react";
import { SmartForm } from "@/components/ui/smart-form";
import { PricingForm } from "@/components/forms/PricingForm";

export function PricingFormEnhanced() {
  const [showCalculator, setShowCalculator] = useState(true);

  const sections = [
    {
      id: "calculadora",
      title: "Calculadora de Preços",
      description: "Configure custos, margens e marketplace para calcular preços sugeridos",
      icon: <Calculator className="h-5 w-5" />,
      children: (
        <PricingForm />
      )
    }
  ];

  return (
    <SmartForm
      title="Calculadora de Precificação"
      sections={sections}
    />
  );
}