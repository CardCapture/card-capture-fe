import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import * as React from "react";

export default function AboutCard({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <Card className={cn("bg-white rounded-xl shadow-sm p-6", className)}>
      {children}
    </Card>
  );
} 