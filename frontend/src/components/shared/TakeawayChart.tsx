import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { SkillDemandSupply } from "@/types";
import { cn } from "@/lib/utils";

interface TakeawayChartProps {
  data: SkillDemandSupply[];
  className?: string;
}

export function TakeawayChart({ data, className }: TakeawayChartProps) {
  // Chart displays Top 8 diverging gap: supply - demand
  // One highlighted series in brand color, the rest in chart-muted
  return (
    <div className={cn("flex flex-col space-y-4", className)}>
      <div className="space-y-1">
        <h3 className="text-[20px] font-semibold tracking-tight text-foreground">
          La demanda de Cloud y GenAI supera al talento disponible en 12 personas
        </h3>
        <p className="text-sm text-muted-foreground">
          Diferencia entre posiciones requeridas y profesionales asignables este trimestre.
        </p>
      </div>

      <div className="h-[280px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 90, bottom: 0 }}
          >
            <XAxis
              type="number"
              domain={[-15, 8]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
              tickFormatter={(v) => (v > 0 ? `+${v}` : `${v}`)}
            />
            <YAxis
              dataKey="skill"
              type="category"
              tick={{ fill: "var(--foreground)", fontSize: 12 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
              width={140}
            />
            <Tooltip
              cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as SkillDemandSupply;
                  return (
                    <div className="rounded-[10px] border border-border bg-surface p-3 shadow-md text-xs space-y-1">
                      <p className="font-semibold text-foreground">{d.skill}</p>
                      <p className="text-muted-foreground">
                        Demanda: <span className="text-foreground font-medium">{d.demand}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Disponibles: <span className="text-foreground font-medium">{d.supply}</span>
                      </p>
                      <p className={cn("font-semibold pt-1 border-t border-border mt-1", d.gap < 0 ? "text-danger" : "text-success")}>
                        {d.gap < 0 ? `Brecha de ${Math.abs(d.gap)} perfiles` : `Superávit de +${d.gap} perfiles`}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine x={0} stroke="var(--border)" strokeWidth={1.5} />
            <Bar dataKey="gap" radius={[4, 4, 4, 4]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isHighlighted ? "var(--brand)" : "var(--chart-muted)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-6 pt-2 text-xs text-muted-foreground border-t border-border/50">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-brand" />
          <span>Mayor déficit prioritario (AWS Architecture)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-chart-muted" />
          <span>Otras competencias clave</span>
        </div>
      </div>
    </div>
  );
}
