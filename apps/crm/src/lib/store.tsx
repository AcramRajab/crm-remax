// Store do CRM. Lê os leads REAIS do Supabase (crm_leads, isolados por RLS).
// As mutações (mover etapa, reatribuir, etc.) são otimistas/locais nesta fase;
// persistir as escritas no Supabase é a Fase 2.
import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth";
import { account } from "./tenant";
import type { Lead, LeadStatus, Task } from "./types";

export interface TaskRow extends Task {
  lead_id: string;
}

interface Store {
  leads: Lead[];
  loading: boolean;
  reload: () => void;
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

// crm_leads (banco) -> Lead (app). Defaults seguros pra não quebrar a UI.
function mapLead(r: any): Lead {
  return {
    id: r.id,
    account_id: r.account_id,
    empreendimento_id: r.empreendimento_id || "",
    first_name: r.first_name || "",
    last_name: r.last_name || "",
    email: r.email || "",
    phone: r.phone || "",
    persona: r.persona || "—",
    score: r.score ?? 0,
    stage_id: r.stage_id || "s_novo",   // cai na 1ª coluna do funil
    owner_id: r.owner_id || "",
    status: (r.status as LeadStatus) || "active",
    origin: (r.origin as Lead["origin"]) || "inbound",
    ft_source: r.ft_source || "Formulário",
    lt_source: r.lt_source || "Formulário (LP)",
    followup_count: r.followup_count ?? 0,
    created_at: r.created_at,
    last_activity: r.updated_at || r.created_at,
    journey: [],
    tags: [],
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from("crm_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setLeads(data.map(mapLead));
    setLoading(false);
  }, []);

  // Reage à SESSÃO (do auth) — NÃO chama o Supabase dentro do onAuthStateChange
  // (isso trava: o callback segura o lock do auth e a query nunca volta).
  useEffect(() => {
    if (session) { setLoading(true); reload(); }
    else { setLeads([]); setLoading(false); }
  }, [session, reload]);

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
    <Ctx.Provider value={{ leads, loading, reload, getLead, addLead, updateLead, moveStage, reassign, setStatus, tasks, toggleTask, addTask }}>
      {children}
    </Ctx.Provider>
  );
}

export const useStore = () => useContext(Ctx);
