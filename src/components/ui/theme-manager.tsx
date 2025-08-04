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
  },
  {
    id: "windows7",
    name: "Windows 7",
    description: "Tema clássico do Windows 7",
    preview: "bg-gradient-to-r from-[#1A6ED8] to-[#6CC0F3]",
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
          <Palette className="h-[1.2rem] w-[1.2rem]" />
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
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className={`w-4 h-4 rounded-sm ${themeOption.preview}`} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{themeOption.name}</span>
                {theme === themeOption.id && (
                  <Monitor className="h-3 w-3 text-primary" />
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