"use client";

import React, {
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
  forwardRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fieldClasses =
  "w-full rounded-none border border-ink-border bg-ink-raised px-4 py-2.5 text-sm text-paper placeholder:text-paper-dim focus:border-gold focus:outline-none transition-colors";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(fieldClasses, className)} {...props} />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(fieldClasses, "resize-none", className)} {...props} />
  )
);
Textarea.displayName = "Textarea";

const EMPTY_SENTINEL = "__shadcn_empty__";

interface ParsedOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

function extractOptions(children: React.ReactNode): ParsedOption[] {
  const out: ParsedOption[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === React.Fragment) {
      out.push(...extractOptions((child.props as { children?: React.ReactNode }).children));
      return;
    }
    if (child.type === "option") {
      const props = child.props as {
        value?: string | number;
        disabled?: boolean;
        children?: React.ReactNode;
      };
      const val = props.value !== undefined ? String(props.value) : String(props.children ?? "");
      out.push({
        value: val,
        label: props.children,
        disabled: props.disabled,
      });
    }
  });
  return out;
}

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, value, defaultValue, onChange, name, id, disabled, required }, _ref) => {
    const options = extractOptions(children);
    const isControlled = value !== undefined;
    const initialVal =
      defaultValue !== undefined ? String(defaultValue) : (options[0]?.value ?? "");
    const [internalValue, setInternalValue] = useState<string>(initialVal);

    const currentRealValue = isControlled ? String(value) : internalValue;
    const radixValue = currentRealValue === "" ? EMPTY_SENTINEL : currentRealValue;

    return (
      <div className={cn("w-full", className)}>
        {name && <input type="hidden" name={name} value={currentRealValue} required={required} />}
        <ShadcnSelect
          value={radixValue}
          disabled={disabled}
          onValueChange={(nextRadixVal) => {
            const realVal = nextRadixVal === EMPTY_SENTINEL ? "" : nextRadixVal;
            if (!isControlled) {
              setInternalValue(realVal);
            }
            if (onChange) {
              const syntheticEvent = {
                target: { value: realVal, name: name ?? "" },
                currentTarget: { value: realVal, name: name ?? "" },
              } as unknown as React.ChangeEvent<HTMLSelectElement>;
              onChange(syntheticEvent);
            }
          }}
        >
          <SelectTrigger id={id} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt, idx) => {
              const itemValue = opt.value === "" ? EMPTY_SENTINEL : opt.value;
              return (
                <SelectItem key={`${itemValue}-${idx}`} value={itemValue} disabled={opt.disabled}>
                  {opt.label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </ShadcnSelect>
      </div>
    );
  }
);
Select.displayName = "Select";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-paper-dim",
        className
      )}
      {...props}
    />
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-danger">{message}</p>;
}
