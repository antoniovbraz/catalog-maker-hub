import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
      <Sonner
        theme={theme as ToasterProps["theme"]}
        className="group"
        toastOptions={{
          classNames: {
            toast:
              "group toast bg-brand-background text-brand-dark border-border shadow-lg",
            description: "group-[.toast]:text-muted-foreground",
            actionButton:
              "group-[.toast]:bg-brand-primary group-[.toast]:text-brand-background",
            cancelButton:
              "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          },
        }}
        {...props}
      />
  )
}

export { Toaster, toast }
