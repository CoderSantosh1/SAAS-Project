"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition, type ComponentProps } from "react";
import { useForm, type FieldError } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminLogin,
  login,
  register as registerAccount,
  requestPasswordReset,
  resetPassword,
  type AuthResult,
} from "../actions";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type ForgotPasswordValues,
  type LoginValues,
  type RegisterValues,
  type ResetPasswordValues,
} from "../schemas";

function Field({
  label,
  error,
  ...props
}: ComponentProps<typeof Input> & { label: string; error?: FieldError }) {
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
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error.message}
        </p>
      )}
    </div>
  );
}

function FormStatus({ result }: { result: AuthResult }) {
  if (result.error) {
    return (
      <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
        {result.error}
      </p>
    );
  }
  if (result.message) {
    return (
      <p role="status" className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
        {result.message}
      </p>
    );
  }
  return null;
}

// Runs a server action and turns unexpected failures into a form message.
function useAuthAction() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthResult>({});

  const run = (action: () => Promise<AuthResult>) => {
    setResult({});
    startTransition(async () => {
      try {
        setResult(await action());
      } catch (error) {
        // A redirect from the action surfaces here and must keep propagating.
        if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) throw error;
        setResult({ error: "Something went wrong. Please try again." });
      }
    });
  };

  return { pending, result, run };
}

function LoginFields({
  action,
  next,
  submitLabel,
  footer,
}: {
  action: typeof login;
  next?: string;
  submitLabel: string;
  footer?: React.ReactNode;
}) {
  const { pending, result, run } = useAuthAction();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  return (
    <form onSubmit={handleSubmit((values) => run(() => action(values, next)))} method="post" className="space-y-4" noValidate>
      <FormStatus result={result} />
      <Field label="Email" type="email" autoComplete="email" error={errors.email} {...register("email")} />
      <Field
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password}
        {...register("password")}
      />
      {footer}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Signing in..." : submitLabel}
      </Button>
    </form>
  );
}

export function LoginForm({ next }: { next?: string }) {
  return (
    <LoginFields
      action={login}
      next={next}
      submitLabel="Sign in"
      footer={
        <div className="text-right">
          <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-primary-hover">
            Forgot password?
          </Link>
        </div>
      }
    />
  );
}

export function AdminLoginForm({ next }: { next?: string }) {
  return <LoginFields action={adminLogin} next={next} submitLabel="Sign in to admin" />;
}

export function RegisterForm({ next }: { next?: string }) {
  const { pending, result, run } = useAuthAction();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  return (
    <form onSubmit={handleSubmit((values) => run(() => registerAccount(values, next)))} method="post" className="space-y-4" noValidate>
      <FormStatus result={result} />
      <Field label="Full name" autoComplete="name" error={errors.fullName} {...register("fullName")} />
      <Field label="Email" type="email" autoComplete="email" error={errors.email} {...register("email")} />
      <Field
        label="Password"
        type="password"
        autoComplete="new-password"
        error={errors.password}
        {...register("password")}
      />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Creating account..." : "Start Building Free"}
      </Button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const { pending, result, run } = useAuthAction();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });

  return (
    <form onSubmit={handleSubmit((values) => run(() => requestPasswordReset(values)))} method="post" className="space-y-4" noValidate>
      <FormStatus result={result} />
      <Field label="Email" type="email" autoComplete="email" error={errors.email} {...register("email")} />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Sending..." : "Send reset link"}
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const { pending, result, run } = useAuthAction();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) });

  return (
    <form onSubmit={handleSubmit((values) => run(() => resetPassword(values)))} method="post" className="space-y-4" noValidate>
      <FormStatus result={result} />
      <Field
        label="New password"
        type="password"
        autoComplete="new-password"
        error={errors.password}
        {...register("password")}
      />
      <Field
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword}
        {...register("confirmPassword")}
      />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Saving..." : "Set new password"}
      </Button>
    </form>
  );
}
