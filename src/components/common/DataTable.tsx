import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, Search, Filter, MoreHorizontal, Plus } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { LoadingSpinner } from "./LoadingSpinner";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: unknown, item: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onCreate?: () => void;
  loading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  title?: string;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  onEdit,
  onDelete,
  onCreate,
  loading = false,
  emptyMessage = "Nenhum registro encontrado",
  emptyDescription = "Adicione o primeiro registro para começar",
  searchable = true,
  searchPlaceholder = "Buscar...",
  title,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter data based on search term
  const filteredData = searchable && searchTerm
    ? data.filter((item) => {
        return columns.some((column) => {
          const value = getValue(item, column.key as string);
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        });
      })
    : data;

  const getValue = (item: T, key: string) => {
    return key.includes('.') 
      ? key.split('.').reduce((obj, k) => obj?.[k], item as any)
      : (item as any)[key];
  };
  if (loading) {
    return (
      <div className="space-y-4">
        {(title || searchable || onCreate) && (
          <div className="flex items-center justify-between">
            {title && <h2 className="text-xl font-semibold">{title}</h2>}
            <div className="flex items-center gap-3">
              {searchable && (
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input disabled placeholder={searchPlaceholder} className="pl-10" />
                </div>
              )}
              {onCreate && (
                <Button disabled>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              )}
            </div>
          </div>
        )}
        <LoadingSpinner />
      </div>
    );
  }

  if (!filteredData.length && searchTerm) {
    return (
      <div className="space-y-4">
        {(title || searchable || onCreate) && (
          <div className="flex items-center justify-between">
            {title && <h2 className="text-xl font-semibold">{title}</h2>}
            <div className="flex items-center gap-3">
              {searchable && (
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input 
                    placeholder={searchPlaceholder} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10" 
                  />
                </div>
              )}
              {onCreate && (
                <Button onClick={onCreate} className="shadow-form">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              )}
            </div>
          </div>
        )}
        <EmptyState 
          message="Nenhum resultado encontrado" 
          description={`Nenhum item corresponde à busca "${searchTerm}"`}
        />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="space-y-4">
        {(title || searchable || onCreate) && (
          <div className="flex items-center justify-between">
            {title && <h2 className="text-xl font-semibold">{title}</h2>}
            <div className="flex items-center gap-3">
              {searchable && (
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input disabled placeholder={searchPlaceholder} className="pl-10" />
                </div>
              )}
              {onCreate && (
                <Button onClick={onCreate} className="shadow-form">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              )}
            </div>
          </div>
        )}
        <EmptyState 
          message={emptyMessage} 
          description={emptyDescription}
          action={onCreate && (
            <Button onClick={onCreate} className="shadow-form">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar primeiro registro
            </Button>
          )}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with title, search and actions */}
      {(title || searchable || onCreate) && (
        <div className="flex items-center justify-between">
          {title && <h2 className="text-xl font-semibold">{title}</h2>}
          <div className="flex items-center gap-3">
            {searchable && (
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder={searchPlaceholder} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary" 
                />
              </div>
            )}
            {onCreate && (
              <Button onClick={onCreate} className="shadow-form">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="rounded-lg border border-border/50 bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/60">
              {columns.map((column, index) => (
                <TableHead key={index} className={cn("font-semibold", column.className)}>
                  {column.header}
                </TableHead>
              ))}
              {(onEdit || onDelete) && (
                <TableHead className="text-right font-semibold">Ações</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item, index) => (
              <TableRow 
                key={item.id || index}
                className="hover:bg-muted/30 transition-colors border-border/50"
              >
                {columns.map((column, colIndex) => {
                  const value = getValue(item, column.key as string);
                  return (
                    <TableCell key={colIndex} className={column.className}>
                      {column.render ? column.render(value, item) : value}
                    </TableCell>
                  );
                })}
                {(onEdit || onDelete) && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(item)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem 
                            onClick={() => onDelete(item)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Results counter */}
      {searchable && (
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredData.length} de {data.length} registros
          {searchTerm && ` para "${searchTerm}"`}
        </div>
      )}
    </div>
  );
}