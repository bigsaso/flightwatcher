import { Button } from "@/components/ui/button"
import { Minus, Plus } from "lucide-react";

type StepperProps = {
  value: number;
  label: string;
  min: number;
  onChange: (next: number) => void;
};

function Stepper({ value, label, min, onChange }: StepperProps) {
  return (
    <div className="flex items-center justify-center space-x-4">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0 rounded-full"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
      >
        <Minus />
        <span className="sr-only">Decrease</span>
      </Button>

      <div className="flex flex-col items-center min-w-[80px]">
        <div className="text-3xl font-bold tracking-tight">
          {value}
        </div>
        <div className="text-muted-foreground text-xs uppercase">
          {label}
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0 rounded-full"
        onClick={() => onChange(value + 1)}
      >
        <Plus />
        <span className="sr-only">Increase</span>
      </Button>
    </div>
  );
}

export { Stepper }