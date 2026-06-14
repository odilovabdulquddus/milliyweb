import * as React from "react";
import { Input } from "@/components/ui/input";
import { formatUzPhone } from "@/lib/phone";

interface PhoneInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value: string;
  onValueChange: (value: string) => void;
}

export function PhoneInput({ value, onValueChange, onFocus, ...props }: PhoneInputProps) {
  return (
    <Input
      type="tel"
      inputMode="tel"
      value={value && value.startsWith("+998") ? value : "+998 "}
      placeholder="+998 90 123 45 67"
      onFocus={(e) => {
        if (!value || !value.startsWith("+998")) onValueChange("+998 ");
        onFocus?.(e);
      }}
      onChange={(e) => onValueChange(formatUzPhone(e.target.value))}
      {...props}
    />
  );
}
