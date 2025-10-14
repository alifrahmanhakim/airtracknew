
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { indicatorClassName?: string }
>(({ className, value, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-secondary border group",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn("h-full w-full flex-1 bg-primary transition-all group-hover:animate-progress-stripes", indicatorClassName)}
      style={{ 
        transform: `translateX(-${100 - (value || 0)}%)`,
        backgroundImage: 'linear-gradient(45deg, hsla(0, 0%, 100%, .15) 25%, transparent 25%, transparent 50%, hsla(0, 0%, 100%, .15) 50%, hsla(0, 0%, 100%, .15) 75%, transparent 75%, transparent)',
        backgroundSize: '1rem 1rem'
      }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
