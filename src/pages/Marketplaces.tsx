import { MarketplaceForm } from "@/components/forms/MarketplaceForm";
import { Card, CardContent } from "@/components/ui/card";
import { Heading, Text } from "@/components/ui/typography";

const Marketplaces = () => {
  return (
    <div className="space-y-lg">
      {/* Page Header */}
      <div className="space-y-sm">
        <Heading variant="h1" className="tracking-tight">
          🏪 Marketplaces
        </Heading>
        <Text className="text-muted-foreground">
          Cadastre e gerencie os marketplaces onde seus produtos são vendidos
        </Text>
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
