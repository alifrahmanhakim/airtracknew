
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

type ColorLogic = "default" | "inverted";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { indicatorClassName?: string; colorLogic?: ColorLogic }
>(({ className, value, indicatorClassName, colorLogic = "default", ...props }, ref) => {
  const progressValue = value || 0;
  
  let colorClass = '';

  if (colorLogic === 'inverted') {
    // Inverted: Higher value is more red
    colorClass =
      progressValue > 70
        ? "bg-red-500"
        : progressValue > 40
        ? "bg-yellow-500"
        : "bg-green-500";
  } else {
    // Default: Higher value is more green
    colorClass =
      progressValue <= 40
        ? "bg-red-500"
        : progressValue <= 70
        ? "bg-yellow-500"
        : "bg-green-500";
  }


  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary border group",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1 transition-all group-hover:animate-progress-stripes", colorClass, indicatorClassName)}
        style={{ 
          transform: `translateX(-${100 - (value || 0)}%)`,
          backgroundImage: 'linear-gradient(45deg, hsla(0, 0%, 100%, .15) 25%, transparent 25%, transparent 50%, hsla(0, 0%, 100%, .15) 50%, hsla(0, 0%, 100%, .15) 75%, transparent 75%, transparent)',
          backgroundSize: '1rem 1rem'
        }}
      />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
