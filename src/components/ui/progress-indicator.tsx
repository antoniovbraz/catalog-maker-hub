import { ReactNode } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressStep {
  id: string;
  label: string;
  description?: string;
  completed: boolean;
  icon?: ReactNode;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep?: string;
  showDetails?: boolean;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function ProgressIndicator({
  steps,
  currentStep,
  showDetails = false,
  orientation = "horizontal",
  className
}: ProgressIndicatorProps) {
  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  if (!showDetails) {
    return (
      <div className={cn("space-y-sm", className)}>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            Progresso da Configuração
          </span>
          <span className="text-muted-foreground">
            {completedSteps}/{totalSteps} concluídos
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>
    );
  }

  const isVertical = orientation === "vertical";

  return (
    <Card className={className}>
      <CardContent className="p-lg">
        <div className="space-y-md">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Progresso da Configuração</h3>
            <span className="text-sm text-muted-foreground">
              {Math.round(progressPercentage)}% completo
            </span>
          </div>
          
          <Progress value={progressPercentage} className="h-2" />
          
          <div className={cn(
            "space-y-md",
            !isVertical && "md:grid md:grid-cols-2 md:gap-4 md:space-y-0"
          )}>
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = step.completed;
              
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg transition-colors",
                    isActive && "bg-primary/5 border border-primary/20",
                    isCompleted && !isActive && "bg-success/5"
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : (
                      <Circle className={cn(
                        "w-5 h-5",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )} />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className={cn(
                      "font-medium text-sm",
                      isCompleted && "text-success",
                      isActive && !isCompleted && "text-primary",
                      !isActive && !isCompleted && "text-foreground"
                    )}>
                      {step.label}
                    </h4>
                    
                    {step.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {step.description}
                      </p>
                    )}
                  </div>
                  
                  {step.icon && (
                    <div className="flex-shrink-0">
                      {step.icon}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}