import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Palette } from "@/components/ui/icons";

interface ThemeFormData {
  id?: string;
  primary_color: string;
  secondary_color: string;
  tertiary_color: string;
  font_heading: string;
  font_body: string;
  h1_size: string;
  h2_size: string;
  body_size: string;
}

export default function ThemeSettings() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ThemeFormData>({
    primary_color: "#2580ff",
    secondary_color: "#4a5568",
    tertiary_color: "#718096",
    font_heading: "Roboto",
    font_body: "Open Sans",
    h1_size: "2.5rem",
    h2_size: "2rem",
    body_size: "1rem",
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("theme_settings")
        .select("*")
        .single();
      if (data) setFormData(data as ThemeFormData);
    };
    fetchData();
  }, []);

  const handleChange = (
    field: keyof ThemeFormData,
    value: string,
  ) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from("theme_settings")
      .upsert(formData);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Tema atualizado." });
    }
  };

  const breadcrumbs = [
    { label: "Admin", href: "/admin" },
    { label: "Tema" },
  ];

  return (
    <ConfigurationPageLayout
      title="Tema"
      description="Ajuste cores e tipografia do sistema"
      icon={<Palette className="size-6" />}
      breadcrumbs={breadcrumbs}
    >
      <div className="w-full max-w-3xl lg:col-span-12">
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Tema</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="primary_color">Cor Primária</Label>
                  <Input
                    id="primary_color"
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => handleChange("primary_color", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="secondary_color">Cor Secundária</Label>
                  <Input
                    id="secondary_color"
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) => handleChange("secondary_color", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="tertiary_color">Cor Terciária</Label>
                  <Input
                    id="tertiary_color"
                    type="color"
                    value={formData.tertiary_color}
                    onChange={(e) => handleChange("tertiary_color", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="font_heading">Fonte de Títulos</Label>
                  <Input
                    id="font_heading"
                    value={formData.font_heading}
                    onChange={(e) => handleChange("font_heading", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="font_body">Fonte de Corpo</Label>
                  <Input
                    id="font_body"
                    value={formData.font_body}
                    onChange={(e) => handleChange("font_body", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="h1_size">Tamanho H1</Label>
                  <Input
                    id="h1_size"
                    value={formData.h1_size}
                    onChange={(e) => handleChange("h1_size", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="h2_size">Tamanho H2</Label>
                  <Input
                    id="h2_size"
                    value={formData.h2_size}
                    onChange={(e) => handleChange("h2_size", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="body_size">Tamanho Corpo</Label>
                  <Input
                    id="body_size"
                    value={formData.body_size}
                    onChange={(e) => handleChange("body_size", e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit">Salvar</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </ConfigurationPageLayout>
  );
}
