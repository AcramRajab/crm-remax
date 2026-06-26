import { useState, useEffect } from "react";
import {
  Plug, QrCode, Smartphone, Mail, Info, RefreshCw, Link2, Unplug, Loader2,
} from "lucide-react";
import { users } from "../lib/mock";
import { Avatar } from "../components/Avatar";
import { getEvolutionClient, instanceFor, type ConnState } from "../lib/evolution";

/* Fontes de dados de marketing (contas do CLIENTE). Os números aparecem
   quando a API real for plugada — por ora, placeholders / mock. */
interface Source {
  id: string;
  name: string;
  badge: string;
  color: string;
  pulls: string;
  metrics: { label: string; value: string }[];
}

const SOURCES: Source[] = [
  {
    id: "meta", name: "Meta Ads", badge: "M", color: "#0866FF",
    pulls: "Pixel + CAPI + Ads (investimento, leads, públicos)",
    metrics: [
      { label: "Investido", value: "R$ 9.240" },
      { label: "Impressões", value: "412k" },
      { label: "Leads", value: "128" },
      { label: "CPL", value: "R$ 72" },
    ],
  },
  {
    id: "google", name: "Google Ads", badge: "G", color: "#1A73E8",
    pulls: "Campanhas de busca/display (cliques, custo, conversões)",
    metrics: [
      { label: "Investido", value: "R$ 6.400" },
      { label: "Cliques", value: "3.940" },
      { label: "Leads", value: "74" },
      { label: "CPL", value: "R$ 86" },
    ],
  },
  {
    id: "ga4", name: "Google Analytics 4", badge: "A", color: "#E8710A",
    pulls: "Sessões, usuários e conversões do site/LP",
    metrics: [
      { label: "Sessões", value: "18,2k" },
      { label: "Usuários", value: "12,4k" },
      { label: "Conversões", value: "121" },
      { label: "Taxa", value: "0,66%" },
    ],
  },
  {
    id: "tiktok", name: "TikTok Ads", badge: "T", color: "#111111",
    pulls: "Campanhas e Events API (impressões, leads)",
    metrics: [
      { label: "Investido", value: "R$ 2.400" },
      { label: "Impressões", value: "180k" },
      { label: "Leads", value: "31" },
      { label: "CPL", value: "R$ 77" },
    ],
  },
];

export default function Integracoes() {
  const [connected, setConnected] = useState<Record<string, boolean>>({ meta: true, ga4: true });

  return (
    <div className="p-6 max-w-[1100px] mx-auto">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-extrabold text-ink flex items-center gap-2">
          <Plug size={22} className="text-brand" /> Integrações &amp; dados
        </h1>
        <p className="text-sm text-ink-soft">
          Conecte as contas de anúncio do cliente e a mensageria. Os números aparecem aqui quando a API estiver plugada.
        </p>
      </div>

      <div className="flex items-start gap-2 text-xs text-ink-soft bg-surface-muted border border-line rounded-lg p-3 mb-6">
        <Info size={15} className="shrink-0 mt-0.5 text-brand" />
        <span>
          As <strong>contas de anúncio são do cliente</strong> (Meta/Google/TikTok). A infra da plataforma (n8n, OpenRouter, Apify…) é nossa e não aparece aqui.
          Por enquanto os valores são de demonstração — <strong>depois plugamos a API real para puxar os números</strong>.
        </span>
      </div>

      {/* Fontes de dados */}
      <h2 className="text-sm font-semibold text-ink-faint uppercase tracking-wide mb-3">Fontes de dados de marketing</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {SOURCES.map((s) => {
          const on = !!connected[s.id];
          return (
            <div key={s.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid place-items-center w-11 h-11 rounded-xl text-white font-display font-extrabold" style={{ background: s.color }}>{s.badge}</span>
                  <div>
                    <div className="font-semibold text-ink">{s.name}</div>
                    <div className="text-xs text-ink-faint max-w-[230px]">{s.pulls}</div>
                  </div>
                </div>
                {on ? (
                  <span className="chip bg-emerald-100 text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Conectado</span>
                ) : (
                  <span className="chip bg-slate-100 text-slate-500">Desconectado</span>
                )}
              </div>

              {/* Números (placeholder até a API) */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                {s.metrics.map((m) => (
                  <div key={m.label} className="rounded-lg bg-surface-muted/70 border border-line p-2 text-center">
                    <div className="font-display font-extrabold text-ink text-sm">{on ? m.value : "—"}</div>
                    <div className="text-[10px] text-ink-faint">{m.label}</div>
                  </div>
                ))}
              </div>
              {!on && (
                <p className="text-[11px] text-ink-faint mt-2 flex items-center gap-1"><Info size={11} /> Conecte para a API puxar os números.</p>
              )}

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-line">
                {on ? (
                  <>
                    <button className="btn-ghost text-xs"><RefreshCw size={13} /> Sincronizar agora</button>
                    <div className="flex-1" />
                    <button className="btn-ghost text-xs text-rose-500 hover:bg-rose-50" onClick={() => setConnected((c) => ({ ...c, [s.id]: false }))}>
                      <Unplug size={13} /> Desconectar
                    </button>
                  </>
                ) : (
                  <button className="btn-outline w-full" onClick={() => setConnected((c) => ({ ...c, [s.id]: true }))}>
                    <Link2 size={15} /> Conectar {s.name}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mensageria */}
      <h2 className="text-sm font-semibold text-ink-faint uppercase tracking-wide mb-3">Mensageria</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <WhatsAppCard />
        <EmailCard />
      </div>
    </div>
  );
}

/* -------- WhatsApp (Evolution) -------- */
const evo = getEvolutionClient();

function WhatsAppCard() {
  const brokers = users.filter((u) => u.role === "broker");
  const [state, setState] = useState<Record<string, ConnState>>({ u_acram: "open" });
  const [qrFor, setQrFor] = useState<string | null>(null);
  const [qr, setQr] = useState<{ base64?: string } | null>(null);

  async function connect(userId: string) {
    const name = instanceFor(userId);
    await evo.createInstance(name);        // POST /instance/create
    const q = await evo.getQr(name);       // GET /instance/connect/:name
    setQr({ base64: q.base64 });
    setQrFor(userId);
    setState((s) => ({ ...s, [userId]: "connecting" }));
  }

  async function disconnect(userId: string) {
    await evo.logout(instanceFor(userId)); // DELETE /instance/logout/:name
    setState((s) => ({ ...s, [userId]: "close" }));
  }

  // Polling do estado da conexão enquanto o QR está aberto (igual ao real).
  useEffect(() => {
    if (!qrFor) return;
    const name = instanceFor(qrFor);
    const iv = setInterval(async () => {
      const st = await evo.getState(name); // GET /instance/connectionState/:name
      setState((s) => ({ ...s, [qrFor]: st }));
      if (st === "open") { setQrFor(null); clearInterval(iv); }
    }, 1500);
    return () => clearInterval(iv);
  }, [qrFor]);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-1">
        <span className="grid place-items-center w-11 h-11 rounded-xl bg-[#25D366] text-white"><Smartphone size={20} /></span>
        <div>
          <div className="font-semibold text-ink">WhatsApp (Evolution API)</div>
          <div className="text-xs text-ink-faint">Cada corretor conecta o número por QR · uma instância, vários números</div>
        </div>
      </div>
      <div className="space-y-2 mt-4">
        {brokers.map((u) => {
          const st = state[u.id] || "close";
          return (
            <div key={u.id} className="flex items-center justify-between p-2.5 rounded-lg border border-line">
              <div className="flex items-center gap-2.5">
                <Avatar name={u.name} color={u.avatar_color} size={30} />
                <div>
                  <div className="text-sm font-semibold text-ink">{u.name}</div>
                  <div className="text-xs text-ink-faint">{st === "open" ? "+55 47 9••••-••••" : "sem número conectado"}</div>
                </div>
              </div>
              {st === "open" ? (
                <div className="flex items-center gap-2">
                  <span className="chip bg-emerald-100 text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Conectado</span>
                  <button className="text-ink-faint hover:text-rose-500" title="Desconectar" onClick={() => disconnect(u.id)}><Unplug size={15} /></button>
                </div>
              ) : st === "connecting" ? (
                <span className="chip bg-amber-100 text-amber-700"><Loader2 size={12} className="animate-spin" /> Conectando…</span>
              ) : (
                <button className="btn-outline !py-1.5 text-xs" onClick={() => connect(u.id)}><QrCode size={14} /> Conectar</button>
              )}
            </div>
          );
        })}
      </div>

      {qrFor && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={() => setQrFor(null)}>
          <div className="card p-6 w-full max-w-xs text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-ink mb-1">Conectar WhatsApp</h3>
            <p className="text-xs text-ink-soft mb-4">WhatsApp &gt; Aparelhos conectados &gt; Conectar aparelho</p>
            {qr?.base64 ? <img src={qr.base64} alt="QR" className="mx-auto w-44 h-44 rounded-lg border border-line" /> : <QrFake />}
            <div className="flex items-center justify-center gap-2 text-xs text-ink-soft mt-4">
              <Loader2 size={14} className="animate-spin text-brand" /> Aguardando leitura do QR…
            </div>
            <p className="text-[11px] text-ink-faint mt-2">Conecta sozinho assim que o telefone escanear.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function EmailCard() {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-1">
        <span className="grid place-items-center w-11 h-11 rounded-xl bg-brand text-brand-fg"><Mail size={20} /></span>
        <div>
          <div className="font-semibold text-ink">E-mail transacional</div>
          <div className="text-xs text-ink-faint">Enviar e receber (inbound) no thread do lead</div>
        </div>
      </div>
      <div className="space-y-3 mt-4">
        <div>
          <label className="block text-xs font-semibold text-ink-soft mb-1">Provedor</label>
          <select className="input"><option>Resend</option><option>MailerSend</option><option>Amazon SES</option></select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-soft mb-1">E-mail de envio</label>
          <input className="input font-mono" placeholder="contato@remax-itajai.com.br" />
        </div>
        <button className="btn-outline w-full"><Link2 size={15} /> Conectar e-mail</button>
      </div>
    </div>
  );
}

function QrFake() {
  const cells = Array.from({ length: 21 * 21 }, (_, i) => {
    const x = i % 21, y = Math.floor(i / 21);
    const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
    return finder ? (x === 0 || x === 6 || y === 0 || y === 6 || (x > 1 && x < 5 && y > 1 && y < 5)) : ((x * 7 + y * 13 + x * y) % 3 === 0);
  });
  return (
    <div className="mx-auto w-44 h-44 grid p-2 bg-white border border-line rounded-lg" style={{ gridTemplateColumns: "repeat(21,1fr)" }}>
      {cells.map((on, i) => <span key={i} style={{ background: on ? "#181818" : "transparent" }} />)}
    </div>
  );
}
