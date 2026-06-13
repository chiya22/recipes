import { AppHeader } from "@/components/layout/AppHeader";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireRole } from "@/lib/auth/dal";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // admin 以外は requireRole 内で / にリダイレクト
  const user = await requireRole("admin");

  return (
    <div className="min-h-full">
      <AppHeader user={user} active="admin" />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="mb-4 text-xl font-medium text-foreground">管理</h1>
        <AdminNav />
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
