"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { SERVICOS } from "@/constants/servicos";

interface Cliente {
  nome: string;
  telefone: string;
}

interface NovoCliente {
  nome: string;
  telefone: string;
  servicos: number[];
}

interface QueueEntry {
  id: number | string;
  posicao?: number;
  cliente: Cliente;
  hora_entrada?: string;
  horaEntrada?: string | null;
  servicos?: Array<{ id: number | string; name?: string; nome?: string }>;
  status: string;
}

export default function FilaAdmin() {
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClient, setNewClient] = useState<NovoCliente>({
    nome: "",
    telefone: "",
    servicos: [],
  });

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user.barberId) {
        setError("Erro: Barbeiro não identificado");
        return;
      }
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:3000/queue/${user.barberId}/updates`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Falha ao carregar fila");
      const data = await res.json();
      const entries = Array.isArray(data)
        ? data
        : Array.isArray(data?.queue)
          ? data.queue
          : [];
      setQueueEntries(entries);
    } catch (e) {
      setError("Erro ao carregar fila de espera");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (
    id: number | string,
    status: "in_service" | "completed" | "no_show"
  ) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/queue/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // Converter status para os valores aceitos no backend
        body: JSON.stringify({
          status:
            status === "in_service"
              ? "ATENDENDO"
              : status === "completed"
                ? "ATENDIDO"
                : status === "no_show"
                  ? "FALTOU"
                  : status,
        }),
      });
      if (!res.ok) throw new Error("Falha ao atualizar status");
      fetchQueue();
    } catch (e) {
      setError("Erro ao atualizar status");
    } finally {
      setUpdating(false);
    }
  };

  const adicionarCliente = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/queue/enter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          barbeiro_id: user.barberId,
          nome: newClient.nome,
          telefone: newClient.telefone,
          serviceIds: newClient.servicos,
        }),
      });
      if (!res.ok) throw new Error("Falha ao adicionar cliente");
      setNewClient({ nome: "", telefone: "", servicos: [] });
      setShowAddClientModal(false);
      fetchQueue();
    } catch (e) {
      setError("Erro ao adicionar cliente à fila");
    }
  };

  const statusText = (status: string) => {
    const s = status.toLowerCase();
    if (s === "in_service" || s === "atendendo" || s === "atendendo")
      return "em atendimento";
    if (s === "waiting" || s === "aguardando") return "aguardando";
    if (s === "completed" || s === "atendido") return "concluído";
    if (s === "no_show" || s === "faltou") return "faltou";
    return s;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-4 border-[#f2b63a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <div className="text-xl text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#26242d] rounded-xl p-4 sm:p-6">
        <button
          onClick={() => setShowAddClientModal(true)}
          className="w-full sm:w-auto px-4 py-2 bg-[#4b4950] text-[#f2b63a] rounded-lg hover:bg-[#3d3b42] transition-colors text-sm font-medium flex items-center"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Adicionar Cliente
        </button>
        <div className="space-y-3 mt-6">
          {queueEntries.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              Nenhum cliente na fila no momento
            </div>
          ) : (
            queueEntries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 bg-[#2e2d37] rounded-lg border border-[#4b4950]/20"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-medium text-[#f2b63a]">
                        {entry.cliente?.nome || "Cliente sem nome"}
                      </h3>
                      <span
                        className={`text-xs sm:text-sm ${
                          ["in_service", "atendendo", "atendendo"].includes(
                            entry.status.toLowerCase()
                          )
                            ? "text-green-400"
                            : ["waiting", "aguardando"].includes(
                                  entry.status.toLowerCase()
                                )
                              ? "text-white"
                              : "text-gray-400"
                        }`}
                      >
                        {statusText(entry.status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      Telefone: {entry.cliente?.telefone || "Sem telefone"}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {entry.servicos && entry.servicos.length > 0 ? (
                        entry.servicos.map((s) => (
                          <span
                            key={String(s.id)}
                            className="px-2 py-1 bg-[#4b4950]/20 text-gray-300 rounded text-xs"
                          >
                            {s.name || s.nome || "Sem nome"}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">
                          Nenhum serviço selecionado
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-0 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                    {["waiting", "aguardando"].includes(
                      entry.status.toLowerCase()
                    ) && (
                      <button
                        onClick={() => updateStatus(entry.id, "in_service")}
                        disabled={updating}
                        className="px-4 py-2 bg-[#4b4950] text-green-400 rounded-lg hover:bg-[#3d3b42] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Iniciar Atendimento
                      </button>
                    )}
                    {["in_service", "atendendo", "atendendo"].includes(
                      entry.status.toLowerCase()
                    ) && (
                      <button
                        onClick={() => updateStatus(entry.id, "completed")}
                        disabled={updating}
                        className="px-4 py-2 bg-[#4b4950] text-[#f2b63a] rounded-lg hover:bg-[#3d3b42] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Finalizar Atendimento
                      </button>
                    )}
                    <button
                      onClick={() => updateStatus(entry.id, "no_show")}
                      disabled={
                        updating || entry.status.toLowerCase() === "completed"
                      }
                      className="px-4 py-2 bg-[#4b4950] text-red-400 rounded-lg hover:bg-[#3d3b42] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Faltou
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  <span>Posição: {entry.posicao ?? "N/A"}</span>
                  <span className="mx-2">•</span>
                  <span>
                    Entrada:{" "}
                    {entry.horaEntrada || entry.hora_entrada
                      ? new Date(
                          entry.horaEntrada || entry.hora_entrada || ""
                        ).toLocaleTimeString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <p className="text-gray-500 text-xs">
          Atualizando automaticamente a cada 15 segundos
        </p>
      </div>

      <Modal
        isOpen={showAddClientModal}
        onClose={() => setShowAddClientModal(false)}
        title="ADICIONAR CLIENTE"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Nome</label>
            <input
              type="text"
              value={newClient.nome}
              onChange={(e) =>
                setNewClient({ ...newClient, nome: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#2e2d37] text-gray-300 border border-[#4b4950]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f2b63a] focus:border-transparent"
              placeholder="Nome do cliente"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Telefone</label>
            <input
              type="tel"
              value={newClient.telefone}
              onChange={(e) =>
                setNewClient({ ...newClient, telefone: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#2e2d37] text-gray-300 border border-[#4b4950]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f2b63a] focus:border-transparent"
              placeholder="(00) 00000-0000"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Serviços</label>
            <div className="space-y-3 bg-[#2e2d37] p-4 rounded-lg border border-[#4b4950]/20">
              {SERVICOS.map((servico) => (
                <label key={servico.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newClient.servicos.includes(servico.id)}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...newClient.servicos, servico.id]
                        : newClient.servicos.filter((id) => id !== servico.id);
                      setNewClient({ ...newClient, servicos: updated });
                    }}
                    className="mr-3 h-4 w-4 rounded border-[#4b4950]/20 text-[#f2b63a] focus:ring-[#f2b63a] focus:ring-offset-0 bg-[#26242d]"
                  />
                  <span className="text-gray-300 text-sm">{servico.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-3 mt-8">
          <button
            onClick={() => setShowAddClientModal(false)}
            className="px-4 py-2 bg-[#4b4950]/20 text-gray-400 rounded-lg hover:bg-[#4b4950]/30 transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={adicionarCliente}
            disabled={
              !newClient.nome ||
              !newClient.telefone ||
              newClient.servicos.length === 0
            }
            className={`px-4 py-2 bg-[#4b4950] text-[#f2b63a] rounded-lg transition-colors text-sm font-medium ${
              !newClient.nome ||
              !newClient.telefone ||
              newClient.servicos.length === 0
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-[#3d3b42]"
            }`}
          >
            Adicionar
          </button>
        </div>
      </Modal>
    </div>
  );
}
