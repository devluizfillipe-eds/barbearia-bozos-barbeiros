import { Card, Button } from "./ui";
import { Barber } from "@/types";

interface BarberCardProps {
  barbeiro: Barber;
  onEdit: (barbeiro: Barber) => void;
}

export function BarberCard({ barbeiro, onEdit }: BarberCardProps) {
  return (
    <Card>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-white text-lg">{barbeiro.nome}</h3>
          <div className="space-y-1 mt-2">
            <p className="text-gray-300 text-sm flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-barbearia-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              {barbeiro.email}
            </p>
            <p className="text-gray-300 text-sm flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-barbearia-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {barbeiro.atendimentos || 0} atendimentos
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <div className="flex items-center space-x-2 bg-barbearia-card px-3 py-2 rounded-lg">
            <div
              className={`w-3 h-3 rounded-full ${
                barbeiro.disponivel
                  ? "bg-green-400 animate-pulse"
                  : "bg-red-400"
              }`}
            />
            <span
              className={`text-sm font-medium ${
                barbeiro.disponivel ? "text-green-400" : "text-red-400"
              }`}
            >
              {barbeiro.disponivel ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
          <Button
            onClick={() => onEdit(barbeiro)}
            variant="secondary"
            className="!text-barbearia-accent hover:!text-barbearia-accent/80"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Editar
          </Button>
        </div>
      </div>
    </Card>
  );
}
