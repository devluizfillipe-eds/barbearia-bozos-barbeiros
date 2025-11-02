import { Select } from "./Select";
import { Button } from "./Button";

interface FiltersProps {
  filterDate: string;
  onDateChange: (date: string) => void;
  filterService: number | null;
  onServiceChange: (serviceId: number | null) => void;
  onClearFilters: () => void;
}

export function Filters({
  filterDate,
  onDateChange,
  filterService,
  onServiceChange,
  onClearFilters,
}: FiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm text-gray-400 mb-1">Data</label>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
      <div className="flex-1 min-w-[200px]">
        <Select
          label="Serviço"
          value={filterService?.toString() || ""}
          onChange={(e) =>
            onServiceChange(e.target.value ? Number(e.target.value) : null)
          }
          options={[
            { value: "", label: "Todos os serviços" },
            { value: "1", label: "Corte" },
            { value: "2", label: "Barba" },
            { value: "3", label: "Sobrancelha" },
            { value: "4", label: "Textura" },
            { value: "5", label: "Pigmentação" },
          ]}
        />
      </div>
      {(filterDate || filterService) && (
        <Button
          variant="secondary"
          onClick={onClearFilters}
          className="self-end"
        >
          Limpar Filtros
        </Button>
      )}
    </div>
  );
}
