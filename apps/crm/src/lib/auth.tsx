// Auth (mock). Em produção: Supabase Auth → JWT com account_id + papel,
// e a RLS isola os dados. Aqui só controla o gate de entrada da demo.
import { createContext, useContext, useState, ReactNode } from "react";

interface Auth {
  authed: boolean;
  login: () => void;
  logout: () => void;
}

const Ctx = createContext<Auth>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  return (
    <Ctx.Provider value={{ authed, login: () => setAuthed(true), logout: () => setAuthed(false) }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
