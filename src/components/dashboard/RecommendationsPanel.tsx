import { Recommendation, getRecommendationIcon, getImpactColor } from "@/utils/recommendations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, TrendingUp, Target, ExternalLink } from "lucide-react";
import { formatarMoeda } from "@/utils/pricing";

interface RecommendationsPanelProps {
  recommendations: Recommendation[];
  onRecommendationClick?: (recommendation: Recommendation) => void;
}

export function RecommendationsPanel({ recommendations, onRecommendationClick }: RecommendationsPanelProps) {
  const getTypeIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'optimization':
        return <Target className="h-4 w-4" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4" />;
      case 'opportunity':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getImpactBadge = (impact: Recommendation['impact']) => {
    const colors = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    } as const;

    const labels = {
      high: 'Alto Impacto',
      medium: 'Médio Impacto',
      low: 'Baixo Impacto'
    };

    return (
      <Badge variant={colors[impact]} className="text-xs">
        {labels[impact]}
      </Badge>
    );
  };

  if (!recommendations.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recomendações Inteligentes
          </CardTitle>
          <CardDescription>
            Nenhuma recomendação disponível no momento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Quando houver dados de precificação, mostraremos recomendações automáticas para otimizar suas margens.
          </p>
        </CardContent>
      </Card>
    );
  }

  const highImpactCount = recommendations.filter(r => r.impact === 'high').length;
  const opportunitiesCount = recommendations.filter(r => r.type === 'opportunity').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Recomendações Inteligentes
        </CardTitle>
        <CardDescription>
          {recommendations.length} recomendação(ões) disponível(eis) • {highImpactCount} crítica(s) • {opportunitiesCount} oportunidade(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {recommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onRecommendationClick?.(recommendation)}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-lg">
                      {getRecommendationIcon(recommendation.type)}
                    </span>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(recommendation.type)}
                      <h4 className="font-semibold text-sm">{recommendation.title}</h4>
                    </div>
                  </div>
                  {getImpactBadge(recommendation.impact)}
                </div>

                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  {recommendation.description}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Ação sugerida:</span>
                    <span className="text-muted-foreground">{recommendation.suggestedAction}</span>
                  </div>

                  {recommendation.potentialGain && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Ganho potencial:</span>
                      <span className="text-green-600 font-semibold">
                        {formatarMoeda(recommendation.potentialGain)}
                      </span>
                    </div>
                  )}
                </div>

                {onRecommendationClick && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRecommendationClick(recommendation);
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Ver Detalhes
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}