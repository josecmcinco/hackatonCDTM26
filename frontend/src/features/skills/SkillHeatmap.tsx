import { ResponsiveHeatMap } from "@nivo/heatmap";
import { HeatmapDatum } from "@/types";

interface SkillHeatmapProps {
  data: HeatmapDatum[];
}

export function SkillHeatmap({ data }: SkillHeatmapProps) {
  return (
    <div className="h-[460px] w-full pt-4">
      <ResponsiveHeatMap
        data={data}
        margin={{ top: 40, right: 60, bottom: 60, left: 140 }}
        valueFormat=">-.0f"
        axisTop={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -20,
          legend: "",
          legendOffset: 36,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: "Unidad de negocio",
          legendPosition: "middle",
          legendOffset: -110,
        }}
        colors={{
          type: "sequential",
          scheme: "blues",
        }}
        emptyColor="var(--surface)"
        borderWidth={1}
        borderColor="var(--border)"
        enableLabels={true}
        labelTextColor={{
          from: "color",
          modifiers: [["darker", 2]],
        }}
        animate={true}
        hoverTarget="cell"
      />
    </div>
  );
}
