import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, ArrowRight, Zap, Target, Users, Rocket } from '@/components/ui/icons';
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  completed: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Bem-vindo ao Peepers Hub!',
      description: `Olá ${profile?.full_name || 'usuário'}! Vamos começar sua jornada no Price Pilot, nossa ferramenta de precificação inteligente.`,
      icon: Zap,
      completed: true
    },
    {
      id: 'explore',
      title: 'Explore as Funcionalidades',
      description: 'Descubra como o Price Pilot pode otimizar seus preços e maximizar suas margens de lucro em marketplaces.',
      icon: Target,
      completed: false,
      action: {
        label: 'Ver Dashboard',
        onClick: () => {
          // Aqui você pode navegar para o dashboard
          setCurrentStep(currentStep + 1);
        }
      }
    },
    {
      id: 'setup',
      title: 'Configure seu Primeiro Produto',
      description: 'Adicione seus produtos, marketplaces e comece a calcular preços otimizados.',
      icon: Users,
      completed: false,
      action: {
        label: 'Adicionar Produto',
        onClick: () => {
          // Aqui você pode abrir o formulário de produto
          setCurrentStep(currentStep + 1);
        }
      }
    },
    {
      id: 'ready',
      title: 'Pronto para Vender!',
      description: 'Agora você está pronto para usar todas as funcionalidades do Peepers Hub. Boa sorte com suas vendas!',
      icon: Rocket,
      completed: false
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-md backdrop-blur-sm">
      <Card className="w-full max-w-2xl">
        <CardHeader className="pb-2 text-center">
          <div className="mb-4 flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {currentStep + 1} de {steps.length}
            </Badge>
            <Button variant="ghost" size="sm" onClick={onSkip}>
              Pular tour
            </Button>
          </div>
          
          <Progress value={progress} className="mb-6" />
          
          <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-primary/10">
            <step.icon className="size-8 text-primary" />
          </div>
          
          <CardTitle className="mb-2 text-2xl">{step.title}</CardTitle>
          <CardDescription className="text-base">
            {step.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-lg">
          {/* Steps Overview */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {steps.map((s, index) => (
              <div
                key={s.id}
                className={`rounded-lg border p-3 text-center transition-all ${
                  index === currentStep
                    ? 'border-primary bg-primary/5'
                    : index < currentStep
                    ? 'border-green-500 bg-green-50'
                    : 'border-muted'
                }`}
              >
                <div className={`mb-2 inline-flex size-8 items-center justify-center rounded-full ${
                  index === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : index < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {index < currentStep ? (
                    <Check className="size-4" />
                  ) : (
                    <s.icon className="size-4" />
                  )}
                </div>
                <p className="truncate text-xs font-medium">{s.title}</p>
              </div>
            ))}
          </div>

          {/* Current Step Action */}
          {step.action && (
            <div className="text-center">
              <Button onClick={step.action.onClick} className="gap-2">
                {step.action.label}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              Anterior
            </Button>
            
            <Button onClick={nextStep}>
              {currentStep === steps.length - 1 ? 'Finalizar' : 'Próximo'}
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}