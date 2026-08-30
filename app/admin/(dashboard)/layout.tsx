import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/admin/auth";
import { logoutAction } from "@/lib/admin/actions";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-dvh-safe flex flex-col">
      <header className="glass-card rounded-none border-x-0 border-t-0 pt-[var(--safe-top)]">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between px-6 py-3">
          <Logo />
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin/stations" className="hover:text-gold transition-colors">
              תחנות
            </Link>
            <Link href="/admin/analytics" className="hover:text-gold transition-colors">
              אנליטיקס
            </Link>
            <span className="text-muted hidden sm:inline">{session.email}</span>
            <form action={logoutAction}>
              <Button variant="ghost" size="md" type="submit">
                התנתקות
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 pt-8 pb-[max(2rem,var(--safe-bottom))] safe-x">
        {children}
      </main>
    </div>
  );
}
