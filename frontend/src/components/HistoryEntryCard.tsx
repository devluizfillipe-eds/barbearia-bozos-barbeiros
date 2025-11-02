import { Card } from "./ui";
import { QueueEntry } from "@/types";

interface HistoryEntryCardProps {
  entry: QueueEntry;
}

export function HistoryEntryCard({ entry }: HistoryEntryCardProps) {
  return (
    <Card>
      <div className="flex justify-between items-center">
        <div>
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white">
                  {entry.cliente.nome}
                </h3>
                <p className="text-gray-400 text-sm">
                  Telefone: {entry.cliente.telefone}
                </p>
                <p className="text-gray-400 text-sm">
                  Entrada:{" "}
                  {new Date(entry.hora_entrada).toLocaleString("pt-BR")}
                  {entry.hora_saida &&
                    ` • Saída: ${new Date(entry.hora_saida).toLocaleString("pt-BR")}`}
                </p>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded ${
                  entry.status === "ATENDIDO"
                    ? "bg-blue-500 text-white"
                    : entry.status === "FALTOU"
                      ? "bg-red-500 text-white"
                      : "bg-orange-500 text-white"
                }`}
              >
                {entry.status === "ATENDIDO"
                  ? "ATENDIDO"
                  : entry.status === "FALTOU"
                    ? "NÃO COMPARECEU"
                    : "DESISTIU"}
              </span>
            </div>
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
                  {entry.servicos.reduce((acc, curr) => acc + curr.duration, 0)}
                  min
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
