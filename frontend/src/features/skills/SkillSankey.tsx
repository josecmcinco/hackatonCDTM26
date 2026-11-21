import { ResponsiveSankey } from "@nivo/sankey";
import { SankeyData } from "@/types";

interface SkillSankeyProps {
  data: SankeyData;
}

export function SkillSankey({ data }: SkillSankeyProps) {
  return (
    <div className="h-[460px] w-full pt-4">
      <ResponsiveSankey
        data={data}
        margin={{ top: 40, right: 140, bottom: 40, left: 140 }}
        align="justify"
        colors={{ scheme: "paired" }}
        nodeOpacity={0.9}
        nodeHoverOthersOpacity={0.35}
        nodeThickness={16}
        nodeSpacing={24}
        nodeBorderWidth={0}
        nodeBorderRadius={4}
        linkOpacity={0.4}
        linkHoverOpacity={0.7}
        linkContract={3}
        enableLinkGradient={true}
        labelPosition="outside"
        labelOrientation="horizontal"
        labelPadding={14}
        labelTextColor="var(--foreground)"
        animate={true}
      />
    </div>
  );
}
