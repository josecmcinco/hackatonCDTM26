import { useState, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Opportunity } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilterPopover } from "@/components/shared/FilterPopover";
import { StatusDot } from "@/components/shared/StatusDot";
import { SkillChips } from "@/components/shared/SkillChips";
import { MatchRing } from "@/components/shared/MatchRing";
import { OpportunityDetailSheet } from "./OpportunityDetailSheet";
import { SECTORS } from "@/mock/data";
import { ArrowUpDown, Download, Search } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

interface OpportunitiesTableProps {
  data: Opportunity[];
  showExport?: boolean;
}

export function OpportunitiesTable({
  data,
  showExport = true,
}: OpportunitiesTableProps) {
  const [search, setSearch] = useState("");
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [viewTab, setViewTab] = useState<"todas" | "urgentes" | "mias">("todas");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "bestMatchScore", desc: true },
  ]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Filtered rows calculation
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Saved views
      if (viewTab === "urgentes" && item.urgency !== "critical") return false;
      if (viewTab === "mias" && !["opp-1", "opp-2", "opp-10"].includes(item.id)) {
        return false;
      }

      // Search text
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchClient = item.client.toLowerCase().includes(q);
        const matchSector = item.sector.toLowerCase().includes(q);
        const matchSkill = item.mustHaveSkills.some((s) => s.toLowerCase().includes(q));
        if (!matchTitle && !matchClient && !matchSector && !matchSkill) {
          return false;
        }
      }

      // Sector multi-select filter
      if (selectedSectors.length > 0 && !selectedSectors.includes(item.sector)) {
        return false;
      }

      return true;
    });
  }, [data, viewTab, search, selectedSectors]);

  // Table columns definition
  const columns = useMemo<ColumnDef<Opportunity>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-medium hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Oportunidad y Cliente</span>
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col py-1">
            <span className="font-semibold text-foreground text-sm truncate max-w-[280px]">
              {row.original.title}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {row.original.client} · {row.original.sector}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "urgency",
        header: "Urgencia",
        cell: ({ row }) => <StatusDot status={row.original.urgency} />,
      },
      {
        accessorKey: "mustHaveSkills",
        header: "Skills requeridos",
        cell: ({ row }) => (
          <SkillChips skills={row.original.mustHaveSkills} maxVisible={2} />
        ),
      },
      {
        accessorKey: "location",
        header: "Modalidad",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.location} ({row.original.modality})
          </span>
        ),
      },
      {
        accessorKey: "deadline",
        header: "Límite",
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-muted-foreground">
            {row.original.deadline}
          </span>
        ),
      },
      {
        accessorKey: "bestMatchScore",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-medium hover:text-foreground ml-auto pr-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Afinidad</span>
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="flex justify-end pr-2">
            <MatchRing score={row.original.bestMatchScore} size={42} strokeWidth={3.5} />
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const exportCSV = () => {
    const headers = ["ID", "Título", "Cliente", "Sector", "Urgencia", "Skills", "Límite", "Afinidad Máxima"];
    const rows = filteredData.map((d) => [
      d.id,
      `"${d.title.replace(/"/g, '""')}"`,
      `"${d.client.replace(/"/g, '""')}"`,
      `"${d.sector.replace(/"/g, '""')}"`,
      d.urgency,
      `"${d.mustHaveSkills.join("; ")}"`,
      d.deadline,
      `${d.bestMatchScore}%`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `oportunidades_talent_intel_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Table Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Saved Views Tabs (Max 3: Todas, Urgentes, Mías) */}
        <Tabs
          value={viewTab}
          onValueChange={(v) => setViewTab(v as "todas" | "urgentes" | "mias")}
        >
          <TabsList>
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="urgentes">Urgentes</TabsTrigger>
            <TabsTrigger value="mias">Asignadas</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search, Filter Popover & Export */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative w-56 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar oportunidad o skill..."
              className="pl-8 h-9 text-xs"
            />
          </div>

          <FilterPopover
            sectors={SECTORS}
            selectedSectors={selectedSectors}
            onChange={setSelectedSectors}
          />

          {showExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportCSV}
              className="gap-1.5 text-xs h-9"
              aria-label="Descargar datos en CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Exportar CSV</span>
            </Button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-[16px] border border-border bg-surface shadow-soft overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => {
                    setSelectedOpportunity(row.original);
                    setSheetOpen(true);
                  }}
                  className="transition-colors hover:bg-neutral-50/80 dark:hover:bg-neutral-900/60 cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <EmptyState
                    title="No hay oportunidades que coincidan"
                    description="Prueba a cambiar el texto de búsqueda o los sectores seleccionados."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Row Click Sheet */}
      <OpportunityDetailSheet
        opportunity={selectedOpportunity}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
