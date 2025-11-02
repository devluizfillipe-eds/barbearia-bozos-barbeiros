import { Button, Card } from "./ui";
import { QueueEntry } from "@/types/queue";

interface EntryCardProps {
  entry: QueueEntry;
  onUpdateStatus: (id: number, status: string) => void;
  updating: boolean;
}

export function EntryCard({ entry, onUpdateStatus, updating }: EntryCardProps) {
  return (
    <Card key={entry.id} className="border border-gray-600">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-white">{entry.cliente.nome}</h3>
              <p className="text-gray-400 text-sm">
                Telefone: {entry.cliente.telefone}
              </p>
              <p className="text-gray-400 text-sm">
                Posição: {entry.posicao} • Entrou:{" "}
                {new Date(entry.hora_entrada).toLocaleTimeString("pt-BR")}
              </p>
              <div className="mt-2">
                <div className="flex flex-wrap gap-2 mb-1">
                  {entry.servicos?.map((servico) => (
                    <span
                      key={servico.id}
                      className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full"
                    >
                      {servico.name} - {servico.duration}min
                    </span>
                  )) || (
                    <span className="text-gray-400 text-sm italic">
                      Serviços não especificados
                    </span>
                  )}
                </div>
                {entry.servicos && entry.servicos.length > 0 && (
                  <p className="text-sm text-barbearia-accent">
                    Tempo total estimado:{" "}
                    {entry.servicos.reduce(
                      (acc, curr) => acc + curr.duration,
                      0
                    )}
                    min
                  </p>
                )}
              </div>
            </div>
            <span
              className={`text-xs font-semibold px-2 py-1 rounded ${
                entry.status === "ATENDENDO"
                  ? "bg-green-500 text-white"
                  : "bg-yellow-500 text-gray-900"
              }`}
            >
              {entry.status === "ATENDENDO" ? "ATENDENDO" : "AGUARDANDO"}
            </span>
          </div>
        </div>

        <div className="flex space-x-2">
          {entry.status === "AGUARDANDO" && (
            <Button
              onClick={() => onUpdateStatus(entry.id, "ATENDENDO")}
              disabled={updating}
              className="bg-green-500 hover:bg-green-600 disabled:bg-green-700"
            >
              Atender
            </Button>
          )}

          {entry.status === "ATENDENDO" && (
            <Button
              onClick={() => onUpdateStatus(entry.id, "ATENDIDO")}
              disabled={updating}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-700"
            >
              Finalizar
            </Button>
          )}

          <Button
            onClick={() => onUpdateStatus(entry.id, "FALTOU")}
            disabled={updating}
            className="bg-red-500 hover:bg-red-600 disabled:bg-red-700"
          >
            Não Compareceu
          </Button>
        </div>
      </div>
    </Card>
  );
}
