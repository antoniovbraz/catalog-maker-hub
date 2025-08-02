import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { LoadingSpinner } from "./LoadingSpinner";

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
  loading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  onEdit,
  onDelete,
  loading = false,
  emptyMessage = "Nenhum registro encontrado",
  emptyDescription = "Adicione o primeiro registro para começar",
}: DataTableProps<T>) {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (!data.length) {
    return <EmptyState message={emptyMessage} description={emptyDescription} />;
  }

  const getValue = (item: T, key: string) => {
    return key.includes('.') 
      ? key.split('.').reduce((obj, k) => obj?.[k], item as any)
      : (item as any)[key];
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index} className={column.className}>
                {column.header}
              </TableHead>
            ))}
            {(onEdit || onDelete) && (
              <TableHead className="text-right">Ações</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={item.id || index}>
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
                  <div className="flex justify-end gap-2">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
}