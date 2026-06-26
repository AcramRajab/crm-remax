import { useState, useEffect, useCallback } from "react";
import {
  Palette, Shuffle, Users as UsersIcon, KeyRound,
  Check, Info, Plus, Shield, X, Loader2, Copy,
} from "lucide-react";
import { account } from "../lib/tenant";
import { supabase } from "../lib/supabase";
import { Avatar } from "../components/Avatar";

// Papéis reais (enum app_role no banco).
const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super admin",
  account_admin: "Admin da conta",
  broker: "Corretor",
};

interface Member {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  role: string;
}

type Tab = "marca" | "distribuicao" | "equipe" | "credenciais";

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: "marca", label: "Marca (white-label)", icon: Palette },
  { id: "distribuicao", label: "Distribuição", icon: Shuffle },
  { id: "equipe", label: "Equipe & papéis", icon: UsersIcon },
  { id: "credenciais", label: "Credenciais", icon: KeyRound },
];

export default function Config() {
  const [tab, setTab] = useState<Tab>("marca");
  return (
    <div className="p-6 max-w-[980px] mx-auto">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-extrabold text-ink">Configurações da conta</h1>
        <p className="text-sm text-ink-soft">{account.name} · {account.custom_domain}</p>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id ? "border-brand text-brand" : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "marca" && <Marca />}
      {tab === "distribuicao" && <Distribuicao />}
      {tab === "equipe" && <Equipe />}
      {tab === "credenciais" && <Credenciais />}
    </div>
  );
}

/* ---------------- Marca / white-label ---------------- */
function Marca() {
  const [name, setName] = useState(account.brand_name);
  const [color, setColor] = useState(account.primary_color);

  function setBrandColor(hex: string) {
    setColor(hex);
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    document.documentElement.style.setProperty("--brand", `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`);
  }

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <Section title="Identidade da conta" desc="A marca é por conta (white-label). Trocar aqui muda o produto inteiro — sem código.">
        <Field label="Nome da marca">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Cor primária">
          <div className="flex items-center gap-2">
            <input type="color" value={color} onChange={(e) => setBrandColor(e.target.value)} className="w-10 h-10 rounded-lg border border-line cursor-pointer" />
            <input className="input font-mono" value={color} onChange={(e) => setBrandColor(e.target.value)} />
          </div>
          <p className="text-xs text-ink-faint mt-1">Aplica em tempo real (veja a sidebar e os botões).</p>
        </Field>
        <Field label="Logo">
          <button className="btn-outline w-full !justify-start text-ink-soft"><Plus size={15} /> Enviar logo (SVG/PNG)</button>
        </Field>
        <Field label="Domínio do CRM">
          <input className="input font-mono" defaultValue={account.custom_domain} />
          <p className="text-xs text-ink-faint mt-1">Cloudflare for SaaS resolve o SSL automaticamente. O domínio só descobre a conta na entrada — nunca é chave de dado.</p>
        </Field>
        <button className="btn-brand w-full mt-1"><Check size={16} /> Salvar marca</button>
      </Section>

      <Section title="Pré-visualização" desc="Como a conta aparece para o time.">
        <div className="rounded-xl border border-line overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-line bg-surface">
            <span className="grid place-items-center w-9 h-9 rounded-lg bg-brand text-brand-fg font-display font-extrabold text-sm">{name[0]}</span>
            <div className="font-display font-extrabold text-ink">{name}</div>
          </div>
          <div className="p-4 space-y-2 bg-surface-muted">
            <button className="btn-brand w-full">Botão primário</button>
            <button className="btn-outline w-full">Botão secundário</button>
            <span className="chip bg-brand-soft text-brand">chip da marca</span>
          </div>
        </div>
      </Section>
    </div>
  );
}

/* ---------------- Distribuição ---------------- */
function Distribuicao() {
  const [rule, setRule] = useState("round_robin");
  const opts = [
    { id: "round_robin", title: "Rodízio (round-robin)", desc: "Cada lead novo vai para o próximo corretor da fila. Simples e justo — ligado por padrão." },
    { id: "by_persona", title: "Por persona / empreendimento", desc: "Direciona por perfil estimado (ex.: investidor → corretor X)." },
    { id: "by_region", title: "Por região", desc: "Distribui pela localização do lead." },
    { id: "pool", title: "Pool aberto", desc: "Leads ficam num pool e o corretor 'puxa' o próximo." },
  ];
  return (
    <Section title="Regra de distribuição de leads" desc="Configurável por conta. Executada no n8n quando o lead entra. Default ligado para a conta funcionar no 1º dia.">
      <div className="space-y-2">
        {opts.map((o) => (
          <label key={o.id} className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${rule === o.id ? "border-brand bg-brand-soft/50" : "border-line hover:bg-surface-muted"}`}>
            <input type="radio" name="rule" checked={rule === o.id} onChange={() => setRule(o.id)} className="mt-1 accent-brand" />
            <div>
              <div className="text-sm font-semibold text-ink flex items-center gap-2">
                {o.title}
                {o.id === "round_robin" && <span className="chip bg-emerald-100 text-emerald-700">padrão</span>}
              </div>
              <div className="text-xs text-ink-soft">{o.desc}</div>
            </div>
          </label>
        ))}
      </div>
      <button className="btn-brand mt-4"><Check size={16} /> Salvar regra</button>
    </Section>
  );
}

/* ---------------- Equipe & papéis ---------------- */
function Equipe() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("core_usuarios")
      .select("id, user_id, name, email, role")
      .order("created_at", { ascending: true });
    setMembers((data as Member[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <Section title="Equipe & papéis" desc="Membros desta conta (isolados por RLS). Corretor vê só os próprios leads; admin vê toda a conta. Cada imobiliária tem a sua equipe.">
      {loading ? (
        <p className="text-sm text-ink-faint">Carregando equipe…</p>
      ) : (
        <div className="space-y-2">
          {members.map((m) => {
            const display = m.name || m.email?.split("@")[0] || "—";
            const isAdminRole = m.role === "account_admin" || m.role === "super_admin";
            return (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-line">
                <div className="flex items-center gap-2.5">
                  <Avatar name={display} size={34} />
                  <div>
                    <div className="text-sm font-semibold text-ink">{display}</div>
                    <div className="text-xs text-ink-faint">{m.email || "—"}</div>
                  </div>
                </div>
                <span className={`chip ${isAdminRole ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"}`}>
                  <Shield size={12} /> {ROLE_LABEL[m.role] || m.role}
                </span>
              </div>
            );
          })}
          {members.length === 0 && (
            <p className="text-sm text-ink-faint">Nenhum membro ainda. Convide o primeiro abaixo.</p>
          )}
        </div>
      )}
      <button className="btn-outline mt-4" onClick={() => setInvite(true)}><Plus size={15} /> Convidar membro</button>

      {invite && <InviteModal onClose={() => setInvite(false)} onDone={load} />}
    </Section>
  );
}

function InviteModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("broker");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<{ email: string; temp_password: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setErr("Sessão expirada — entre de novo."); setBusy(false); return; }

      const r = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ email, name, role }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        const map: Record<string, string> = {
          forbidden: "Só o admin da conta pode convidar membros.",
          ja_existe: j.detail || "Esse e-mail já tem cadastro.",
          email_invalido: "E-mail inválido.",
        };
        setErr(map[j.error] || j.detail || "Não consegui convidar. Tente de novo.");
        setBusy(false);
        return;
      }
      setDone({ email: j.email, temp_password: j.temp_password });
      onDone();
    } catch {
      setErr("Falha de rede. Tente de novo.");
    }
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="font-semibold text-ink flex items-center gap-2"><Plus size={18} className="text-brand" /> Convidar membro</h3>
          <button onClick={onClose} className="text-ink-faint hover:text-ink"><X size={18} /></button>
        </div>

        {done ? (
          <div className="p-5 space-y-3">
            <div className="flex items-start gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <Check size={16} className="shrink-0 mt-0.5" />
              <span><strong>{done.email}</strong> foi adicionado à equipe. Passe a senha provisória abaixo — ele troca depois de entrar.</span>
            </div>
            <Field label="Senha provisória">
              <div className="flex items-center gap-2">
                <input className="input font-mono" readOnly value={done.temp_password} />
                <button type="button" className="btn-outline !px-3" title="Copiar"
                  onClick={() => navigator.clipboard?.writeText(done.temp_password)}>
                  <Copy size={15} />
                </button>
              </div>
            </Field>
            <button className="btn-brand w-full" onClick={onClose}>Concluir</button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-3">
            <Field label="E-mail do membro">
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="corretor@imobiliaria.com.br" />
            </Field>
            <Field label="Nome">
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do corretor" />
            </Field>
            <Field label="Papel">
              <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="broker">Corretor — vê só os próprios leads</option>
                <option value="account_admin">Admin da conta — vê toda a conta</option>
              </select>
            </Field>
            {err && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" className="btn-outline flex-1" onClick={onClose}>Cancelar</button>
              <button type="submit" disabled={busy} className="btn-brand flex-1 disabled:opacity-60">
                {busy ? <><Loader2 size={16} className="animate-spin" /> Convidando…</> : <><Plus size={16} /> Convidar</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ---------------- Credenciais ---------------- */
function Credenciais() {
  const fields = [
    { k: "Meta Pixel ID", ph: "123456789012345", mono: true },
    { k: "Meta CAPI Token", ph: "guardado no Vault (referência)", vault: true },
    { k: "Google Ads ID", ph: "AW-000000000", mono: true },
    { k: "GA4 ID", ph: "G-XXXXXXX", mono: true },
    { k: "TikTok ID", ph: "CXXXXXXXXXXXXXXXX", mono: true },
    { k: "Microsoft Clarity", ph: "xxxxxxxxxx", mono: true },
  ];
  return (
    <Section title="Credenciais de marketing do cliente" desc="A conta de anúncio é DELE (pixels/Ads). A infra (Apify/OpenRouter/n8n…) é nossa — não aparece aqui.">
      <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-4">
        <Info size={15} className="shrink-0 mt-0.5" />
        Tokens sensíveis ficam no <strong>Supabase Vault / secrets do n8n</strong>, nunca em texto puro. Aqui guardamos só os IDs públicos.
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {fields.map((f) => (
          <Field key={f.k} label={f.k}>
            <input className={`input ${f.mono ? "font-mono" : ""}`} placeholder={f.ph} disabled={f.vault} />
            {f.vault && <span className="text-[11px] text-ink-faint flex items-center gap-1 mt-1"><KeyRound size={11} /> via Vault</span>}
          </Field>
        ))}
      </div>
      <button className="btn-brand mt-4"><Check size={16} /> Salvar credenciais</button>
    </Section>
  );
}

/* ---------------- helpers ---------------- */
function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h2 className="font-semibold text-ink">{title}</h2>
      <p className="text-xs text-ink-soft mb-4 mt-0.5">{desc}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-soft mb-1">{label}</label>
      {children}
    </div>
  );
}
