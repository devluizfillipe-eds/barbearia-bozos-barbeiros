import { Card } from "./ui";

interface StatsCardProps {
  total: number;
  online: number;
  atendimentos: number;
}

export function StatsCards({ total, online, atendimentos }: StatsCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card className="text-center">
        <div className="text-2xl font-bold text-barbearia-accent">{total}</div>
        <div className="text-gray-300">Total de Barbeiros</div>
      </Card>
      <Card className="text-center">
        <div className="text-2xl font-bold text-green-400">{online}</div>
        <div className="text-gray-300">Barbeiros Online</div>
      </Card>
      <Card className="text-center">
        <div className="text-2xl font-bold text-blue-400">{atendimentos}</div>
        <div className="text-gray-300">Total de Atendimentos</div>
      </Card>
    </div>
  );
}
