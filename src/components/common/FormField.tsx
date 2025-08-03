import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  name: string;
  type?: "text" | "email" | "password" | "number" | "textarea";
  placeholder?: string;
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  rows?: number;
}

export function FormField({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className,
  rows = 3,
}: FormFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = type === "number" ? Number(e.target.value) : e.target.value;
    onChange(newValue);
  };

  return (
    <div className={cn("space-y-sm", className)}>
      <Label htmlFor={name} className={required ? "after:content-['*'] after:text-destructive after:ml-1" : ""}>
        {label}
      </Label>
      
      {type === "textarea" ? (
        <Textarea
          id={name}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          rows={rows}
          className={error ? "border-destructive" : ""}
        />
      ) : (
        <Input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={error ? "border-destructive" : ""}
        />
      )}
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}