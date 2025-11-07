"use client";

import { useEffect, useState } from "react";

interface Cliente {
  nome: string;
  telefone: string;
}

interface NovoCliente {
  nome: string;
  telefone: string;
  servicos: string[];
}

interface QueueEntry {
  id: string;
  posicao: number;
  cliente: Cliente;
  horaEntrada: string;
  servicos: Array<{
    id: string;
    nome: string;
    tempo_estimado: number;
  }>;
  status: "waiting" | "in_service" | "completed" | "cancelled" | "no_show";
}

export default function FilaAdmin() {
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAvailable, setIsAvailable] = useState(false);
  const [showAddClientForm, setShowAddClientForm] = useState(false);
  const [novoCliente, setNovoCliente] = useState<NovoCliente>({
    nome: "",
    telefone: "",
    servicos: [],
  });

  useEffect(() => {
    console.log("[Queue] Inicializando componente");
    fetchQueue();
    fetchBarberStatus();
    // Atualiza a fila a cada 30 segundos
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      console.log("[Queue] User data:", user);

      if (!user.barberId) {
        console.error("[Queue] Barber ID não encontrado no localStorage");
        setError("Erro: Barbeiro não identificado");
        return;
      }

      console.log(
        "[Queue] Fazendo requisição para:",
        `http://localhost:3000/queue/${user.barberId}`
      );

      const response = await fetch(
        `http://localhost:3000/queue/${user.barberId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        console.error("[Queue] Resposta não OK:", {
          status: response.status,
          statusText: response.statusText,
        });
        const errorText = await response.text();
        console.error("[Queue] Erro detalhado:", errorText);
        throw new Error("Falha ao carregar fila");
      }

      const data = await response.json();
      console.log("[Queue] Dados recebidos:", data);

      if (!Array.isArray(data)) {
        console.error("[Queue] Dados recebidos não são um array:", data);
        setError("Erro: Formato de dados inválido");
        return;
      }

      setQueueEntries(data);
    } catch (err) {
      setError("Erro ao carregar fila de espera");
      console.error("[Queue] Erro completo:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBarberStatus = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const barberId = user.barberId;
      const response = await fetch(
        `http://localhost:3000/barbers/${barberId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Falha ao carregar status do barbeiro");

      const data = await response.json();
      setIsAvailable(data.disponivel);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAvailability = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const barberId = user.barberId;
      const response = await fetch(
        `http://localhost:3000/barbers/${barberId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ disponivel: !isAvailable }),
        }
      );

      if (!response.ok) throw new Error("Falha ao atualizar disponibilidade");

      setIsAvailable(!isAvailable);
    } catch (err) {
      setError("Erro ao atualizar disponibilidade");
      console.error(err);
    }
  };

  const adicionarClienteManualmente = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await fetch("http://localhost:3000/queue/enter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          barbeiro_id: user.barberId,
          cliente: {
            nome: novoCliente.nome,
            telefone: novoCliente.telefone,
          },
          servicos: novoCliente.servicos,
        }),
      });

      if (!response.ok) throw new Error("Falha ao adicionar cliente");

      setShowAddClientForm(false);
      setNovoCliente({ nome: "", telefone: "", servicos: [] });
      fetchQueue();
    } catch (err) {
      setError("Erro ao adicionar cliente à fila");
      console.error(err);
    }
  };

  const updateStatus = async (
    id: string,
    status: "in_service" | "completed" | "cancelled" | "no_show"
  ) => {
    try {
      const response = await fetch(`http://localhost:3000/queue/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error("Falha ao atualizar status");

      fetchQueue();
    } catch (err) {
      setError("Erro ao atualizar status");
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "waiting":
      case "aguardando":
        return "bg-yellow-900/20 text-yellow-400 border-yellow-500/20";
      case "in_service":
      case "em_atendimento":
        return "bg-blue-900/20 text-blue-400 border-blue-500/20";
      case "completed":
      case "finalizado":
        return "bg-green-900/20 text-green-400 border-green-500/20";
      case "cancelled":
      case "cancelado":
        return "bg-red-900/20 text-red-400 border-red-500/20";
      case "no_show":
      case "nao_compareceu":
        return "bg-orange-900/20 text-orange-400 border-orange-500/20";
      default:
        return "bg-gray-900/20 text-gray-400 border-gray-500/20";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "waiting":
        return "Aguardando";
      case "in_service":
        return "Em Atendimento";
      case "completed":
        return "Concluído";
      case "cancelled":
        return "Cancelado";
      case "no_show":
        return "Não Compareceu";
      default:
        return status;
    }
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
      {error && (
        <div className="bg-red-900/20 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Status do Barbeiro */}
      <div className="bg-[#26242d] rounded-xl shadow-lg p-6 border border-gray-700/50 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-[#f2b63a] mb-2">
              Status de Atendimento
            </h2>
            <p className="text-gray-400">
              {isAvailable
                ? "Você está disponível para atendimentos"
                : "Você está indisponível para atendimentos"}
            </p>
          </div>
          <button
            onClick={toggleAvailability}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              isAvailable
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {isAvailable ? "Ficar Indisponível" : "Ficar Disponível"}
          </button>
        </div>
      </div>

      {/* Formulário de Adição Manual de Cliente */}
      <div className="bg-[#26242d] rounded-xl shadow-lg p-6 border border-gray-700/50 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#f2b63a]">
            Adicionar Cliente Manualmente
          </h2>
          <button
            onClick={() => setShowAddClientForm(!showAddClientForm)}
            className="px-4 py-2 bg-[#f2b63a] text-black rounded-lg hover:bg-[#d9a434] transition-colors"
          >
            {showAddClientForm ? "Cancelar" : "Adicionar Cliente"}
          </button>
        </div>

        {showAddClientForm && (
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Nome do Cliente
              </label>
              <input
                type="text"
                value={novoCliente.nome}
                onChange={(e) =>
                  setNovoCliente({ ...novoCliente, nome: e.target.value })
                }
                className="w-full px-4 py-2 bg-[#2e2d37] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#f2b63a]"
                placeholder="Nome do cliente"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Telefone
              </label>
              <input
                type="tel"
                value={novoCliente.telefone}
                onChange={(e) =>
                  setNovoCliente({ ...novoCliente, telefone: e.target.value })
                }
                className="w-full px-4 py-2 bg-[#2e2d37] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#f2b63a]"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Serviços
              </label>
              <select
                multiple
                value={novoCliente.servicos}
                onChange={(e) =>
                  setNovoCliente({
                    ...novoCliente,
                    servicos: Array.from(
                      e.target.selectedOptions,
                      (option) => option.value
                    ),
                  })
                }
                className="w-full px-4 py-2 bg-[#2e2d37] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#f2b63a]"
              >
                <option value="1">Corte de Cabelo</option>
                <option value="2">Barba</option>
                <option value="3">Corte + Barba</option>
              </select>
            </div>
            <button
              onClick={adicionarClienteManualmente}
              className="w-full px-4 py-2 bg-[#f2b63a] text-black rounded-lg hover:bg-[#d9a434] transition-colors"
            >
              Adicionar à Fila
            </button>
          </div>
        )}
      </div>

      {/* Lista da Fila */}
      <div className="bg-[#26242d] rounded-xl shadow-lg p-6 border border-gray-700/50">
        <h2 className="text-xl font-semibold text-[#f2b63a] mb-6">
          Fila de Espera
        </h2>
        <div className="space-y-4">
          {queueEntries?.length > 0 ? (
            queueEntries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 bg-[#2e2d37] rounded-lg border border-gray-700/50"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-white">
                      {entry.cliente?.nome || "Cliente sem nome"}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {entry.cliente?.telefone || "Sem telefone"}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                      entry.status
                    )}`}
                  >
                    {getStatusText(entry.status)}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-gray-400">
                    <span>Posição: {entry.posicao || "N/A"}</span>
                    <span className="mx-2">•</span>
                    <span>
                      Entrada:{" "}
                      {entry.horaEntrada
                        ? new Date(entry.horaEntrada).toLocaleTimeString()
                        : "N/A"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(entry.servicos) &&
                    entry.servicos.length > 0 ? (
                      entry.servicos.map((servico) => (
                        <span
                          key={servico.id}
                          className="px-2 py-1 bg-[#4b4950] text-sm rounded-full text-white"
                        >
                          {servico.nome || "Sem nome"} -{" "}
                          {servico.tempo_estimado || 0}min
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">
                        Nenhum serviço registrado
                      </span>
                    )}
                  </div>

                  {(entry.status === "waiting" ||
                    entry.status.toUpperCase() === "AGUARDANDO") && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        onClick={() => updateStatus(entry.id, "in_service")}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Iniciar Atendimento
                      </button>
                      <button
                        onClick={() => updateStatus(entry.id, "no_show")}
                        className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors"
                      >
                        Não Compareceu
                      </button>
                      <button
                        onClick={() => updateStatus(entry.id, "cancelled")}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}

                  {entry.status === "in_service" && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => updateStatus(entry.id, "completed")}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Concluir Atendimento
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              Nenhum cliente na fila de espera
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
