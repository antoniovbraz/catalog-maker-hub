import { FixedFeeRuleForm } from "@/components/forms/FixedFeeRuleForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const FixedFees = () => {
  return (
    <div className="p-lg">
      <Card>
        <CardHeader>
          <CardTitle>Regras de valor fixo</CardTitle>
          <CardDescription>
            Configure regras de valor fixo por marketplace com diferentes tipos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FixedFeeRuleForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default FixedFees;