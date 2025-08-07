import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Package, Target, RefreshCw } from "@/components/ui/icons";
import { DragList } from "./dashboard/DragList";
import { useDashboardForm } from "@/hooks/useDashboardForm";

export const DashboardForm = () => {
  const {
    products,
    marketplaces,
    loadingProducts,
    loadingMarketplaces,
    selectedProductId,
    setSelectedProductId,
    selectedMarketplaces,
    handleMarketplaceToggle,
    sortBy,
    sortOrder,
    handleSort,
    cardOrder,
    results,
    handleDragEnd,
    isLoading,
    recalculateAndSave,
    isRecalculating,
  } = useDashboardForm();

  return (
    <div className="space-y-lg">
      {/* Controls */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="size-5" />
              Seleção de Produto
            </CardTitle>
            <CardDescription>
              Selecione um produto para comparar suas precificações salvas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="product">Produto *</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {loadingProducts ? (
                    <SelectItem value="loading">Carregando...</SelectItem>
                  ) : (
                    products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                        {product.sku ? ` (${product.sku})` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-5" />
              Marketplaces
              <Badge variant="secondary">{selectedMarketplaces.length}/6</Badge>
              {isRecalculating && <RefreshCw className="size-4 animate-spin text-primary" />}
            </CardTitle>
            <CardDescription>
              Selecione até 6 marketplaces para comparar - os dados serão atualizados automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 space-y-3 overflow-y-auto">
              {loadingMarketplaces ? (
                <div>Carregando marketplaces...</div>
              ) : (
                marketplaces.map((marketplace) => (
                  <div key={marketplace.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={marketplace.id}
                      checked={selectedMarketplaces.includes(marketplace.id)}
                      onCheckedChange={() => handleMarketplaceToggle(marketplace.id)}
                      disabled={!selectedMarketplaces.includes(marketplace.id) && selectedMarketplaces.length >= 6}
                    />
                    <label
                      htmlFor={marketplace.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {marketplace.name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {selectedProductId && selectedMarketplaces.length > 0 && (
          <div className="flex justify-end md:col-span-2">
            <Button
              onClick={() => recalculateAndSave(selectedProductId, selectedMarketplaces)}
              disabled={isRecalculating}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {isRecalculating ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Atualizar com dados mais recentes
            </Button>
          </div>
        )}
      </div>

      {/* Sort Controls */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="size-5" />
              Ordenação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={sortBy === "margem_percentual" ? "default" : "outline"}
                size="sm"
                onClick={() => handleSort("margem_percentual")}
                className="flex items-center gap-1"
              >
                Margem %
                {sortBy === "margem_percentual" && <ArrowUpDown className="size-3" />}
              </Button>
              <Button
                variant={sortBy === "margem_unitaria" ? "default" : "outline"}
                size="sm"
                onClick={() => handleSort("margem_unitaria")}
                className="flex items-center gap-1"
              >
                Margem R$
                {sortBy === "margem_unitaria" && <ArrowUpDown className="size-3" />}
              </Button>
              <Button
                variant={sortBy === "preco_sugerido" ? "default" : "outline"}
                size="sm"
                onClick={() => handleSort("preco_sugerido")}
                className="flex items-center gap-1"
              >
                Preço
                {sortBy === "preco_sugerido" && <ArrowUpDown className="size-3" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {selectedProductId && selectedMarketplaces.length > 0 && (
        <div className="space-y-md">
          <h3 className="text-lg font-semibold">Comparação de Preços</h3>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {selectedMarketplaces.map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 w-3/4 rounded bg-muted"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-sm">
                      <div className="h-3 rounded bg-muted"></div>
                      <div className="h-3 w-5/6 rounded bg-muted"></div>
                      <div className="h-3 w-4/6 rounded bg-muted"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : results.length > 0 ? (
            <DragList results={results} cardOrder={cardOrder} onDragEnd={handleDragEnd} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="mb-2 text-muted-foreground">
                  Nenhuma precificação salva encontrada para os marketplaces selecionados.
                </p>
                <p className="text-sm text-muted-foreground">
                  Use a aba "Precificação" para calcular e salvar precificações primeiro.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!selectedProductId && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="mb-2 text-muted-foreground">
              Selecione um produto e marketplaces para ver as precificações salvas
            </p>
            <p className="text-sm text-muted-foreground">
              Use a aba "Precificação" para calcular e salvar precificações primeiro.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
