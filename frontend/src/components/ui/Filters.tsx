import { Select } from "./Select";

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
          className="w-full px-3 py-2 bg-[#2e2d37] border border-[#4b4950]/20 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#f2b63a] focus:border-transparent"
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
        <button
          onClick={onClearFilters}
          className="self-end px-4 py-2 bg-[#4b4950] text-[#f2b63a] rounded-lg hover:bg-[#3d3b42] transition-colors text-sm font-medium"
        >
          Limpar Filtros
        </button>
      )}
    </div>
  );
}
