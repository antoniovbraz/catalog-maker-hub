import { DashboardForm } from "@/components/forms/DashboardForm";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Card, CardContent } from "@/components/ui/card";
import { Heading, Text } from "@/components/ui/typography";

const Dashboard = () => {
  const { showOnboarding, completeOnboarding, skipOnboarding } = useOnboarding();

  return (
    <>
      <div className="space-y-lg">
        {/* Page Header */}
        <div className="space-y-sm">
          <Heading
            variant="h1"
            className="tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
          >
            📊 Dashboard
          </Heading>
          <Text className="text-muted-foreground text-h5">
            Compare preços e margens entre diferentes marketplaces para seus produtos
          </Text>
        </div>

        {/* Main Content */}
        <Card className="shadow-card border-0 bg-gradient-subtle">
          <CardContent className="p-lg">
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
