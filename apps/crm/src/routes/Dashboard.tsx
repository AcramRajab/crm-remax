import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { TrendingUp, Users, Target, DollarSign } from "lucide-react";
import { account } from "../lib/tenant";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const brand = account.primary_color;
const palette = [brand, "#EC008C", "#0F766E", "#F59E0B", "#7C3AED", "#0EA5E9"];

const baseOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: { grid: { color: "#EEF0F3" }, ticks: { font: { size: 11 } }, beginAtZero: true },
  },
};

export default function Dashboard() {
  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-extrabold text-ink">Dashboard de marketing</h1>
        <p className="text-sm text-ink-soft">NOW Residence · últimos 30 dias · dados de demonstração</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi icon={Users} label="Leads gerados" value="342" delta="+18%" />
        <Kpi icon={Target} label="Taxa de conversão" value="6,4%" delta="+0,9 pp" />
        <Kpi icon={DollarSign} label="CAC médio" value="R$ 84" delta="-12%" good />
        <Kpi icon={TrendingUp} label="Reuniões agendadas" value="27" delta="+5" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Origem dos leads */}
        <Panel title="Origem dos leads" subtitle="Por canal de aquisição">
          <div className="h-64">
            <Doughnut
              data={{
                labels: ["Meta Ads", "Google Ads", "Instagram", "TikTok", "Indicação", "Outbound"],
                datasets: [{ data: [128, 74, 56, 31, 30, 23], backgroundColor: palette, borderWidth: 0 }],
              }}
              options={{
                responsive: true, maintainAspectRatio: false, cutout: "62%",
                plugins: { legend: { position: "right", labels: { font: { size: 11 }, boxWidth: 12, padding: 10 } } },
              }}
            />
          </div>
        </Panel>

        {/* Atribuição */}
        <Panel title="Atribuição por canal" subtitle="First-touch vs last-touch">
          <div className="h-64">
            <Bar
              data={{
                labels: ["Meta", "Google", "Instagram", "WhatsApp", "Indicação"],
                datasets: [
                  { label: "First-touch", data: [110, 60, 52, 8, 30], backgroundColor: brand, borderRadius: 4, barPercentage: 0.6 },
                  { label: "Last-touch", data: [70, 88, 30, 64, 28], backgroundColor: "#EC008C", borderRadius: 4, barPercentage: 0.6 },
                ],
              }}
              options={{ ...baseOpts, plugins: { legend: { display: true, position: "top", labels: { font: { size: 11 }, boxWidth: 12 } } } }}
            />
          </div>
        </Panel>

        {/* Funil de conversão */}
        <Panel title="Funil de conversão" subtitle="PageView → Lead → Reunião → Proposta">
          <div className="h-64">
            <Bar
              data={{
                labels: ["Visitantes", "Leads", "Qualificados", "Reuniões", "Propostas"],
                datasets: [{ data: [5320, 342, 121, 27, 11], backgroundColor: palette, borderRadius: 4, barPercentage: 0.62 }],
              }}
              options={{ ...baseOpts, indexAxis: "y" as const, scales: { x: { grid: { color: "#EEF0F3" }, beginAtZero: true }, y: { grid: { display: false } } } }}
            />
          </div>
        </Panel>

        {/* Performance por persona */}
        <Panel title="Performance por persona" subtitle="Leads por persona estimada">
          <div className="h-64">
            <Bar
              data={{
                labels: ["Investidor", "Saúde", "Universitário", "3ª idade", "Casal novo", "Com. exterior"],
                datasets: [{ data: [96, 71, 58, 39, 44, 34], backgroundColor: brand, borderRadius: 4, barPercentage: 0.62 }],
              }}
              options={baseOpts}
            />
          </div>
        </Panel>

        {/* CAC por persona */}
        <Panel title="CAC por persona" subtitle="Custo de aquisição (R$) — quem converte mais barato">
          <div className="h-64">
            <Bar
              data={{
                labels: ["Investidor", "Saúde", "Universitário", "3ª idade", "Casal novo", "Com. exterior"],
                datasets: [{ data: [72, 96, 138, 81, 64, 110], backgroundColor: "#0F766E", borderRadius: 4, barPercentage: 0.62 }],
              }}
              options={baseOpts}
            />
          </div>
        </Panel>

        {/* Custo por canal */}
        <Panel title="Investimento × leads por canal" subtitle="Onde o real rende mais lead">
          <div className="h-64">
            <Bar
              data={{
                labels: ["Meta", "Google", "Instagram", "TikTok"],
                datasets: [
                  { label: "Investido (R$ x100)", data: [92, 64, 38, 24], backgroundColor: brand, borderRadius: 4, barPercentage: 0.6 },
                  { label: "Leads", data: [128, 74, 56, 31], backgroundColor: "#EC008C", borderRadius: 4, barPercentage: 0.6 },
                ],
              }}
              options={{ ...baseOpts, plugins: { legend: { display: true, position: "top", labels: { font: { size: 11 }, boxWidth: 12 } } } }}
            />
          </div>
        </Panel>
      </div>

      <p className="text-xs text-ink-faint mt-5">
        * Os números acima são ilustrativos. Quando o backend entrar, este dashboard lê as views de atribuição do
        Supabase (<code>v_atribuicao_first_touch</code>, <code>last_touch</code>, <code>linear</code>) filtradas por conta + empreendimento.
      </p>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, delta, good }: { icon: any; label: string; value: string; delta: string; good?: boolean }) {
  const positive = good || delta.trim().startsWith("+");
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="grid place-items-center w-9 h-9 rounded-lg bg-brand-soft text-brand"><Icon size={17} /></span>
        <span className={`text-xs font-semibold ${positive ? "text-emerald-600" : "text-rose-500"}`}>{delta}</span>
      </div>
      <div className="font-display text-2xl font-extrabold text-ink mt-2">{value}</div>
      <div className="text-xs text-ink-soft">{label}</div>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="mb-3">
        <h3 className="font-semibold text-ink">{title}</h3>
        <p className="text-xs text-ink-faint">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
