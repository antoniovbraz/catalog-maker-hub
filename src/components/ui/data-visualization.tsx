import { ReactNode, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, SortAsc, SortDesc, Grid, List, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export interface DataColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface DataAction<T> {
  label: string;
  icon?: ReactNode;
  onClick: (item: T) => void;
  variant?: "default" | "destructive" | "outline" | "secondary";
  disabled?: (item: T) => boolean;
}

interface DataVisualizationProps<T extends { id: string }> {
  title: string;
  description?: string;
  data: T[];
  columns: DataColumn<T>[];
  actions?: DataAction<T>[];
  searchable?: boolean;
  viewMode?: "table" | "grid";
  onViewModeChange?: (mode: "table" | "grid") => void;
  isLoading?: boolean;
  emptyState?: ReactNode;
  className?: string;
  itemsPerPage?: number;
}

export function DataVisualization<T extends { id: string }>({
  title,
  description,
  data,
  columns,
  actions = [],
  searchable = true,
  viewMode = "table",
  onViewModeChange,
  isLoading = false,
  emptyState,
  className,
  itemsPerPage = 10
}: DataVisualizationProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);

  const getValue = (item: T, key: string): unknown => {
    return key.split('.').reduce((obj, k) => obj?.[k], item);
  };

  // Filter data based on search term
  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    return Object.values(item).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aValue = String(getValue(a, sortColumn));
    const bValue = String(getValue(b, sortColumn));
    
    if (sortDirection === "asc") {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const renderTableView = () => (
    <div className="overflow-x-auto w-full">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={String(column.key)} className={column.className}>
                {column.sortable ? (
                  <button
                    type="button"
                    onClick={() => handleSort(String(column.key))}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors w-full text-left"
                    aria-label={`Ordenar por ${column.header}`}
                  >
                    <span>{column.header}</span>
                    {sortColumn === String(column.key) && (
                      sortDirection === "asc" ? (
                        <SortAsc className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <SortDesc className="w-4 h-4" aria-hidden="true" />
                      )
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    {column.header}
                  </div>
                )}
              </TableHead>
            ))}
            {actions.length > 0 && <TableHead>Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((item) => (
            <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
              {columns.map((column) => (
                <TableCell key={String(column.key)} className={column.className}>
                  {column.render ?
                    column.render(item) :
                    String(getValue(item, String(column.key)))
                  }
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    {actions.slice(0, 2).map((action, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant={action.variant || "outline"}
                        onClick={() => action.onClick(item)}
                        disabled={action.disabled?.(item)}
                        aria-label={action.label}
                      >
                        {action.icon && (
                          <span aria-hidden="true">{action.icon}</span>
                        )}
                      </Button>
                    ))}
                    {actions.length > 2 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" aria-label="Mais ações">
                            <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {actions.slice(2).map((action, index) => (
                            <DropdownMenuItem
                              key={index}
                              onClick={() => action.onClick(item)}
                              disabled={action.disabled?.(item)}
                            >
                              {action.icon && (
                                <span className="mr-2" aria-hidden="true">{action.icon}</span>
                              )}
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-lg">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              {title}
              <Badge variant="secondary">{data.length}</Badge>
            </CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {searchable && (
              <div className="relative w-full sm:w-auto">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"
                  aria-hidden="true"
                />
                <Input
                  aria-label="Buscar"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
            )}

            {onViewModeChange && (
              <div className="flex rounded-md border">
                <Button
                  size="sm"
                  variant={viewMode === "table" ? "default" : "ghost"}
                  onClick={() => onViewModeChange("table")}
                  className="rounded-r-none"
                  aria-label="Visualizar como tabela"
                >
                  <List className="w-4 h-4" aria-hidden="true" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  onClick={() => onViewModeChange("grid")}
                  className="rounded-l-none border-l"
                  aria-label="Visualizar como grade"
                >
                  <Grid className="w-4 h-4" aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {paginatedData.length === 0 ? (
          emptyState || (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum item encontrado</p>
            </div>
          )
        ) : (
          <div className="space-y-md">
            {renderTableView()}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                  {Math.min(currentPage * itemsPerPage, sortedData.length)} de{" "}
                  {sortedData.length} resultados
                </p>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  
                  <span className="text-sm">
                    Página {currentPage} de {totalPages}
                  </span>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}