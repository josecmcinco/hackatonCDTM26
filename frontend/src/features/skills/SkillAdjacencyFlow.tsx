import { useState, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { SkillAdjacencyNode, SkillAdjacencyEdge } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles } from "lucide-react";

interface SkillAdjacencyFlowProps {
  nodesData: SkillAdjacencyNode[];
  edgesData: SkillAdjacencyEdge[];
}

export function SkillAdjacencyFlow({
  nodesData: _nodesData,
  edgesData: _edgesData,
}: SkillAdjacencyFlowProps) {
  const [selectedProfile, setSelectedProfile] = useState<string>("carlos");

  // Highlighted paths depending on profile
  const activePath = useMemo(() => {
    if (selectedProfile === "carlos") {
      return {
        nodeIds: ["cobol", "bridge-migration", "java-microservices", "cloud-native"],
        edgeIds: ["e1", "e3", "e5"],
        description:
          "Carlos Benítez: Su dominio de 20 años en COBOL y CICS se conecta con Microservicios Java a través del puente de desacoplamiento CDC.",
      };
    }
    return {
      nodeIds: ["devops", "llmops", "genai"],
      edgeIds: ["e6", "e7"],
      description:
        "Sara Gallego: Su experiencia en CI/CD y Kubernetes actúa como puente hacia inferencia de LLMOps y GenAI empresarial.",
    };
  }, [selectedProfile]);

  // Initial node layouts
  const initialNodes: Node[] = [
    {
      id: "cobol",
      position: { x: 50, y: 80 },
      data: { label: "Mainframe COBOL", sub: "15 profesionales" },
    },
    {
      id: "batch",
      position: { x: 50, y: 220 },
      data: { label: "Procesamiento Batch", sub: "18 profesionales" },
    },
    {
      id: "bridge-migration",
      position: { x: 300, y: 80 },
      data: { label: "Desacoplamiento CDC", sub: "Puente adyacente" },
    },
    {
      id: "bridge-events",
      position: { x: 300, y: 220 },
      data: { label: "Kafka / Eventos", sub: "Puente adyacente" },
    },
    {
      id: "java-microservices",
      position: { x: 560, y: 150 },
      data: { label: "Microservicios Spring", sub: "Requisito proyecto" },
    },
    {
      id: "cloud-native",
      position: { x: 800, y: 150 },
      data: { label: "AWS Cloud Native", sub: "Objetivo final" },
    },
    {
      id: "devops",
      position: { x: 50, y: 360 },
      data: { label: "DevOps & K8s", sub: "20 profesionales" },
    },
    {
      id: "llmops",
      position: { x: 380, y: 360 },
      data: { label: "Inferencia LLMOps", sub: "Puente emergente" },
    },
    {
      id: "genai",
      position: { x: 720, y: 360 },
      data: { label: "GenAI & LLMs", sub: "Objetivo estratégico" },
    },
  ];

  // Map nodes with active styling
  const nodes = initialNodes.map((n) => {
    const isHighlighted = activePath.nodeIds.includes(n.id);
    return {
      ...n,
      style: {
        background: isHighlighted ? "var(--surface)" : "var(--background)",
        color: "var(--foreground)",
        border: isHighlighted
          ? "2px solid var(--brand)"
          : "1px solid var(--border)",
        borderRadius: "12px",
        padding: "10px 14px",
        boxShadow: isHighlighted ? "0 4px 12px rgba(0, 114, 188, 0.15)" : "none",
        fontSize: "12px",
        fontWeight: isHighlighted ? 600 : 400,
        width: 170,
      },
    };
  });

  const initialEdges: Edge[] = [
    { id: "e1", source: "cobol", target: "bridge-migration" },
    { id: "e2", source: "batch", target: "bridge-events" },
    { id: "e3", source: "bridge-migration", target: "java-microservices" },
    { id: "e4", source: "bridge-events", target: "java-microservices" },
    { id: "e5", source: "java-microservices", target: "cloud-native" },
    { id: "e6", source: "devops", target: "llmops" },
    { id: "e7", source: "llmops", target: "genai" },
  ];

  const edges = initialEdges.map((e) => {
    const isHighlighted = activePath.edgeIds.includes(e.id);
    return {
      ...e,
      animated: isHighlighted,
      style: {
        stroke: isHighlighted ? "var(--brand)" : "var(--border)",
        strokeWidth: isHighlighted ? 2.5 : 1.2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isHighlighted ? "var(--brand)" : "var(--chart-muted)",
      },
    };
  });

  return (
    <div className="space-y-4">
      {/* Controls: Profile selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-[12px] bg-neutral-50 dark:bg-neutral-900 border border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand" />
          <span className="text-xs font-semibold text-foreground">
            Simular ruta de afinidad adyacente:
          </span>
        </div>

        <div className="w-72">
          <Select value={selectedProfile} onValueChange={setSelectedProfile}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Seleccionar perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="carlos">
                Carlos Benítez (COBOL → Java Microservicios)
              </SelectItem>
              <SelectItem value="sara">
                Sara Gallego (DevOps → LLMOps Inferencia)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground px-1">
        {activePath.description}
      </p>

      {/* Graph Area */}
      <div className="h-[480px] w-full rounded-[16px] border border-border bg-surface overflow-hidden shadow-soft">
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background color="var(--border)" gap={16} size={1} />
          <Controls className="bg-surface border border-border rounded-[8px]" />
        </ReactFlow>
      </div>
    </div>
  );
}
