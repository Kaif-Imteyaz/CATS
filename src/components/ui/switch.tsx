'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

import { cn } from '@/lib/utils'

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // Base styles - larger, more visible switch
        'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full',
        'border-2 border-transparent shadow-sm transition-all duration-200',
        // Unchecked state - visible gray track
        'data-[state=unchecked]:bg-muted-foreground/30 dark:data-[state=unchecked]:bg-muted-foreground/40',
        // Checked state - primary color
        'data-[state=checked]:bg-primary',
        // Focus styles
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        // Disabled styles
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // Base thumb styles - white circular thumb
          'pointer-events-none block h-5 w-5 rounded-full shadow-lg transition-transform duration-200',
          // Background - always white for contrast
          'bg-white',
          // Border for better definition
          'ring-0',
          // Translation for on/off states
          'data-[state=unchecked]:translate-x-0',
          'data-[state=checked]:translate-x-5',
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
