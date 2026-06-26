import { useState } from "react";
import { Plug, QrCode, Smartphone, Mail, Info, Link2 } from "lucide-react";
import { users } from "../lib/mock";
import { Avatar } from "../components/Avatar";

/* Fontes de dados de marketing (contas do CLIENTE). NENHUMA está conectada
   ainda — a conexão real (OAuth + API) está em desenvolvimento. Não exibimos
   número de demonstração aqui pra não passar a impressão de que já está plugado. */
interface Source {
  id: string;
  name: string;
  badge: string;
  color: string;
  pulls: string;
  metrics: string[]; // só os rótulos; os valores chegam quando a API real for plugada
}

const SOURCES: Source[] = [
  {
    id: "meta", name: "Meta Ads", badge: "M", color: "#0866FF",
    pulls: "Pixel + CAPI + Ads (investimento, leads, públicos)",
    metrics: ["Investido", "Impressões", "Leads", "CPL"],
  },
  {
    id: "google", name: "Google Ads", badge: "G", color: "#1A73E8",
    pulls: "Campanhas de busca/display (cliques, custo, conversões)",
    metrics: ["Investido", "Cliques", "Leads", "CPL"],
  },
  {
    id: "ga4", name: "Google Analytics 4", badge: "A", color: "#E8710A",
    pulls: "Sessões, usuários e conversões do site/LP",
    metrics: ["Sessões", "Usuários", "Conversões", "Taxa"],
  },
  {
    id: "tiktok", name: "TikTok Ads", badge: "T", color: "#111111",
    pulls: "Campanhas e Events API (impressões, leads)",
    metrics: ["Investido", "Impressões", "Leads", "CPL"],
  },
];

export default function Integracoes() {
  // Pediu pra conectar -> mostra aviso honesto de "em desenvolvimento".
  // NADA aparece como "Conectado" porque a integração real ainda não existe.
  const [pending, setPending] = useState<Record<string, boolean>>({});

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
          Nenhuma fonte está conectada ainda — <strong>a conexão via API está em desenvolvimento</strong>. Os números só aparecem depois de plugada de verdade.
        </span>
      </div>

      {/* Fontes de dados */}
      <h2 className="text-sm font-semibold text-ink-faint uppercase tracking-wide mb-3">Fontes de dados de marketing</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {SOURCES.map((s) => {
          const isPending = !!pending[s.id];
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
                <span className="chip bg-slate-100 text-slate-500">Desconectado</span>
              </div>

              {/* Sem valor falso: só os rótulos com "—" até a API real plugar. */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                {s.metrics.map((label) => (
                  <div key={label} className="rounded-lg bg-surface-muted/70 border border-line p-2 text-center">
                    <div className="font-display font-extrabold text-ink-faint text-sm">—</div>
                    <div className="text-[10px] text-ink-faint">{label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-line">
                {isPending ? (
                  <p className="text-[12px] text-amber-700 bg-amber-50 rounded-lg px-3 py-2 flex items-start gap-1.5">
                    <Info size={13} className="shrink-0 mt-0.5" /> Integração via API em desenvolvimento. Em breve você conecta a conta de {s.name} e os números aparecem aqui.
                  </p>
                ) : (
                  <button className="btn-outline w-full" onClick={() => setPending((p) => ({ ...p, [s.id]: true }))}>
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

/* -------- WhatsApp (Evolution) --------
   Backend de proxy + Evolution ainda não plugados. Mostramos a estrutura real
   (um número por corretor, conexão por QR) mas SEM fingir conexão: nada aparece
   como "Conectado" até a Evolution real responder. */
function WhatsAppCard() {
  const brokers = users.filter((u) => u.role === "broker");

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-1">
        <span className="grid place-items-center w-11 h-11 rounded-xl bg-[#25D366] text-white"><Smartphone size={20} /></span>
        <div>
          <div className="font-semibold text-ink">WhatsApp (Evolution API)</div>
          <div className="text-xs text-ink-faint">Cada corretor conecta o número por QR · uma instância, vários números</div>
        </div>
      </div>

      <p className="text-[12px] text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-3 flex items-start gap-1.5">
        <Info size={13} className="shrink-0 mt-0.5" /> Conexão via Evolution API em desenvolvimento. Em breve cada corretor lê o QR e o número fica conectado aqui.
      </p>

      <div className="space-y-2 mt-3">
        {brokers.map((u) => (
          <div key={u.id} className="flex items-center justify-between p-2.5 rounded-lg border border-line">
            <div className="flex items-center gap-2.5">
              <Avatar name={u.name} color={u.avatar_color} size={30} />
              <div>
                <div className="text-sm font-semibold text-ink">{u.name}</div>
                <div className="text-xs text-ink-faint">sem número conectado</div>
              </div>
            </div>
            <button className="btn-outline !py-1.5 text-xs opacity-60 cursor-not-allowed" disabled title="Em breve">
              <QrCode size={14} /> Conectar
            </button>
          </div>
        ))}
      </div>
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
        <button className="btn-outline w-full opacity-60 cursor-not-allowed" disabled title="Em breve"><Link2 size={15} /> Conectar e-mail</button>
        <p className="text-[11px] text-ink-faint flex items-center gap-1"><Info size={11} /> Envio/recebimento via API em desenvolvimento.</p>
      </div>
    </div>
  );
}
