
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()

  // Avoid rendering on the server to prevent hydration mismatch
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled>
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const isLoginPage = pathname === '/login'

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
        "transition-transform active:scale-90",
        isLoginPage
          ? "border-white/20 bg-black/20 text-white hover:bg-black/30 dark:border-white/20 dark:bg-black/20 dark:text-white dark:hover:bg-black/30"
          : "border-input bg-background"
      )}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
