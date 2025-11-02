interface TabsProps {
  activeTab: "fila" | "historico";
  onTabChange: (tab: "fila" | "historico") => void;
  filaLength: number;
  historicoLength: number;
}

export function Tabs({
  activeTab,
  onTabChange,
  filaLength,
  historicoLength,
}: TabsProps) {
  return (
    <div className="flex border-b border-gray-600 mb-6 bg-barbearia-background relative z-20">
      <button
        onClick={() => onTabChange("fila")}
        className={`px-4 py-2 font-semibold ${
          activeTab === "fila"
            ? "text-barbearia-accent border-b-2 border-barbearia-accent"
            : "text-gray-400 hover:text-white"
        }`}
      >
        Fila Atual ({filaLength})
      </button>
      <button
        onClick={() => onTabChange("historico")}
        className={`px-4 py-2 font-semibold ${
          activeTab === "historico"
            ? "text-barbearia-accent border-b-2 border-barbearia-accent"
            : "text-gray-400 hover:text-white"
        }`}
      >
        Histórico ({historicoLength})
      </button>
    </div>
  );
}
