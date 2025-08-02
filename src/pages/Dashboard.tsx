import { DashboardForm } from "@/components/forms/DashboardForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard - Comparação de Preços</CardTitle>
          <CardDescription>
            Compare preços e margens entre diferentes marketplaces para um produto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DashboardForm />
        </CardContent>
      </Card>
    </div>
  );
}