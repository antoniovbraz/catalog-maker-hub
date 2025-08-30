import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Package, AlertTriangle } from "lucide-react";
import type { ProductWithCategory } from "@/types/products";
import type { MLSyncProduct } from "@/services/ml-service";

interface MLConflictModalProps {
  product: ProductWithCategory;
  conflicts: MLSyncProduct[];
  onSuccess: () => void;
  onSubmitForm: (fn: () => Promise<void>) => void;
}

export function MLConflictModal({ product, conflicts, onSuccess, onSubmitForm }: MLConflictModalProps) {
  const [resolution, setResolution] = useState<'link' | 'create_new' | 'cancel'>('link');
  const [selectedConflict, setSelectedConflict] = useState<string>(conflicts[0]?.id || '');

  useEffect(() => {
    onSubmitForm(async () => {
      if (resolution === 'cancel') {
        return;
      }

      if (resolution === 'link' && selectedConflict) {
        // TODO: Implementar vinculação com produto existente
        console.log('Linking product', product.id, 'with ML product', selectedConflict);
      } else if (resolution === 'create_new') {
        // TODO: Implementar criação de novo anúncio
        console.log('Creating new ad for product', product.id);
      }
      
      onSuccess();
    });
  }, [resolution, selectedConflict, product.id, onSubmitForm, onSuccess]);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 border rounded-lg bg-amber-50 border-amber-200">
        <AlertTriangle className="size-5 text-amber-600 mt-0.5" />
        <div>
          <h4 className="font-medium text-amber-800">Produtos Similares Encontrados</h4>
          <p className="text-sm text-amber-700 mt-1">
            Encontramos {conflicts.length} produto(s) no Mercado Livre que podem ser relacionados ao produto "{product.name}".
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Produtos Similares no Mercado Livre:</h4>
        <div className="space-y-3">
          {conflicts.map((conflict) => (
            <Card key={conflict.id} className="border-l-4 border-l-yellow-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{conflict.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {conflict.sync_status === 'synced' ? 'Sincronizado' : 'Pendente'}
                    </Badge>
                    {conflict.ml_item_id && (
                      <a
                        href={`https://www.mercadolivre.com.br/MLB-${conflict.ml_item_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    )}
                  </div>
                </div>
                <CardDescription>
                  ID do ML: {conflict.ml_item_id || 'Não disponível'}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Como deseja proceder?</h4>
        <RadioGroup value={resolution} onValueChange={(value: any) => setResolution(value)}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="link" id="link" />
            <Label htmlFor="link" className="flex-1">
              <div>
                <div className="font-medium">Vincular com produto existente</div>
                <div className="text-sm text-muted-foreground">
                  Conectar este produto com um dos anúncios já existentes no ML
                </div>
              </div>
            </Label>
          </div>

          {resolution === 'link' && (
            <div className="ml-6 space-y-2">
              <Label className="text-sm text-muted-foreground">Selecione o produto para vincular:</Label>
              <RadioGroup value={selectedConflict} onValueChange={setSelectedConflict}>
                {conflicts.map((conflict) => (
                  <div key={conflict.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={conflict.id} id={conflict.id} />
                    <Label htmlFor={conflict.id} className="text-sm">
                      {conflict.name} {conflict.ml_item_id && `(${conflict.ml_item_id})`}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="create_new" id="create_new" />
            <Label htmlFor="create_new" className="flex-1">
              <div>
                <div className="font-medium">Criar novo anúncio</div>
                <div className="text-sm text-muted-foreground">
                  Criar um novo anúncio mesmo com produtos similares existentes
                </div>
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <RadioGroupItem value="cancel" id="cancel" />
            <Label htmlFor="cancel" className="flex-1">
              <div>
                <div className="font-medium">Cancelar</div>
                <div className="text-sm text-muted-foreground">
                  Não criar anúncio agora, revisar manualmente depois
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Package className="size-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-700">
            <strong>Dica:</strong> Vincular produtos evita duplicação e mantém histórico de vendas. 
            Criar novo anúncio pode gerar confusão para compradores se os produtos forem idênticos.
          </div>
        </div>
      </div>
    </div>
  );
}