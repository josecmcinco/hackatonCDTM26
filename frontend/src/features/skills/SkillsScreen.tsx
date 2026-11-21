import { useState, useEffect } from "react";
import { HeatmapDatum, SankeyData, SkillAdjacencyNode, SkillAdjacencyEdge } from "@/types";
import { api } from "@/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { SkillHeatmap } from "./SkillHeatmap";
import { SkillSankey } from "./SkillSankey";
import { SkillAdjacencyFlow } from "./SkillAdjacencyFlow";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { BlurFade } from "@/components/ui/blur-fade";

export function SkillsScreen() {
  const [activeTab, setActiveTab] = useState<string>("heatmap");
  const [heatmapData, setHeatmapData] = useState<HeatmapDatum[]>([]);
  const [sankeyData, setSankeyData] = useState<SankeyData | null>(null);
  const [graphData, setGraphData] = useState<{
    nodes: SkillAdjacencyNode[];
    edges: SkillAdjacencyEdge[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAllVisualizations = async () => {
    try {
      setLoading(true);
      setError(null);
      const [hm, sk, gr] = await Promise.all([
        api.getSkillGapHeatmap(),
        api.getSankeyData(),
        api.getSkillAdjacencyGraph(),
      ]);
      setHeatmapData(hm);
      setSankeyData(sk);
      setGraphData(gr);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar mapas de skills.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllVisualizations();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-6 w-96" />
        <Skeleton className="h-[460px] w-full rounded-[16px]" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadAllVisualizations} />;
  }

  return (
    <div className="space-y-8 pb-16">
      <BlurFade delay={0.05}>
        <PageHeader
          title="Inteligencia de Competencias y Brechas"
          description="Diagnóstico integral de demanda vs disponibilidad técnica en las distintas unidades de negocio de NTT DATA."
        />
      </BlurFade>

      <BlurFade delay={0.1}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <TabsList>
              <TabsTrigger value="heatmap">Mapa de calor (Brechas)</TabsTrigger>
              <TabsTrigger value="sankey">Flujos de asignación</TabsTrigger>
              <TabsTrigger value="adjacency">Afinidad adyacente (Grafo)</TabsTrigger>
            </TabsList>

            <span className="text-xs text-muted-foreground">
              Mostrando una visualización a la vez para mantener el foco analítico
            </span>
          </div>

          {/* TAB A: Heatmap */}
          <TabsContent value="heatmap" className="space-y-4">
            <Card className="p-8 shadow-soft">
              <div className="space-y-1">
                <h3 className="text-[20px] font-semibold text-foreground tracking-tight">
                  La unidad de Cloud & Data concentra el 88% de la demanda en GenAI y Databricks
                </h3>
                <p className="text-xs text-muted-foreground">
                  Escala secuencial de saturación técnica por área de negocio (valores normalizados 0-100).
                </p>
              </div>

              <SkillHeatmap data={heatmapData} />
            </Card>
          </TabsContent>

          {/* TAB B: Sankey */}
          <TabsContent value="sankey" className="space-y-4">
            <Card className="p-8 shadow-soft">
              <div className="space-y-1">
                <h3 className="text-[20px] font-semibold text-foreground tracking-tight">
                  El 65% de las asignaciones desde el banquillo nutren proyectos del sector bancario
                </h3>
                <p className="text-xs text-muted-foreground">
                  Transición de talento disponible hacia cuentas clave durante el trimestre.
                </p>
              </div>

              {sankeyData && <SkillSankey data={sankeyData} />}
            </Card>
          </TabsContent>

          {/* TAB C: Adjacency Graph */}
          <TabsContent value="adjacency" className="space-y-4">
            <Card className="p-8 shadow-soft">
              <div className="space-y-1">
                <h3 className="text-[20px] font-semibold text-foreground tracking-tight">
                  El talento adyacente cubre vacantes críticas mediante habilidades puente
                </h3>
                <p className="text-xs text-muted-foreground">
                  Descubre cómo profesionales de tecnologías legacy o infra se reconvierten hacia arquitectura moderna.
                </p>
              </div>

              {graphData && (
                <SkillAdjacencyFlow
                  nodesData={graphData.nodes}
                  edgesData={graphData.edges}
                />
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </BlurFade>
    </div>
  );
}
export default SkillsScreen;
