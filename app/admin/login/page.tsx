import { Screen } from "@/components/brand/Screen";
import { Logo } from "@/components/brand/Logo";
import { LoginForm } from "@/components/admin/LoginForm";
import { env } from "@/lib/config/env";

export const metadata = { title: "כניסת מנהל", robots: { index: false } };

export default function AdminLoginPage() {
  return (
    <Screen className="justify-center gap-6">
      <div className="flex justify-center">
        <Logo />
      </div>
      <LoginForm />
      {env.useMockBackend && (
        <p className="text-center text-xs text-muted">
          מצב פיתוח מקומי (ללא Supabase): {env.ADMIN_MOCK_EMAIL} / {env.ADMIN_MOCK_PASSWORD}
        </p>
      )}
    </Screen>
  );
}
