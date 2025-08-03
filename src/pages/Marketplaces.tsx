import { MarketplaceForm } from "@/components/forms/MarketplaceForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Marketplaces = () => {
  return (
    <div className="space-y-lg">
      {/* Page Header */}
      <div className="space-y-sm">
        <h1 className="text-3xl font-bold tracking-tight">🏪 Marketplaces</h1>
        <p className="text-muted-foreground">
          Cadastre e gerencie os marketplaces onde seus produtos são vendidos
        </p>
      </div>

      {/* Main Content */}
      <Card className="shadow-card border-0 bg-gradient-subtle">
        <CardContent className="p-lg">
          <MarketplaceForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default Marketplaces;