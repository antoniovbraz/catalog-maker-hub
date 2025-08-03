import { ShippingRuleForm } from "@/components/forms/ShippingRuleForm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Heading, Text } from "@/components/ui/typography";

const Shipping = () => {
  return (
    <div className="p-lg">
      <Card>
        <CardHeader>
          <Heading
            variant="h3"
            className="font-semibold leading-none tracking-tight"
          >
            Regras de Frete
          </Heading>
          <Text className="text-sm text-muted-foreground">
            Configure regras de frete por produto e marketplace
          </Text>
        </CardHeader>
        <CardContent>
          <ShippingRuleForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default Shipping;
