import { PricingForm } from "@/components/forms/PricingForm";
import { Card, CardContent } from "@/components/ui/card";
import { Heading, Text } from "@/components/ui/typography";

const Pricing = () => {
  return (
    <div className="space-y-lg">
      {/* Page Header */}
      <div className="space-y-sm">
        <Heading variant="h1" className="tracking-tight">
          Precificação
        </Heading>
        <Text className="text-muted-foreground">
          Calcule preços sugeridos e margens de lucro para seus produtos
        </Text>
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
