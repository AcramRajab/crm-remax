// Store do CRM. Lê os leads REAIS do Supabase (crm_leads, isolados por RLS).
// As mutações (mover etapa, reatribuir, etc.) são otimistas/locais nesta fase;
// persistir as escritas no Supabase é a Fase 2.
import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth";
import { account } from "./tenant";
import type { Lead, LeadStatus, Task, FunnelStage, CampoDef } from "./types";

// Membro real da conta (core_usuarios) — usado nos seletores de responsável.
export interface Member { id: string; name: string; role: string }

export interface TaskRow extends Task {
  lead_id: string;
}

// Empreendimento REAL (core_empreendimentos, isolado por RLS). Fonte única —
// nada de mock/demo (era de onde vinha o "Quadramar" fantasma).
export interface Emp {
  id: string;
  slug: string;
  name: string;
  status: string;
  construtora: string | null;
  landing_page_url: string | null;
  personas: string[];
  details: Record<string, any>;
}

interface Store {
  leads: Lead[];
  loading: boolean;
  reload: () => void;
  getLead: (id: string) => Lead | undefined;
  emps: Emp[];
  getEmp: (id: string) => Emp | undefined;
  stages: FunnelStage[];
  getStage: (id: string) => FunnelStage | undefined;
  members: Member[];
  getMember: (id: string) => Member | undefined;
  campos: CampoDef[];
  addLead: (input: NewLeadInput) => Lead;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  logActivity: (leadId: string, kind: string, detail?: any) => Promise<void>;
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
  // journey vem do Worker como OBJETO {channel, corretor_ref, indicador, ...}.
  const j = r.journey && typeof r.journey === "object" && !Array.isArray(r.journey) ? r.journey : {};
  const chLabel = j.channel === "whatsapp" ? "WhatsApp" : j.channel === "form" ? "Formulário (LP)" : null;
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
    valor: r.valor ?? null,
    stage_id: r.stage_id || "",         // vazio -> cai na 1ª etapa real (resolvido na UI)
    owner_id: r.owner_id || "",
    status: (r.status as LeadStatus) || "active",
    origin: (r.origin as Lead["origin"]) || "inbound",
    ft_source: r.ft_source || chLabel || "Formulário",
    lt_source: r.lt_source || chLabel || "Formulário (LP)",
    ft_medium: r.ft_medium || null,
    lt_medium: r.lt_medium || null,
    ft_campaign: r.ft_campaign || null,
    lt_campaign: r.lt_campaign || null,
    followup_count: r.followup_count ?? 0,
    created_at: r.created_at,
    last_activity: r.updated_at || r.created_at,
    journey: [],
    tags: Array.isArray(r.tags) ? r.tags : [],
    channel: j.channel || null,
    corretor_ref: j.corretor_ref || null,
    indicador: j.indicador || null,
    campos: r.campos && typeof r.campos === "object" ? r.campos : {},
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [emps, setEmps] = useState<Emp[]>([]);
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [campos, setCampos] = useState<CampoDef[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  const reload = useCallback(async () => {
    // Leads + empreendimentos REAIS, ambos isolados por RLS na conta logada.
    const [leadsRes, empsRes, stagesRes, membersRes, tasksRes, camposRes] = await Promise.all([
      supabase.from("crm_leads").select("*").order("created_at", { ascending: false }),
      supabase
        .from("core_empreendimentos")
        .select("id, slug, name, status, construtora, landing_page_url, personas, details")
        .order("created_at", { ascending: true }),
      supabase.from("crm_funil_etapas").select("id, name, phase, position").order("position", { ascending: true }),
      supabase.from("core_usuarios").select("user_id, name, email, role").order("created_at", { ascending: true }),
      supabase.from("crm_tarefas").select("id, lead_id, title, due_at, done").order("due_at", { ascending: true }),
      supabase.from("crm_campos").select("id, nome, tipo, opcoes, posicao").order("posicao", { ascending: true }),
    ]);
    if (!leadsRes.error && leadsRes.data) setLeads(leadsRes.data.map(mapLead));
    if (!empsRes.error && empsRes.data) setEmps(empsRes.data as Emp[]);
    if (!stagesRes.error && stagesRes.data) setStages(stagesRes.data as FunnelStage[]);
    if (!membersRes.error && membersRes.data) {
      setMembers(membersRes.data.map((m: any) => ({
        id: m.user_id,
        name: m.name || (m.email ? m.email.split("@")[0] : "—"),
        role: m.role,
      })));
    }
    if (!tasksRes.error && tasksRes.data) setTasks(tasksRes.data as TaskRow[]);
    if (!camposRes.error && camposRes.data) {
      setCampos(camposRes.data.map((c: any) => ({ ...c, opcoes: Array.isArray(c.opcoes) ? c.opcoes : [] })) as CampoDef[]);
    }
    setLoading(false);
  }, []);

  // Reage à SESSÃO (do auth) — NÃO chama o Supabase dentro do onAuthStateChange
  // (isso trava: o callback segura o lock do auth e a query nunca volta).
  useEffect(() => {
    if (session) { setLoading(true); reload(); }
    else { setLeads([]); setEmps([]); setLoading(false); }
  }, [session, reload]);

  const getLead = useCallback((id: string) => leads.find((l) => l.id === id), [leads]);
  const getEmp = useCallback((id: string) => emps.find((e) => e.id === id), [emps]);
  const getStage = useCallback((id: string) => stages.find((s) => s.id === id), [stages]);
  const getMember = useCallback((id: string) => members.find((m) => m.id === id), [members]);

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

  // Colunas reais de crm_leads que o app persiste. stage_id/owner_id agora usam
  // dados reais (crm_funil_etapas / core_usuarios), então também gravam.
  const DB_COLS = new Set([
    "valor", "first_name", "last_name", "email", "phone",
    "persona", "score", "status", "discard_reason", "followup_count",
    "stage_id", "owner_id", "campos", "tags",
  ]);
  const UUID_COLS = new Set(["stage_id", "owner_id"]);

  const updateLead = useCallback((id: string, patch: Partial<Lead>) => {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch, last_activity: new Date().toISOString() } : l)));
    // Persiste no Supabase só os campos reais (RLS garante isolamento por conta).
    const VALID_STATUS = ["active", "won", "lost", "discarded"];
    const dbPatch: Record<string, any> = {};
    for (const k of Object.keys(patch)) {
      if (!DB_COLS.has(k)) continue;
      let v = (patch as any)[k];
      if (v === undefined) continue;                                   // nunca envia undefined
      if (UUID_COLS.has(k) && v === "") v = null;                      // FK: vazio -> null
      if (k === "status" && !VALID_STATUS.includes(v)) continue;       // enum: nunca envia status inválido/vazio
      dbPatch[k] = v;
    }
    if (Object.keys(dbPatch).length) {
      dbPatch.updated_at = new Date().toISOString();
      supabase.from("crm_leads").update(dbPatch).eq("id", id).select("id").then(({ data, error }) => {
        if (error) {
          console.error("updateLead persist falhou:", error);
          try { alert("Erro ao salvar no banco: " + (error.message || JSON.stringify(error))); } catch {}
        } else if (!data || data.length === 0) {
          try { alert("Salvou 0 linhas (provável RLS/permissão). Campos: " + Object.keys(dbPatch).join(", ")); } catch {}
        }
      });
    }
  }, []);

  // Registra um evento na timeline do lead (crm_atividades).
  const logActivity = useCallback(async (leadId: string, kind: string, detail: any = {}) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    const { data: auth } = await supabase.auth.getUser();
    await supabase.from("crm_atividades").insert({
      account_id: lead.account_id, lead_id: leadId, actor_id: auth?.user?.id || null, kind, detail,
    });
  }, [leads]);

  const moveStage = useCallback((id: string, stageId: string) => updateLead(id, { stage_id: stageId }), [updateLead]);
  const reassign = useCallback((id: string, ownerId: string) => updateLead(id, { owner_id: ownerId }), [updateLead]);
  const setStatus = useCallback(
    (id: string, status: LeadStatus, reason?: string) => updateLead(id, { status, discard_reason: reason }),
    [updateLead]
  );

  const toggleTask = useCallback((taskId: string) => {
    const cur = tasks.find((t) => t.id === taskId);
    const nd = !cur?.done;
    setTasks((ts) => ts.map((t) => (t.id === taskId ? { ...t, done: nd } : t)));
    supabase.from("crm_tarefas").update({ done: nd }).eq("id", taskId).then(() => {});
  }, [tasks]);

  const addTask = useCallback(async (leadId: string, title: string, dueAt: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    const { data } = await supabase.from("crm_tarefas")
      .insert({ account_id: lead.account_id, lead_id: leadId, title, due_at: dueAt, done: false })
      .select("id, lead_id, title, due_at, done").single();
    if (data) setTasks((ts) => [...ts, data as TaskRow]);
  }, [leads]);

  return (
    <Ctx.Provider value={{ leads, loading, reload, getLead, emps, getEmp, stages, getStage, members, getMember, campos, addLead, updateLead, logActivity, moveStage, reassign, setStatus, tasks, toggleTask, addTask }}>
      {children}
    </Ctx.Provider>
  );
}

export const useStore = () => useContext(Ctx);
