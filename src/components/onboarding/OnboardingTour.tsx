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
    <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm z-50 flex items-center justify-center p-md">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="text-xs">
              {currentStep + 1} de {steps.length}
            </Badge>
            <Button variant="ghost" size="sm" onClick={onSkip}>
              Pular tour
            </Button>
          </div>
          
          <Progress value={progress} className="mb-6" />
          
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary/10 rounded-full mb-4">
            <step.icon className="w-8 h-8 text-brand-primary" />
          </div>
          
          <CardTitle className="text-2xl mb-2">{step.title}</CardTitle>
          <CardDescription className="text-base">
            {step.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-lg">
          {/* Steps Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {steps.map((s, index) => (
              <div
                key={s.id}
                className={`p-3 rounded-lg border text-center transition-all ${
                  index === currentStep
                    ? 'border-brand-primary bg-brand-primary/5'
                    : index < currentStep
                    ? 'border-brand-primary bg-brand-primary/10'
                    : 'border-muted'
                }`}
              >
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full mb-2 ${
                  index === currentStep
                    ? 'bg-brand-primary text-brand-background'
                    : index < currentStep
                    ? 'bg-brand-primary text-brand-background'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {index < currentStep ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <s.icon className="w-4 h-4" />
                  )}
                </div>
                <p className="text-xs font-medium truncate">{s.title}</p>
              </div>
            ))}
          </div>

          {/* Current Step Action */}
          {step.action && (
            <div className="text-center">
              <Button onClick={step.action.onClick} className="gap-2">
                {step.action.label}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex flex-wrap justify-between gap-2 pt-4">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              Anterior
            </Button>
            
            <Button onClick={nextStep}>
              {currentStep === steps.length - 1 ? 'Finalizar' : 'Próximo'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}