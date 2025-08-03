import { SalesForm } from "@/components/forms/SalesForm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Heading, Text } from "@/components/ui/typography";

const Sales = () => {
  return (
    <div className="p-lg">
      <Card>
        <CardHeader>
          <Heading
            variant="h3"
            className="font-semibold leading-none tracking-tight"
          >
            Vendas
          </Heading>
          <Text className="text-sm text-muted-foreground">
            Registre vendas para cálculo de margens
          </Text>
        </CardHeader>
        <CardContent>
          <SalesForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default Sales;
