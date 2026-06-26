import {
  Activity, Monitor, Smartphone, Tablet, MapPin, Clock, Eye,
  Fingerprint, ChevronRight, MousePointerClick, Target, Layers,
} from "lucide-react";
import { getTracking } from "../lib/mock";
import { dur, timeAgo, timeLabel } from "../lib/format";
import type { Device, TrackEvent } from "../lib/types";

const DeviceIcon = ({ d, size = 14 }: { d: Device; size?: number }) =>
  d.type === "desktop" ? <Monitor size={size} /> : d.type === "tablet" ? <Tablet size={size} /> : <Smartphone size={size} />;

const eventColor: Record<TrackEvent["name"], string> = {
  Lead: "bg-emerald-500",
  ViewContent: "bg-brand",
  Click: "bg-fuchsia-500",
  PageView: "bg-sky-400",
  Scroll: "bg-slate-300",
  Session: "bg-ink",
};

const weightStyle: Record<string, string> = {
  alto: "bg-emerald-100 text-emerald-700",
  medio: "bg-amber-100 text-amber-700",
  baixo: "bg-slate-100 text-slate-500",
};

export default function TrackingPanel({ leadId }: { leadId: string }) {
  const t = getTracking(leadId);

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 font-semibold text-ink">
          <span className="grid place-items-center w-7 h-7 rounded-lg bg-surface-sunken text-ink-soft"><Activity size={15} /></span>
          Comportamento &amp; jornada de navegação
        </h2>
        <span className="text-[11px] text-ink-faint">tracking-kit · {t.sessions_count} sessões</span>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Stat icon={Layers} label="Sessões" value={String(t.sessions_count)} />
        <Stat icon={Eye} label="Páginas vistas" value={String(t.pageviews_count)} />
        <Stat icon={Clock} label="Tempo total" value={dur(t.total_time_sec)} />
        <Stat icon={MapPin} label="Localização" value={t.geo} small />
      </div>

      {/* Identidade / dispositivos */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-soft mb-5 pb-5 border-b border-line">
        <span className="flex items-center gap-1.5">
          <Fingerprint size={14} className="text-ink-faint" />
          {t.visitor_ids.length} visitor_id{t.visitor_ids.length > 1 ? "s" : ""}
          {t.visitor_ids.length > 1 && <span className="chip bg-brand-soft text-brand ml-1">multi-device · mesclado</span>}
        </span>
        {t.devices.map((d, i) => (
          <span key={i} className="flex items-center gap-1.5"><DeviceIcon d={d} /> {d.browser} · {d.os}</span>
        ))}
        <span className="text-ink-faint">1º toque {timeAgo(t.first_seen)} · último {timeAgo(t.last_seen)}</span>
      </div>

      {/* Atribuição multi-touch */}
      <div className="mb-5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint mb-2">Atribuição multi-touch</div>
        <div className="flex items-center flex-wrap gap-1 mb-3">
          {t.channel_path.map((c, i) => (
            <span key={i} className="flex items-center">
              <span className={`chip ${i === 0 ? "bg-brand-soft text-brand" : i === t.channel_path.length - 1 ? "bg-emerald-100 text-emerald-700" : "bg-surface-sunken text-ink-soft"}`}>
                {i === 0 && <span className="text-[10px] mr-1">1º</span>}
                {i === t.channel_path.length - 1 && <span className="text-[10px] mr-1">últ.</span>}
                {c}
              </span>
              {i < t.channel_path.length - 1 && <ChevronRight size={13} className="text-ink-faint mx-0.5" />}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          <Tag k="utm_source" v={t.utm.source} />
          <Tag k="utm_medium" v={t.utm.medium} />
          <Tag k="utm_campaign" v={t.utm.campaign} />
          {t.utm.content && <Tag k="utm_content" v={t.utm.content} />}
          {t.click_ids.map((c) => <Tag key={c.key} k={c.key} v={c.value} accent />)}
        </div>
      </div>

      {/* Sinais de intenção */}
      <div className="mb-5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint mb-2">
          <Target size={13} /> Sinais de intenção
        </div>
        <div className="flex flex-wrap gap-1.5">
          {t.intent_signals.map((s, i) => (
            <span key={i} className={`chip ${weightStyle[s.weight]}`}>{s.label}</span>
          ))}
        </div>
      </div>

      {/* Páginas mais engajadas */}
      <div className="mb-5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint mb-2">Páginas mais engajadas</div>
        <div className="space-y-2.5">
          {t.top_pages.map((p, i) => (
            <div key={i}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink truncate pr-3">{p.title}</span>
                <span className="text-xs text-ink-faint whitespace-nowrap flex items-center gap-2">
                  <span className="flex items-center gap-1"><Eye size={12} />{p.views}×</span>
                  <span className="flex items-center gap-1"><Clock size={12} />{dur(p.time_sec)}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 rounded-full bg-surface-sunken overflow-hidden">
                  <div className="h-full bg-brand rounded-full" style={{ width: `${p.scroll}%` }} />
                </div>
                <span className="text-[10px] text-ink-faint w-12 text-right">{p.scroll}% scroll</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Linha do tempo por sessão */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint mb-2">Linha do tempo</div>
        <div className="space-y-3">
          {t.sessions.map((s) => (
            <div key={s.id} className="rounded-lg border border-line overflow-hidden">
              <div className="flex items-center justify-between gap-2 px-3 py-2 bg-surface-muted/60 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-ink">
                  <DeviceIcon d={s.device} /> {s.channel}
                </span>
                <span className="text-ink-faint whitespace-nowrap flex items-center gap-2">
                  <span>{timeAgo(s.started_at)}</span>
                  <span className="chip bg-surface-sunken text-ink-soft">{dur(s.duration_sec)}</span>
                </span>
              </div>
              <ol className="p-3 space-y-2.5">
                {s.events.map((e, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${eventColor[e.name]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-ink">{e.name}</span>
                        {e.meta && <span className="chip bg-surface-sunken text-ink-faint !py-0">{e.meta}</span>}
                        <span className="text-[11px] text-ink-faint ml-auto">{timeLabel(e.at)}</span>
                      </div>
                      <p className="text-ink-soft">{e.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stat({ icon: Icon, label, value, small }: { icon: any; label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-lg bg-surface-muted/70 border border-line p-3">
      <div className="flex items-center gap-1.5 text-ink-faint text-[11px] mb-1"><Icon size={13} /> {label}</div>
      <div className={`font-display font-extrabold text-ink ${small ? "text-sm" : "text-xl"}`}>{value}</div>
    </div>
  );
}

function Tag({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono ${accent ? "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700" : "border-line bg-surface-muted text-ink-soft"}`}>
      <span className="opacity-60">{k}:</span>&nbsp;<span className="font-semibold">{v}</span>
    </span>
  );
}
