import { DashboardForm } from "@/components/forms/DashboardForm";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { useOnboarding } from "@/hooks/useOnboarding";
import { BaseCard } from "@/components/ui";
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
            className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text tracking-tight text-transparent"
          >
            📊 Dashboard
          </Heading>
          <Text className="text-h5 text-muted-foreground">
            Compare preços e margens entre diferentes marketplaces para seus produtos
          </Text>
        </div>

        {/* Main Content */}
        <BaseCard
          className="border-0 bg-gradient-subtle shadow-card"
          contentPadding="p-lg"
        >
          <DashboardForm />
        </BaseCard>
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
