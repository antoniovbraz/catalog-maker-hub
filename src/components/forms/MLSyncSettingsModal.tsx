import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Settings, Clock, Shield } from "@/components/ui/icons";
import { useEffect } from "react";

const syncSettingsSchema = z.object({
  auto_sync_enabled: z.boolean().default(false),
  sync_interval_hours: z.number().min(1).max(168).default(24),
  auto_import_orders: z.boolean().default(true),
  auto_update_stock: z.boolean().default(true),
  auto_update_prices: z.boolean().default(false),
  price_markup_percent: z.number().min(0).max(100).default(0),
  default_condition: z.enum(['new', 'used', 'refurbished']).default('new'),
  default_listing_type: z.enum(['gold_special', 'gold_pro', 'free']).default('gold_special'),
  conflict_resolution: z.enum(['skip', 'update', 'create_new']).default('skip'),
  batch_size: z.number().min(1).max(50).default(10),
});

type SyncSettingsFormData = z.infer<typeof syncSettingsSchema>;

interface MLSyncSettingsModalProps {
  onSuccess: () => void;
  onSubmitForm: (fn: () => Promise<void>) => void;
}

export function MLSyncSettingsModal({ onSuccess, onSubmitForm }: MLSyncSettingsModalProps) {
  const form = useForm<SyncSettingsFormData>({
    resolver: zodResolver(syncSettingsSchema),
    defaultValues: {
      auto_sync_enabled: false,
      sync_interval_hours: 24,
      auto_import_orders: true,
      auto_update_stock: true,
      auto_update_prices: false,
      price_markup_percent: 0,
      default_condition: 'new',
      default_listing_type: 'gold_special',
      conflict_resolution: 'skip',
      batch_size: 10,
    },
  });

  useEffect(() => {
    onSubmitForm(async () => {
      const isValid = await form.trigger();
      if (!isValid) return;

      const data = form.getValues();
      
      // TODO: Implementar chamada para salvar configurações
      console.log('Saving sync settings:', data);
      
      onSuccess();
    });
  }, [form, onSubmitForm, onSuccess]);

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form className="space-y-6">
          {/* Sincronização Automática */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-4" />
                Sincronização Automática
              </CardTitle>
              <CardDescription>
                Configure como e quando os produtos serão sincronizados automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="auto_sync_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Sincronização Automática</FormLabel>
                      <FormDescription>
                        Sincronizar produtos automaticamente em intervalos regulares
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('auto_sync_enabled') && (
                <FormField
                  control={form.control}
                  name="sync_interval_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intervalo de Sincronização (horas)</FormLabel>
                      <Select value={field.value.toString()} onValueChange={(v) => field.onChange(parseInt(v))}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">A cada hora</SelectItem>
                          <SelectItem value="6">A cada 6 horas</SelectItem>
                          <SelectItem value="12">A cada 12 horas</SelectItem>
                          <SelectItem value="24">Diariamente</SelectItem>
                          <SelectItem value="48">A cada 2 dias</SelectItem>
                          <SelectItem value="168">Semanalmente</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Configurações de Produto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="size-4" />
                Configurações de Produto
              </CardTitle>
              <CardDescription>
                Configure como os produtos serão criados e atualizados no ML
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="default_condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condição Padrão</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="new">Novo</SelectItem>
                          <SelectItem value="used">Usado</SelectItem>
                          <SelectItem value="refurbished">Recondicionado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="default_listing_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Anúncio Padrão</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="gold_special">Gold Especial</SelectItem>
                          <SelectItem value="gold_pro">Gold Pro</SelectItem>
                          <SelectItem value="free">Gratuito</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <FormField
                control={form.control}
                name="auto_import_orders"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Importar Pedidos Automaticamente</FormLabel>
                      <FormDescription>
                        Importar novos pedidos do ML automaticamente
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="auto_update_stock"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Atualizar Estoque Automaticamente</FormLabel>
                      <FormDescription>
                        Sincronizar alterações de estoque entre sistemas
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="auto_update_prices"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Atualizar Preços Automaticamente</FormLabel>
                      <FormDescription>
                        Sincronizar alterações de preço (cuidado: pode sobrescrever preços do ML)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Gerenciamento de Conflitos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="size-4" />
                Gerenciamento de Conflitos
              </CardTitle>
              <CardDescription>
                Configure como lidar com produtos duplicados ou conflitos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="conflict_resolution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resolução de Conflitos</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="skip">Pular - Não criar duplicados</SelectItem>
                        <SelectItem value="update">Atualizar - Sobrescrever existente</SelectItem>
                        <SelectItem value="create_new">Criar Novo - Sempre criar</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Como lidar quando um produto similar já existe no ML
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="batch_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamanho do Lote</FormLabel>
                    <Select value={field.value.toString()} onValueChange={(v) => field.onChange(parseInt(v))}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="5">5 produtos por vez</SelectItem>
                        <SelectItem value="10">10 produtos por vez</SelectItem>
                        <SelectItem value="20">20 produtos por vez</SelectItem>
                        <SelectItem value="50">50 produtos por vez</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Quantos produtos processar simultaneamente
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}