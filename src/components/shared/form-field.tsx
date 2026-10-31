import type { ComponentProps, ReactNode } from "react";
import type { FieldError } from "react-hook-form";
import { Input } from "@/components/ui/input";

export function FormField({
  label,
  hint,
  error,
  ...props
}: ComponentProps<typeof Input> & { label: string; hint?: ReactNode; error?: FieldError }) {
  const errorId = `${props.name}-error`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={props.name} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <Input
        id={props.name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {hint && !error && <p className="text-sm text-secondary-text">{hint}</p>}
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error.message}
        </p>
      )}
    </div>
  );
}

export function FormStatus({ result }: { result: { error?: string; message?: string } }) {
  if (result.error) {
    return (
      <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
        {result.error}
      </p>
    );
  }
  if (result.message) {
    return (
      <p role="status" className="rounded-md bg-success/10 px-3 py-2 text-sm text-green-800">
        {result.message}
      </p>
    );
  }
  return null;
}
