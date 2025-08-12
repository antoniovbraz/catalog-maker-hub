import { Monitor, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme-provider"

const themes = [
  {
    id: "corporate",
    name: "Corporate",
    description: "Sério e profissional",
    preview: "bg-gradient-to-r from-gunmetal to-fern-green"
  },
  {
    id: "light",
    name: "Clássico Claro", 
    description: "Tema original claro",
    preview: "bg-gradient-to-r from-primary to-accent"
  },
  {
    id: "dark",
    name: "Clássico Escuro",
    description: "Tema original escuro", 
    preview: "bg-gradient-to-r from-slate-800 to-slate-600"
  }
] as const

export function ThemeManager() {
  const { theme, setTheme } = useTheme()

  const getCurrentTheme = () => {
    return themes.find(t => t.id === theme) || themes[0]
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Palette className="size-[1.2rem]" />
          <span className="sr-only">Alterar tema</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">Escolha o tema</p>
          <p className="text-xs text-muted-foreground">
            Tema atual: {getCurrentTheme().name}
          </p>
        </div>
        
        <DropdownMenuSeparator />
        
        {themes.map((themeOption) => (
          <DropdownMenuItem
            key={themeOption.id}
            onClick={() => setTheme(themeOption.id)}
            className="flex cursor-pointer items-center gap-3"
          >
            <div className={`size-4 rounded-sm ${themeOption.preview}`} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{themeOption.name}</span>
                {theme === themeOption.id && (
                  <Monitor className="size-3 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {themeOption.description}
              </p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}