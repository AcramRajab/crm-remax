// Dados de demonstração (Now Residence). Estrutura espelha o Supabase.
// Troca-se este módulo pela API quando o backend entrar — as telas não mudam.
import type {
  Empreendimento, User, FunnelStage, Lead, Dossie, Message, Note, Task, Activity,
} from "./types";
import { account } from "./tenant";

const ACC = account.id;

export const empreendimentos: Empreendimento[] = [
  {
    id: "emp_now",
    account_id: ACC,
    slug: "now-residence",
    name: "NOW Residence",
    status: "active",
    construtora: "Grupo R.Gubert",
    units_label: "Lofts e aptos · 38–120 m²",
    personas: [
      "Investidor pré-lançamento",
      "Saúde & Medicina",
      "Universitário",
      "Terceira idade",
      "Casal novo",
      "Comércio exterior / portos",
    ],
  },
  {
    id: "emp_quadramar",
    account_id: ACC,
    slug: "quadramar",
    name: "Quadramar (em breve)",
    status: "paused",
    construtora: "Grupo R.Gubert",
    units_label: "Lançamento futuro",
    personas: [],
  },
];

export const users: User[] = [
  { id: "u_rodrigo", name: "Rodrigo Souza", role: "account_admin", avatar_color: "#0E4DA4" },
  { id: "u_acram", name: "Acram", role: "broker", avatar_color: "#C2006F" },
  { id: "u_julia", name: "Júlia Martins", role: "broker", avatar_color: "#0F766E" },
];

export const stages: FunnelStage[] = [
  { id: "s_novo", name: "Novo", phase: "topo", position: 0 },
  { id: "s_contato", name: "Contato iniciado", phase: "topo", position: 1 },
  { id: "s_followup", name: "Em follow-up", phase: "meio", position: 2 },
  { id: "s_qualificado", name: "Qualificado", phase: "meio", position: 3 },
  { id: "s_reuniao", name: "Reunião agendada", phase: "fundo", position: 4 },
  { id: "s_proposta", name: "Proposta", phase: "fundo", position: 5 },
];

export const phaseLabel: Record<string, string> = {
  topo: "Topo de funil",
  meio: "Meio · follow-up",
  fundo: "Fundo · fechamento",
};

const now = Date.now();
const ago = (mins: number) => new Date(now - mins * 60000).toISOString();

export const leads: Lead[] = [
  {
    id: "l_1", account_id: ACC, empreendimento_id: "emp_now",
    first_name: "Marina", last_name: "Albuquerque",
    email: "marina.alb@gmail.com", phone: "(47) 99988-1020",
    persona: "Investidor pré-lançamento", score: 88,
    stage_id: "s_qualificado", owner_id: "u_acram", status: "active",
    origin: "inbound", ft_source: "Meta · Anúncio Short Stay", lt_source: "Google · Busca NOW",
    followup_count: 4, created_at: ago(60 * 26), last_activity: ago(35),
    journey: [
      { t: "há 2 d", event: "Anúncio", detail: "Clique no anúncio 'Short Stay Itajaí' (Meta)" },
      { t: "há 2 d", event: "PageView", detail: "Hero / Viva o Agora" },
      { t: "há 2 d", event: "ViewContent", detail: "Plantas — Loft Plus 44 m² (3x)" },
      { t: "há 1 d", event: "PageView", detail: "Localização & valorização" },
      { t: "há 35 min", event: "Lead", detail: "Formulário — interesse: Investir (renda)" },
    ],
  },
  {
    id: "l_2", account_id: ACC, empreendimento_id: "emp_now",
    first_name: "Dr. Paulo", last_name: "Renner",
    email: "paulo.renner@hotmail.com", phone: "(11) 98123-4477",
    persona: "Saúde & Medicina", score: 74,
    stage_id: "s_reuniao", owner_id: "u_julia", status: "active",
    origin: "inbound", ft_source: "Google · Busca", lt_source: "WhatsApp · CTWA",
    followup_count: 6, created_at: ago(60 * 50), last_activity: ago(180),
    journey: [
      { t: "há 3 d", event: "PageView", detail: "Hero (busca: apartamento perto Hospital Marieta)" },
      { t: "há 3 d", event: "ViewContent", detail: "Localização — Hospital Marieta 5–10 min" },
      { t: "há 2 d", event: "Lead", detail: "Clique no WhatsApp do anúncio (CTWA)" },
      { t: "há 3 h", event: "Reunião", detail: "Agendou visita ao decorado" },
    ],
  },
  {
    id: "l_3", account_id: ACC, empreendimento_id: "emp_now",
    first_name: "Letícia", last_name: "Campos",
    email: "leticia.campos@outlook.com", phone: "(47) 99654-8800",
    persona: "Casal novo", score: 52,
    stage_id: "s_followup", owner_id: "u_acram", status: "active",
    origin: "inbound", ft_source: "Instagram · Reels", lt_source: "Instagram · Reels",
    followup_count: 2, created_at: ago(60 * 12), last_activity: ago(90),
    journey: [
      { t: "há 12 h", event: "Anúncio", detail: "Reels — '100 parcelas, renda a partir de R$15k'" },
      { t: "há 12 h", event: "PageView", detail: "Plantas — 1 dormitório" },
      { t: "há 90 min", event: "Lead", detail: "Formulário — interesse: Morar" },
    ],
  },
  {
    id: "l_4", account_id: ACC, empreendimento_id: "emp_now",
    first_name: "Seu Antônio", last_name: "Vieira",
    email: "antonio.vieira@gmail.com", phone: "(47) 99111-2233",
    persona: "Terceira idade", score: 61,
    stage_id: "s_contato", owner_id: "u_julia", status: "active",
    origin: "indicacao", ft_source: "Indicação · cliente", lt_source: "Indicação · cliente",
    followup_count: 1, created_at: ago(60 * 5), last_activity: ago(48),
    journey: [
      { t: "há 5 h", event: "PageView", detail: "Localização — farmácias e mercado próximos" },
      { t: "há 50 min", event: "Lead", detail: "WhatsApp — 'quero algo compacto e prático'" },
    ],
  },
  {
    id: "l_5", account_id: ACC, empreendimento_id: "emp_now",
    first_name: "Bruno", last_name: "Tavares",
    email: "bruno.tsa@empresa.com.br", phone: "(11) 97766-5500",
    persona: "Comércio exterior / portos", score: 69,
    stage_id: "s_novo", owner_id: "u_acram", status: "active",
    origin: "outbound", ft_source: "LinkedIn · Outbound", lt_source: "Meta · Remarketing",
    followup_count: 0, created_at: ago(40), last_activity: ago(40),
    journey: [
      { t: "há 40 min", event: "PageView", detail: "Hero (origem: remarketing portos)" },
      { t: "há 38 min", event: "ViewContent", detail: "Localização — Balsa / portos" },
      { t: "há 36 min", event: "Lead", detail: "Formulário — interesse: Investir" },
    ],
  },
  {
    id: "l_6", account_id: ACC, empreendimento_id: "emp_now",
    first_name: "Camila", last_name: "Reis",
    email: "camila.reis@univali.br", phone: "(47) 99877-1212",
    persona: "Universitário", score: 35,
    stage_id: "s_novo", owner_id: "u_julia", status: "active",
    origin: "inbound", ft_source: "TikTok", lt_source: "TikTok",
    followup_count: 0, created_at: ago(20), last_activity: ago(20),
    journey: [
      { t: "há 20 min", event: "Anúncio", detail: "TikTok — 'morar a 5 min da Univali'" },
      { t: "há 19 min", event: "Lead", detail: "Formulário — interesse: Morar" },
    ],
  },
  {
    id: "l_7", account_id: ACC, empreendimento_id: "emp_now",
    first_name: "Eduardo", last_name: "Lima",
    email: "edu.lima@gmail.com", phone: "(47) 99432-7788",
    persona: "Investidor pré-lançamento", score: 80,
    stage_id: "s_proposta", owner_id: "u_acram", status: "active",
    origin: "inbound", ft_source: "Google Ads", lt_source: "WhatsApp",
    followup_count: 8, created_at: ago(60 * 120), last_activity: ago(60 * 6),
    journey: [
      { t: "há 5 d", event: "PageView", detail: "Hero" },
      { t: "há 5 d", event: "ViewContent", detail: "Diferenciais — Gestão Housi / rentabilidade" },
      { t: "há 4 d", event: "Lead", detail: "Formulário — interesse: Investir" },
      { t: "há 6 h", event: "Proposta", detail: "Recebeu tabela 60/40" },
    ],
  },
  {
    id: "l_8", account_id: ACC, empreendimento_id: "emp_now",
    first_name: "Fernanda", last_name: "Goulart",
    email: "fer.goulart@gmail.com", phone: "(48) 99100-3030",
    persona: "Saúde & Medicina", score: 45,
    stage_id: "s_followup", owner_id: "u_julia", status: "active",
    origin: "inbound", ft_source: "Meta", lt_source: "E-mail",
    followup_count: 3, created_at: ago(60 * 40), last_activity: ago(60 * 10),
    journey: [
      { t: "há 2 d", event: "PageView", detail: "Localização — hospitais" },
      { t: "há 2 d", event: "Lead", detail: "Formulário" },
    ],
  },
];

export const dossies: Record<string, Dossie> = {
  l_1: {
    lead_id: "l_1",
    summary:
      "Marina visitou as plantas de Loft Plus (1 dorm.) 3 vezes e chegou por anúncio de short-stay. Forte indício de investidora de pré-lançamento buscando renda por locação por temporada.",
    angle:
      "Abordar pelo ângulo de valorização (14–20%/ano na região) + gestão Housi para renda passiva. Mencionar a facilidade de até 100 parcelas e a solidez da R.Gubert (segurança do investidor).",
    signals: [
      "3 visualizações da planta Loft Plus 44 m²",
      "Origem: anúncio Short Stay (Meta)",
      "Tempo alto na seção de valorização",
      "Interesse declarado: Investir (renda)",
    ],
    model: "openrouter/claude · estimado",
    generated_at: ago(34),
  },
  l_2: {
    lead_id: "l_2",
    summary:
      "Dr. Paulo buscou ativamente por imóvel próximo ao Hospital Marieta e converteu via clique no WhatsApp do anúncio (CTWA). Perfil médico que quer morar perto sem segunda casa grande.",
    angle:
      "Foco em praticidade e proximidade dos hospitais (Marieta 5–10 min). Destacar acesso digital, academia e áreas comuns inteligentes. Já agendou visita — confirmar presença e levar tabela.",
    signals: [
      "Busca: 'apartamento perto Hospital Marieta'",
      "Conversão por CTWA (WhatsApp)",
      "Reunião agendada",
      "6 contatos de follow-up",
    ],
    model: "openrouter/claude · estimado",
    generated_at: ago(170),
  },
};

export const messages: Record<string, Message[]> = {
  l_1: [
    { id: "m1", channel: "whatsapp", direction: "outbound", body: "Oi Marina! Aqui é o Acram, da REMAX. Vi seu interesse no NOW Residence 🙂", at: ago(33), status: "read" },
    { id: "m2", channel: "whatsapp", direction: "inbound", body: "Oi! Sim, quero entender a parte de rentabilidade pra locação por temporada.", at: ago(30) },
    { id: "m3", channel: "whatsapp", direction: "outbound", body: "Perfeito. O NOW é gerido pela Housi, então você pode deixar no curto prazo e acompanhar pelo app. Te mando uma simulação?", at: ago(28), status: "read" },
    { id: "m4", channel: "whatsapp", direction: "inbound", body: "Manda sim! E qual a entrada?", at: ago(12) },
  ],
  l_2: [
    { id: "m1", channel: "whatsapp", direction: "inbound", body: "Boa tarde, vi o anúncio. É perto do Hospital Marieta mesmo?", at: ago(60 * 40) },
    { id: "m2", channel: "whatsapp", direction: "outbound", body: "Boa tarde, Dr. Paulo! Sim, 5 a 10 min do Marieta. Posso te mostrar o decorado nesta semana?", at: ago(60 * 39), status: "read" },
    { id: "m3", channel: "email", direction: "outbound", body: "Confirmação de visita — quinta, 16h. Endereço e estacionamento em anexo.", at: ago(60 * 5), status: "delivered" },
  ],
};

export const notes: Record<string, Note[]> = {
  l_1: [
    { id: "n1", author: "Acram", body: "Investidora bem informada. Já comparou com lançamento concorrente (entrega 2028). Reforçar histórico da R.Gubert.", at: ago(20) },
  ],
  l_2: [
    { id: "n1", author: "Júlia", body: "Médico, mora 1 semana SP / 1 semana SC. Quer compacto bem localizado. Decisor rápido.", at: ago(60 * 20) },
  ],
};

export const tasks: Record<string, Task[]> = {
  l_1: [
    { id: "t1", title: "Enviar simulação de rentabilidade (Housi)", due_at: ago(-60), done: false },
    { id: "t2", title: "5º contato — ligar sobre entrada", due_at: ago(-60 * 24), done: false },
  ],
  l_2: [
    { id: "t1", title: "Confirmar visita de quinta 16h", due_at: ago(-60 * 5), done: false },
  ],
};

export const activities: Record<string, Activity[]> = {
  l_1: [
    { id: "a1", type: "dossie", text: "Dossiê gerado por IA na entrada do lead", at: ago(34) },
    { id: "a2", type: "stage_change", text: "Movido para 'Qualificado'", at: ago(25) },
    { id: "a3", type: "contact", text: "Contato por WhatsApp (4º follow-up)", at: ago(12) },
    { id: "a4", type: "note", text: "Anotação adicionada por Acram", at: ago(20) },
  ],
  l_2: [
    { id: "a1", type: "dossie", text: "Dossiê gerado por IA na entrada do lead", at: ago(170) },
    { id: "a2", type: "stage_change", text: "Movido para 'Reunião agendada'", at: ago(180) },
  ],
};

// ---- Tracking / comportamento de navegação ----
import type { TrackingProfile } from "./types";

const trackingProfiles: Record<string, TrackingProfile> = {
  l_1: {
    lead_id: "l_1",
    visitor_ids: ["v_8f3a…c21", "v_2b9e…77a"], // 2 devices → mesclados no stitching
    email_hash: "sha256:9b1c…e4f2",
    sessions_count: 4, pageviews_count: 23, total_time_sec: 1142,
    first_seen: ago(60 * 50), last_seen: ago(35),
    geo: "Itajaí, SC",
    devices: [
      { type: "mobile", browser: "Instagram WebView", os: "iOS 17" },
      { type: "desktop", browser: "Chrome", os: "Windows" },
    ],
    channel_path: ["Meta Ads", "Direto", "Google", "Meta Ads"],
    utm: { source: "facebook", medium: "paid_social", campaign: "now_short_stay_itajai", content: "loft_plus_carrossel" },
    click_ids: [
      { key: "fbclid", value: "IwAR2…9kPq" },
      { key: "fbp", value: "fb.1.169…442" },
    ],
    top_pages: [
      { path: "/plantas", title: "Plantas — Loft Plus 44 m²", views: 3, time_sec: 312, scroll: 86 },
      { path: "/#valorizacao", title: "Localização & valorização", views: 2, time_sec: 268, scroll: 74 },
      { path: "/", title: "Hero / Viva o Agora", views: 4, time_sec: 190, scroll: 40 },
      { path: "/#diferenciais", title: "Diferenciais — Gestão Housi", views: 2, time_sec: 154, scroll: 61 },
    ],
    intent_signals: [
      { label: "Viu plantas 3× (Loft Plus)", weight: "alto" },
      { label: "Voltou ao site em 2 dias", weight: "alto" },
      { label: "Tempo alto em 'valorização'", weight: "medio" },
      { label: "Converteu por formulário", weight: "alto" },
    ],
    sessions: [
      {
        id: "se1", started_at: ago(60 * 50), device: { type: "mobile", browser: "Instagram WebView", os: "iOS 17" },
        channel: "Meta Ads · now_short_stay", duration_sec: 214,
        events: [
          { at: ago(60 * 50), name: "Click", detail: "Clique no anúncio 'Short Stay Itajaí'", meta: "fbclid" },
          { at: ago(60 * 50 + 0), name: "PageView", detail: "Hero / Viva o Agora", meta: "48s" },
          { at: ago(60 * 49), name: "Scroll", detail: "Rolou até Plantas", meta: "55%" },
          { at: ago(60 * 49), name: "ViewContent", detail: "Planta Loft Plus 44 m²", meta: "1m 02s" },
        ],
      },
      {
        id: "se2", started_at: ago(60 * 27), device: { type: "desktop", browser: "Chrome", os: "Windows" },
        channel: "Google · busca 'NOW Residence'", duration_sec: 486,
        events: [
          { at: ago(60 * 27), name: "PageView", detail: "Hero (origem: busca direta)", meta: "22s" },
          { at: ago(60 * 27), name: "ViewContent", detail: "Plantas — Loft Plus (2ª e 3ª vez)", meta: "3m 10s" },
          { at: ago(60 * 26), name: "ViewContent", detail: "Localização & valorização", meta: "2m 14s" },
        ],
      },
      {
        id: "se3", started_at: ago(40), device: { type: "desktop", browser: "Chrome", os: "Windows" },
        channel: "Direto", duration_sec: 132,
        events: [
          { at: ago(40), name: "PageView", detail: "Diferenciais — Gestão Housi", meta: "1m 32s" },
          { at: ago(35), name: "Lead", detail: "Formulário enviado — interesse: Investir (renda)", meta: "conversão" },
        ],
      },
    ],
  },
  l_2: {
    lead_id: "l_2",
    visitor_ids: ["v_55de…901"],
    email_hash: "sha256:1a77…b0c9",
    sessions_count: 3, pageviews_count: 11, total_time_sec: 548,
    first_seen: ago(60 * 72), last_seen: ago(180),
    geo: "São Paulo, SP → Itajaí, SC",
    devices: [{ type: "mobile", browser: "Safari", os: "iOS 17" }],
    channel_path: ["Google", "WhatsApp (CTWA)"],
    utm: { source: "google", medium: "organic", campaign: "(not set)" },
    click_ids: [{ key: "ctwa_clid", value: "ARAa…77Z" }],
    top_pages: [
      { path: "/#localizacao", title: "Localização — Hospital Marieta", views: 2, time_sec: 188, scroll: 70 },
      { path: "/", title: "Hero", views: 2, time_sec: 96, scroll: 35 },
      { path: "/#lazer", title: "Lazer — academia / áreas comuns", views: 1, time_sec: 84, scroll: 52 },
    ],
    intent_signals: [
      { label: "Busca: 'apartamento perto Hospital Marieta'", weight: "alto" },
      { label: "Converteu por WhatsApp (CTWA)", weight: "alto" },
      { label: "Reunião agendada", weight: "alto" },
    ],
    sessions: [
      {
        id: "se1", started_at: ago(60 * 72), device: { type: "mobile", browser: "Safari", os: "iOS 17" },
        channel: "Google · busca orgânica", duration_sec: 210,
        events: [
          { at: ago(60 * 72), name: "PageView", detail: "Hero (busca: apto perto Marieta)", meta: "31s" },
          { at: ago(60 * 72), name: "ViewContent", detail: "Localização — Hospital Marieta 5–10 min", meta: "2m 08s" },
        ],
      },
      {
        id: "se2", started_at: ago(60 * 48), device: { type: "mobile", browser: "Safari", os: "iOS 17" },
        channel: "WhatsApp (CTWA)", duration_sec: 64,
        events: [
          { at: ago(60 * 48), name: "Click", detail: "Clique no WhatsApp do anúncio", meta: "ctwa_clid" },
          { at: ago(60 * 48), name: "Lead", detail: "Conversão por WhatsApp", meta: "conversão" },
        ],
      },
    ],
  },
};

// Sintetiza um perfil quando não há dado detalhado, a partir do lead.
function synthTracking(leadId: string): TrackingProfile {
  const l = getLead(leadId)!;
  const sigs = l.journey
    .filter((j) => j.event === "ViewContent" || j.event === "Lead")
    .map((j) => ({ label: j.detail, weight: (j.event === "Lead" ? "alto" : "medio") as "alto" | "medio" }));
  return {
    lead_id: leadId,
    visitor_ids: ["v_" + leadId.slice(-1) + "a1…f0"],
    email_hash: "sha256:••••",
    sessions_count: Math.max(1, Math.ceil(l.journey.length / 3)),
    pageviews_count: l.journey.filter((j) => j.event === "PageView" || j.event === "ViewContent").length || l.journey.length,
    total_time_sec: 60 + l.score * 4,
    first_seen: l.created_at, last_seen: l.last_activity,
    geo: "Itajaí, SC",
    devices: [{ type: "mobile", browser: "Chrome", os: "Android" }],
    channel_path: [l.ft_source.split(" · ")[0], l.lt_source.split(" · ")[0]].filter((v, i, a) => a.indexOf(v) === i),
    utm: { source: l.ft_source.toLowerCase().split(" ")[0], medium: l.origin === "outbound" ? "outbound" : "paid", campaign: l.empreendimento_id },
    click_ids: l.lt_source.toLowerCase().includes("whats") ? [{ key: "ctwa_clid", value: "ARA…" }] : [{ key: "fbclid", value: "IwA…" }],
    top_pages: l.journey
      .filter((j) => j.event !== "Lead")
      .slice(0, 4)
      .map((j, i) => ({ path: "/", title: j.detail, views: 1, time_sec: 60 - i * 8, scroll: 60 - i * 7 })),
    intent_signals: sigs.length ? sigs : [{ label: "Visitou a landing page", weight: "baixo" }],
    sessions: [
      {
        id: "se1", started_at: l.created_at,
        device: { type: "mobile", browser: "Chrome", os: "Android" },
        channel: l.ft_source, duration_sec: 60 + l.score * 3,
        events: l.journey.map((j) => ({
          at: l.created_at,
          name: (["PageView", "Scroll", "ViewContent", "Lead", "Click"].includes(j.event) ? j.event : "PageView") as any,
          detail: j.detail,
          meta: j.t,
        })),
      },
    ],
  };
}

// Só sintetiza perfil pra lead que existe no mock (demo). Pra lead REAL do banco,
// ainda não há perfil de navegação -> retorna undefined e o TrackingPanel mostra
// o estado vazio em vez de quebrar (synthTracking faria getLead()! -> crash).
export const getTracking = (leadId: string): TrackingProfile | undefined =>
  trackingProfiles[leadId] || (getLead(leadId) ? synthTracking(leadId) : undefined);

// ---- getters ----
export const getLead = (id: string) => leads.find((l) => l.id === id);
export const getUser = (id: string) => users.find((u) => u.id === id);
export const getStage = (id: string) => stages.find((s) => s.id === id);
export const getEmp = (id: string) => empreendimentos.find((e) => e.id === id);
