import { FixedFeeRuleForm } from "@/components/forms/FixedFeeRuleForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function FixedFees() {
  return (
    <div className="p-6">
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
}