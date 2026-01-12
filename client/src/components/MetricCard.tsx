import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
  variant?: "default" | "success" | "warning";
}

export function MetricCard({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  className,
  variant = "default" 
}: MetricCardProps) {
  
  const variantStyles = {
    default: "border-border",
    success: "border-green-500/20 bg-green-500/5",
    warning: "border-orange-500/20 bg-orange-500/5",
  };

  const valueColor = {
    default: "text-foreground",
    success: "text-green-700 dark:text-green-400",
    warning: "text-orange-700 dark:text-orange-400",
  };

  return (
    <Card className={cn(
      "shadow-sm transition-all duration-300 hover:shadow-md", 
      variantStyles[variant],
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className={cn("h-4 w-4", valueColor[variant])}>{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold font-display", valueColor[variant])}>
          {value}
        </div>
        {(description || trend) && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend && (
              <span className={cn(
                "mr-1 font-medium",
                trend.value > 0 ? "text-green-600" : "text-red-600"
              )}>
                {trend.value > 0 ? "+" : ""}{trend.value}%
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
