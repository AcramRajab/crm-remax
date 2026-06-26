// Store em memória (sessão). Faz tudo PERSISTIR ao navegar entre telas.
// Quando o Supabase entrar, este provider passa a ler/gravar via API — as telas
// continuam usando os mesmos hooks (useStore).
import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { leads as seedLeads, tasks as seedTasks } from "./mock";
import { account } from "./tenant";
import type { Lead, LeadStatus, Task } from "./types";

export interface TaskRow extends Task {
  lead_id: string;
}

interface Store {
  leads: Lead[];
  getLead: (id: string) => Lead | undefined;
  addLead: (input: NewLeadInput) => Lead;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  moveStage: (id: string, stageId: string) => void;
  reassign: (id: string, ownerId: string) => void;
  setStatus: (id: string, status: LeadStatus, reason?: string) => void;

  tasks: TaskRow[];
  toggleTask: (taskId: string) => void;
  addTask: (leadId: string, title: string, dueAt: string) => void;
}

export interface NewLeadInput {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  persona: string;
  empreendimento_id: string;
  owner_id: string;
  origin: Lead["origin"];
  lt_source: string;
}

const Ctx = createContext<Store>(null!);
let counter = 100;
const uid = (p: string) => `${p}_${++counter}`;

const seedTaskRows: TaskRow[] = Object.entries(seedTasks).flatMap(([leadId, ts]) =>
  ts.map((t) => ({ ...t, lead_id: leadId }))
);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>(seedLeads);
  const [tasks, setTasks] = useState<TaskRow[]>(seedTaskRows);

  const getLead = useCallback((id: string) => leads.find((l) => l.id === id), [leads]);

  const addLead = useCallback((input: NewLeadInput): Lead => {
    const nowIso = new Date().toISOString();
    const lead: Lead = {
      id: uid("l"),
      account_id: account.id,
      empreendimento_id: input.empreendimento_id,
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      phone: input.phone,
      persona: input.persona,
      score: 30,
      stage_id: "s_novo",
      owner_id: input.owner_id,
      status: "active",
      origin: input.origin,
      ft_source: input.lt_source,
      lt_source: input.lt_source,
      followup_count: 0,
      created_at: nowIso,
      last_activity: nowIso,
      journey: [{ t: "agora", event: "Lead", detail: "Cadastrado manualmente no CRM" }],
      tags: [],
    };
    setLeads((ls) => [lead, ...ls]);
    return lead;
  }, []);

  const updateLead = useCallback((id: string, patch: Partial<Lead>) => {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch, last_activity: new Date().toISOString() } : l)));
  }, []);

  const moveStage = useCallback((id: string, stageId: string) => updateLead(id, { stage_id: stageId }), [updateLead]);
  const reassign = useCallback((id: string, ownerId: string) => updateLead(id, { owner_id: ownerId }), [updateLead]);
  const setStatus = useCallback(
    (id: string, status: LeadStatus, reason?: string) => updateLead(id, { status, discard_reason: reason }),
    [updateLead]
  );

  const toggleTask = useCallback((taskId: string) => {
    setTasks((ts) => ts.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)));
  }, []);

  const addTask = useCallback((leadId: string, title: string, dueAt: string) => {
    setTasks((ts) => [...ts, { id: uid("t"), lead_id: leadId, title, due_at: dueAt, done: false }]);
  }, []);

  return (
    <Ctx.Provider value={{ leads, getLead, addLead, updateLead, moveStage, reassign, setStatus, tasks, toggleTask, addTask }}>
      {children}
    </Ctx.Provider>
  );
}

export const useStore = () => useContext(Ctx);
