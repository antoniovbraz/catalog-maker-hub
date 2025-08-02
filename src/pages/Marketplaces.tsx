import { MarketplaceForm } from "@/components/forms/MarketplaceForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Marketplaces() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Marketplaces</CardTitle>
          <CardDescription>
            Cadastre e gerencie os marketplaces onde seus produtos são vendidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MarketplaceForm />
        </CardContent>
      </Card>
    </div>
  );
}