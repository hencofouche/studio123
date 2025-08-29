import { Clock, Weight, Percent, DollarSign, Icon as LucideIcon, Package } from "lucide-react";
import type { ComponentProps } from "react";
import type { CalculationType } from "@/lib/types";

type IconProps = ComponentProps<typeof LucideIcon>;

export const CalculationTypeIcon = ({ type, ...props }: { type: CalculationType } & IconProps) => {
  switch (type) {
    case "time":
      return <Clock {...props} />;
    case "weight":
      return <Weight {...props} />;
    case "percentage":
      return <Percent {...props} />;
    case "fixed":
      return <DollarSign {...props} />;
    default:
      return null;
  }
};
