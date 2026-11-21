import { useState, useEffect } from "react";
import { Opportunity } from "@/types";
import { api } from "@/api";
import { useApp } from "@/providers/AppContext";
import { PageHeader } from "@/components/shared/PageHeader";
import { OpportunitiesTable } from "./OpportunitiesTable";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { BlurFade } from "@/components/ui/blur-fade";

export function OpportunitiesScreen() {
  const { mode } = useApp();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getOpportunities(mode);
      setOpportunities(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar oportunidades.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [mode]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-6 w-96" />
        <Skeleton className="h-[400px] w-full rounded-[16px]" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-8 pb-16">
      <BlurFade delay={0.05}>
        <PageHeader
          title={mode === "staffing" ? "Oportunidades de Staffing" : "Vacantes de Selección"}
          description={
            mode === "staffing"
              ? "Catálogo completo de proyectos activos y posiciones por cubrir en clientes de NTT DATA."
              : "Posiciones abiertas y procesos de selección activos para candidatos externos."
          }
        />
      </BlurFade>

      <BlurFade delay={0.1}>
        <OpportunitiesTable data={opportunities} showExport={true} />
      </BlurFade>
    </div>
  );
}
