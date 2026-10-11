"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

/** Native date field tuned for mobile (touch height, color-scheme, showPicker). */
const DateInput = React.forwardRef<HTMLInputElement, React.ComponentProps<typeof Input>>(
  ({ className, onClick, onFocus, ...props }, ref) => {
    function openPicker(el: HTMLInputElement) {
      if (typeof el.showPicker === "function") {
        try {
          el.showPicker();
        } catch {
          /* Some browsers require a direct user gesture */
        }
      }
    }

    return (
      <Input
        ref={ref}
        type="date"
        {...props}
        className={cn(
          "min-h-11 w-full text-base md:text-sm date-input-mobile",
          className
        )}
        onClick={(e) => {
          onClick?.(e);
          openPicker(e.currentTarget);
        }}
        onFocus={(e) => {
          onFocus?.(e);
          openPicker(e.currentTarget);
        }}
      />
    );
  }
);
DateInput.displayName = "DateInput";

export { DateInput };
