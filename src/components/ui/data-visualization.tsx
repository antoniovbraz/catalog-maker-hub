import { ReactNode, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, SortAsc, SortDesc, Grid, List, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead 
              key={String(column.key)} 
              className={cn(
                column.sortable && "cursor-pointer hover:bg-muted/50 transition-colors",
                column.className
              )}
              onClick={() => column.sortable && handleSort(String(column.key))}
            >
              <div className="flex items-center gap-2">
                {column.header}
                {column.sortable && sortColumn === String(column.key) && (
                  sortDirection === "asc" ? 
                    <SortAsc className="size-4" /> : 
                    <SortDesc className="size-4" />
                )}
              </div>
            </TableHead>
          ))}
          {actions.length > 0 && <TableHead>Ações</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginatedData.map((item) => (
          <TableRow key={item.id} className="transition-colors hover:bg-muted/50">
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
                    >
                      {action.icon}
                    </Button>
                  ))}
                  {actions.length > 2 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {actions.slice(2).map((action, index) => (
                          <DropdownMenuItem
                            key={index}
                            onClick={() => action.onClick(item)}
                            disabled={action.disabled?.(item)}
                          >
                            {action.icon}
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
  );

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-lg">
          <div className="py-8 text-center">
            <div className="mx-auto size-8 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {title}
              <Badge variant="secondary">{data.length}</Badge>
            </CardTitle>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-9"
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
                >
                  <List className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  onClick={() => onViewModeChange("grid")}
                  className="rounded-l-none border-l"
                >
                  <Grid className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {paginatedData.length === 0 ? (
          emptyState || (
            <div className="py-8 text-center">
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