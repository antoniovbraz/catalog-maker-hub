import { PricingForm } from "@/components/forms/PricingForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Pricing() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Precificação</CardTitle>
          <CardDescription>
            Calcule preços sugeridos e margens de lucro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PricingForm />
        </CardContent>
      </Card>
    </div>
  );
}