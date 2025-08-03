import { DashboardForm } from "@/components/forms/DashboardForm";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  const { showOnboarding, completeOnboarding, skipOnboarding } = useOnboarding();

  return (
    <>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            📊 Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Compare preços e margens entre diferentes marketplaces para seus produtos
          </p>
        </div>

        {/* Main Content */}
        <Card className="shadow-card border-0 bg-gradient-subtle">
          <CardContent className="p-6">
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