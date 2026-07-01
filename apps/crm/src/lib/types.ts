// Tipos do domínio — espelham o schema do Supabase (supabase/migrations/*).
// Quando o backend entrar, estes tipos viram a fonte e o mock é trocado pela API.

export type Role = "super_admin" | "account_admin" | "broker";
export type LeadStatus = "active" | "won" | "lost" | "discarded";
export type FunnelPhase = "topo" | "meio" | "fundo";
export type MsgChannel = "whatsapp" | "email";
export type MsgDirection = "inbound" | "outbound";
export type Origin = "inbound" | "outbound" | "indicacao";

export interface Account {
  id: string;
  slug: string;
  name: string;
  brand_name: string;
  logo_text: string; // placeholder do logo (texto) até ter o SVG da conta
  primary_color: string; // hex — white-label
  custom_domain?: string;
}

export interface Empreendimento {
  id: string;
  account_id: string;
  slug: string;
  name: string;
  status: "active" | "paused" | "archived";
  construtora?: string;
  personas: string[];
  cover?: string;
  units_label?: string;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar_color: string;
}

export interface FunnelStage {
  id: string;
  name: string;
  phase: FunnelPhase;
  position: number;
}

export interface JourneyStep {
  t: string; // rótulo de tempo relativo
  event: string; // PageView, ViewContent, Lead...
  detail: string;
}

export interface Lead {
  id: string;
  account_id: string;
  empreendimento_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  persona: string;
  score: number;
  valor?: number | null;        // valor do negócio (R$) — pipeline/forecast
  stage_id: string;
  owner_id: string;
  status: LeadStatus;
  origin: Origin;
  ft_source: string; // first-touch
  lt_source: string; // last-touch
  followup_count: number;
  created_at: string; // ISO
  last_activity: string; // ISO
  journey: JourneyStep[];
  tags?: string[];
  discard_reason?: string;
  // Origem do lead (gravado pelo Worker no journey jsonb):
  channel?: string | null;              // form | whatsapp
  corretor_ref?: string | null;         // código do ?c= no link
  indicador?: { nome?: string | null; imobiliaria?: string | null; telefone?: string | null } | null;
}

export interface Dossie {
  lead_id: string;
  summary: string;
  angle: string;
  signals: string[];
  model: string;
  generated_at: string;
}

export interface Message {
  id: string;
  channel: MsgChannel;
  direction: MsgDirection;
  body: string;
  at: string; // ISO
  status?: "sent" | "delivered" | "read";
}

export interface Note {
  id: string;
  author: string;
  body: string;
  at: string;
}

export interface Task {
  id: string;
  title: string;
  due_at: string;
  done: boolean;
}

export interface Activity {
  id: string;
  type: "stage_change" | "contact" | "dossie" | "system" | "note";
  text: string;
  at: string;
}

// ---- Tracking / comportamento de navegação (do tracking-kit → tracking_events) ----
export interface Device {
  type: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
}

export interface TopPage {
  path: string;
  title: string;
  views: number;
  time_sec: number;
  scroll: number; // % de profundidade de rolagem
}

export interface IntentSignal {
  label: string;
  weight: "alto" | "medio" | "baixo";
}

export interface ClickId {
  key: string; // gclid, fbclid, ctwa_clid…
  value: string;
}

export interface TrackEvent {
  at: string; // ISO
  name: "PageView" | "Scroll" | "ViewContent" | "Lead" | "Click" | "Session";
  detail: string;
  meta?: string; // ex.: "1m 12s", "80% scroll"
}

export interface TrackSession {
  id: string;
  started_at: string;
  device: Device;
  channel: string; // origem da sessão
  duration_sec: number;
  events: TrackEvent[];
}

export interface TrackingProfile {
  lead_id: string;
  visitor_ids: string[];
  email_hash: string;
  sessions_count: number;
  pageviews_count: number;
  total_time_sec: number;
  first_seen: string;
  last_seen: string;
  geo: string;
  devices: Device[];
  channel_path: string[]; // jornada multi-touch (ordem dos canais)
  utm: { source: string; medium: string; campaign: string; content?: string };
  click_ids: ClickId[];
  top_pages: TopPage[];
  intent_signals: IntentSignal[];
  sessions: TrackSession[];
}
