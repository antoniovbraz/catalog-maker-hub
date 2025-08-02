import { CommissionForm } from "@/components/forms/CommissionForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Commissions = () => {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Comissões</CardTitle>
          <CardDescription>
            Configure comissões por marketplace e categoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CommissionForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default Commissions;