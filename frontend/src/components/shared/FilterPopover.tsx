import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FilterPopoverProps {
  sectors: string[];
  selectedSectors: string[];
  onChange: (selected: string[]) => void;
}

export function FilterPopover({
  sectors,
  selectedSectors,
  onChange,
}: FilterPopoverProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = sectors.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSector = (sector: string) => {
    if (selectedSectors.includes(sector)) {
      onChange(selectedSectors.filter((s) => s !== sector));
    } else {
      onChange([...selectedSectors, sector]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="secondary" size="sm" className="gap-2">
            <Filter className="h-3.5 w-3.5" />
            <span>Filtros</span>
            {selectedSectors.length > 0 && (
              <span className="ml-1 h-5 w-5 rounded-full bg-brand text-[10px] font-semibold text-white flex items-center justify-center">
                {selectedSectors.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-3 shadow-lg" align="start">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-border">
              <span className="text-xs font-semibold text-foreground">
                Sectores y Áreas de negocio ({sectors.length})
              </span>
              {selectedSectors.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[11px] text-brand hover:underline"
                >
                  Limpiar
                </button>
              )}
            </div>

            <Input
              placeholder="Buscar sector..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-xs"
            />

            <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
              {filtered.map((sector) => {
                const checked = selectedSectors.includes(sector);
                return (
                  <label
                    key={sector}
                    className="flex items-center gap-2 p-1.5 rounded-[8px] hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer text-xs transition-colors"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleSector(sector)}
                    />
                    <span className="text-foreground">{sector}</span>
                  </label>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No se encontraron sectores
                </p>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Applied filter chips */}
      {selectedSectors.map((s) => (
        <Badge
          key={s}
          variant="secondary"
          className="gap-1 text-xs py-1 px-2.5 bg-neutral-100 dark:bg-neutral-800 border-border"
        >
          <span>{s}</span>
          <button
            type="button"
            onClick={() => toggleSector(s)}
            className="hover:text-danger ml-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
