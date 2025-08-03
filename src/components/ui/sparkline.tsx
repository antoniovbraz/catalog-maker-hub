import * as React from "react"
import { LineChart, Line, ResponsiveContainer } from "recharts"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { colors } from "@/styles/tokens"

const sparklineVariants = cva("", {
  variants: {
    size: {
      sm: "h-6 w-12",
      md: "h-8 w-16",
      lg: "h-10 w-24",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

interface SparklineProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sparklineVariants> {
  data: number[]
  stroke?: string
}

function Sparkline({ data, stroke = colors.primary.DEFAULT, size, className, ...props }: SparklineProps) {
  const chartData = data.map((value, index) => ({ value, index }))

  return (
    <div className={cn(sparklineVariants({ size }), className)} {...props}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={1.5}
            dot={false}
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export { Sparkline, sparklineVariants }
