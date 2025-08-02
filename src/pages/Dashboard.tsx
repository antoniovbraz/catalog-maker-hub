import { DashboardForm } from "@/components/forms/DashboardForm";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  const { showOnboarding, completeOnboarding, skipOnboarding } = useOnboarding();

  return (
    <>
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
      
      {showOnboarding && (
        <OnboardingTour 
          onComplete={completeOnboarding}
          onSkip={skipOnboarding}
        />
      )}
    </>
  );
};

export default Dashboard;