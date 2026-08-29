"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/admin/actions";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <Card className="flex flex-col gap-4">
      <CardTitle>כניסת מנהל</CardTitle>
      <form action={formAction} className="flex flex-col gap-3">
        <div>
          <label htmlFor="email" className="block text-sm text-muted mb-1">
            אימייל
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-mint outline-none"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm text-muted mb-1">
            סיסמה
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-mint outline-none"
          />
        </div>
        {state?.error && (
          <p role="alert" className="text-sm text-red-300">
            {state.error}
          </p>
        )}
        <Button type="submit" fullWidth disabled={pending}>
          {pending ? "מתחברים..." : "התחברות"}
        </Button>
      </form>
    </Card>
  );
}
