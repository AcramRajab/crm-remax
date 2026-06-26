// Sessão atual (usuário + papel). Demonstra a visibilidade por papel que,
// em produção, é reforçada por RLS no Supabase (account_id + owner_id).
import { createContext, useContext, useState, ReactNode } from "react";
import { users } from "./mock";
import type { User } from "./types";

interface SessionCtx {
  user: User;
  setUserId: (id: string) => void;
  canSeeAll: boolean; // account_admin / super_admin veem toda a conta
}

const Ctx = createContext<SessionCtx>(null!);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState(users[0].id); // Rodrigo (account_admin)
  const user = users.find((u) => u.id === userId)!;
  const canSeeAll = user.role === "account_admin" || user.role === "super_admin";
  return <Ctx.Provider value={{ user, setUserId, canSeeAll }}>{children}</Ctx.Provider>;
}

export const useSession = () => useContext(Ctx);

export const roleLabel: Record<string, string> = {
  super_admin: "Super admin",
  account_admin: "Admin da conta",
  broker: "Corretor",
};
