import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { TrendingUp, Users, Target, DollarSign } from "lucide-react";
import { account } from "../lib/tenant";
import { useStore } from "../lib/store";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const brand = account.primary_color;
const palette = [brand, "#EC008C", "#0F766E", "#F59E0B", "#7C3AED", "#0EA5E9", "#EF4444", "#14B8A6"];
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const baseOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: { grid: { color: "#EEF0F3" }, ticks: { font: { size: 11 }, precision: 0 as any }, beginAtZero: true },
  },
};

function countBy<T>(arr: T[], keyFn: (x: T) => string) {
  const m: Record<string, number> = {};
  arr.forEach((x) => { const k = keyFn(x) || "—"; m[k] = (m[k] || 0) + 1; });
  return m;
}

export default function Dashboard() {
  const { leads, stages, getStage, getMember, loading } = useStore();

  const total = leads.length;
  const ativos = leads.filter((l) => l.status === "active").length;
  const ganhos = leads.filter((l) => l.status === "won").length;
  const perdidos = leads.filter((l) => l.status === "lost" || l.status === "discarded").length;
  const conversao = total ? (ganhos / total) * 100 : 0;
  const valorGanho = leads.filter((l) => l.status === "won").reduce((s, l) => s + (l.valor || 0), 0);
  const valorPipeline = leads.filter((l) => l.status === "active").reduce((s, l) => s + (l.valor || 0), 0);

  // Origem (last-touch), persona, responsável, canal.
  const porOrigem = countBy(leads, (l) => l.lt_source || l.ft_source || "—");
  const porPersona = countBy(leads, (l) => l.persona || "—");
  const porResp = countBy(leads.filter((l) => l.owner_id), (l) => getMember(l.owner_id)?.name || "—");

  // Funil: leads ativos por etapa + Ganho + Perdido.
  const firstId = stages[0]?.id;
  const funilLabels = [...stages.map((s) => s.name), "Ganho", "Perdido"];
  const funilData = [
    ...stages.map((s) => leads.filter((l) => l.status === "active" && (l.stage_id || firstId) === s.id).length),
    ganhos, perdidos,
  ];

  const dough = (m: Record<string, number>) => ({
    labels: Object.keys(m),
    datasets: [{ data: Object.values(m), backgroundColor: palette, borderWidth: 0 }],
  });
  const bar = (m: Record<string, number>, color = brand) => ({
    labels: Object.keys(m),
    datasets: [{ data: Object.values(m), backgroundColor: color, borderRadius: 4, barPercentage: 0.62 }],
  });

  if (loading) return <div className="p-6 text-sm text-ink-faint">Carregando…</div>;

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-extrabold text-ink">Dashboard de marketing</h1>
        <p className="text-sm text-ink-soft">{account.brand_name} · dados reais do CRM ({total} leads)</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi icon={Users} label="Leads gerados" value={String(total)} />
        <Kpi icon={Target} label="Taxa de conversão (ganho)" value={conversao.toFixed(1).replace(".", ",") + "%"} />
        <Kpi icon={DollarSign} label="Valor ganho" value={brl(valorGanho)} />
        <Kpi icon={TrendingUp} label="Valor em pipeline (ativos)" value={brl(valorPipeline)} />
      </div>

      {total === 0 ? (
        <div className="card p-10 text-center text-ink-faint">Sem leads ainda. Assim que entrarem, os gráficos aparecem aqui.</div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          <Panel title="Origem dos leads" subtitle="Por canal de aquisição (last-touch)">
            <div className="h-64"><Doughnut data={dough(porOrigem)} options={{ responsive: true, maintainAspectRatio: false, cutout: "62%", plugins: { legend: { position: "right", labels: { font: { size: 11 }, boxWidth: 12, padding: 10 } } } }} /></div>
          </Panel>

          <Panel title="Funil de vendas" subtitle="Leads por etapa + ganhos/perdidos">
            <div className="h-64"><Bar data={{ labels: funilLabels, datasets: [{ data: funilData, backgroundColor: palette, borderRadius: 4, barPercentage: 0.62 }] }}
              options={{ ...baseOpts, indexAxis: "y" as const, scales: { x: { grid: { color: "#EEF0F3" }, beginAtZero: true, ticks: { precision: 0 as any } }, y: { grid: { display: false } } } }} /></div>
          </Panel>

          <Panel title="Leads por persona" subtitle="Perfil / ICP estimado">
            <div className="h-64"><Bar data={bar(porPersona)} options={baseOpts} /></div>
          </Panel>

          <Panel title="Leads por responsável" subtitle="Distribuição entre corretores">
            <div className="h-64">{Object.keys(porResp).length ? <Bar data={bar(porResp, "#0F766E")} options={baseOpts} /> : <div className="grid h-full place-items-center text-sm text-ink-faint">Nenhum lead atribuído ainda.</div>}</div>
          </Panel>
        </div>
      )}

      <p className="text-xs text-ink-faint mt-5">
        Números calculados dos leads reais do CRM (Supabase). Origem, persona e responsável vêm de cada lead;
        o funil conta os leads ativos por etapa. Atribuição multi-touch e custo por canal (CAC) entram quando o tracking-kit + investimento de anúncio forem integrados.
      </p>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="card p-4">
      <span className="grid place-items-center w-9 h-9 rounded-lg bg-brand-soft text-brand"><Icon size={17} /></span>
      <div className="font-display text-2xl font-extrabold text-ink mt-2">{value}</div>
      <div className="text-xs text-ink-soft">{label}</div>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="mb-3"><h3 className="font-semibold text-ink">{title}</h3><p className="text-xs text-ink-faint">{subtitle}</p></div>
      {children}
    </div>
  );
}
