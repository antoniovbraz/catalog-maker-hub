import { ShippingRuleForm } from "@/components/forms/ShippingRuleForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Shipping() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Regras de Frete</CardTitle>
          <CardDescription>
            Configure regras de frete por produto e marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShippingRuleForm />
        </CardContent>
      </Card>
    </div>
  );
}