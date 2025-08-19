import { useState } from "react";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Calculator, Plus } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { PricingResultsCard } from "@/components/common/PricingResultsCard";
import { PricingCalculatorModal } from "@/components/forms/PricingCalculatorModal";
import { useGlobalModal } from "@/hooks/useGlobalModal";

interface PricingResult {
  custo_total: number;
  valor_fixo: number;
  frete: number;
  comissao: number;
  preco_sugerido: number;
  margem_unitaria: number;
  margem_percentual: number;
  product_name: string;
  product_sku: string;
}

interface MargemRealResult {
  custo_total: number;
  valor_fixo: number;
  frete: number;
  comissao: number;
  preco_praticado: number;
  margem_unitaria_real: number;
  margem_percentual_real: number;
}

const Pricing = () => {
  const { showFormModal, closeModal } = useGlobalModal();
  const [pricingResult, setPricingResult] = useState<PricingResult | undefined>();
  const [margemRealResult, setMargemRealResult] = useState<MargemRealResult | undefined>();

  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Precificação" }
  ];

  const handleCalculateClick = () => {
    const modalId = showFormModal({
      title: "Calculadora de Preços",
      description: "Configure os parâmetros para calcular o preço sugerido",
      size: "lg",
      content: (
        <PricingCalculatorModal
          onCalculationComplete={(result, margemReal) => {
            setPricingResult(result);
            setMargemRealResult(margemReal);
            closeModal(modalId);
          }}
        />
      ),
      onSave: () => {
        // A lógica de salvar está dentro do modal
      }
    });
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={handleCalculateClick}>
        <Plus className="mr-2 size-4" />
        Calcular Preço
      </Button>
    </div>
  );

  return (
    <ConfigurationPageLayout
      title="Precificação"
      description="Calcule preços sugeridos e margens de lucro para seus produtos"
      icon={<Calculator className="size-6" />}
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      <div className="xl:col-span-12">
        <PricingResultsCard
          pricingResult={pricingResult}
          margemRealResult={margemRealResult}
          onCalculateClick={handleCalculateClick}
        />
      </div>
    </ConfigurationPageLayout>
  );
};

export default Pricing;
