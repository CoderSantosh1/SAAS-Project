"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { FormField, FormStatus } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { changePassword, updateProfile } from "../actions";
import { passwordSchema, profileSchema, type PasswordValues, type ProfileValues } from "../schemas";

type Result = { error?: string; message?: string };

function useAction() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Result>({});

  const run = (action: () => Promise<Result>, onSuccess?: () => void) => {
    setResult({});
    startTransition(async () => {
      try {
        const outcome = await action();
        setResult(outcome);
        if (!outcome.error) onSuccess?.();
      } catch {
        setResult({ error: "Something went wrong. Please try again." });
      }
    });
  };

  return { pending, result, run };
}

export function ProfileForm({ fullName, email }: { fullName: string; email: string }) {
  const { pending, result, run } = useAction();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: { fullName } });

  return (
    <form onSubmit={handleSubmit((values) => run(() => updateProfile(values)))} method="post" className="space-y-4" noValidate>
      <FormStatus result={result} />
      <FormField label="Full name" autoComplete="name" error={errors.fullName} {...register("fullName")} />
      <FormField label="Email" name="email" value={email} readOnly disabled />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const { pending, result, run } = useAction();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  return (
    <form onSubmit={handleSubmit((values) => run(() => changePassword(values), reset))} method="post" className="space-y-4" noValidate>
      <FormStatus result={result} />
      <FormField label="Current password" type="password" autoComplete="current-password" error={errors.currentPassword} {...register("currentPassword")} />
      <FormField label="New password" type="password" autoComplete="new-password" error={errors.newPassword} {...register("newPassword")} />
      <FormField label="Confirm new password" type="password" autoComplete="new-password" error={errors.confirmPassword} {...register("confirmPassword")} />
      <Button type="submit" disabled={pending}>
        {pending ? "Changing..." : "Change password"}
      </Button>
    </form>
  );
}
