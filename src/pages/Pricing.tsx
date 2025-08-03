import { PricingForm } from "@/components/forms/PricingForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Pricing = () => {
  return (
    <div className="space-y-lg">
      {/* Page Header */}
      <div className="space-y-sm">
        <h1 className="text-3xl font-bold tracking-tight">Precificação</h1>
        <p className="text-muted-foreground">
          Calcule preços sugeridos e margens de lucro para seus produtos
        </p>
      </div>

      {/* Main Content */}
      <Card className="shadow-card border-0 bg-gradient-subtle">
        <CardContent className="p-lg">
          <PricingForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default Pricing;