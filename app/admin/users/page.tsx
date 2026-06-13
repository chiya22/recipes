import { UserManager } from "@/components/admin/UserManager";
import { getCurrentUser } from "@/lib/auth/dal";
import { listUsers } from "@/lib/users";

export default async function AdminUsersPage() {
  const [users, current] = await Promise.all([listUsers(), getCurrentUser()]);

  return <UserManager users={users} currentUserId={current?.id ?? ""} />;
}
