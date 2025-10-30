"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface QueueEntry {
  id: number;
  cliente_id: number;
  barbeiro_id: number;
  status: string;
  posicao: number;
  hora_entrada: string;
  hora_saida: string | null;
  cliente: {
    id: number;
    nome: string;
    telefone: string;
    data_criacao: string;
  };
}

interface Barber {
  id: number;
  nome: string;
  disponivel: boolean;
}

export default function PainelBarbeiro() {
  const router = useRouter();
  const [filaAtual, setFilaAtual] = useState<QueueEntry[]>([]);
  const [historico, setHistorico] = useState<QueueEntry[]>([]);
  const [barber, setBarber] = useState<Barber | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<"fila" | "historico">("fila");

  useEffect(() => {
    // Verificar se o usuário está logado
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      router.push("/barbeiro");
      return;
    }

    const userData = JSON.parse(user);
    if (userData.type !== "barber") {
      router.push("/barbeiro");
      return;
    }

    setBarber(userData);
    fetchData(userData.id);

    // Atualizar a cada 15 segundos
    const interval = setInterval(() => fetchData(userData.id), 15000);
    return () => clearInterval(interval);
  }, [router]);

  const fetchData = async (barberId: number) => {
    try {
      const token = localStorage.getItem("token");

      // Buscar fila atual
      const filaResponse = await fetch(
        `http://localhost:3000/queue/${barberId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Buscar histórico
      const historicoResponse = await fetch(
        `http://localhost:3000/queue/${barberId}/historico`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!filaResponse.ok || !historicoResponse.ok) {
        throw new Error("Erro ao carregar dados");
      }

      const filaData = await filaResponse.json();
      const historicoData = await historicoResponse.json();

      setFilaAtual(filaData);
      setHistorico(historicoData);
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (queueId: number, status: string) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3000/queue/${queueId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao atualizar status");
      }

      // Atualizar os dados após mudança
      if (barber) {
        fetchData(barber.id);
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao atualizar status");
    } finally {
      setUpdating(false);
    }
  };

  const toggleDisponibilidade = async () => {
    if (!barber) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3000/barbers/${barber.id}/disponibilidade`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao alterar disponibilidade");
      }

      const updatedBarber = await response.json();
      setBarber(updatedBarber);
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao alterar disponibilidade");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/barbeiro");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  if (!barber) {
    return null;
  }

  // Calcular estatísticas
  const totalAtendidos = historico.filter(
    (entry) => entry.status === "ATENDIDO"
  ).length;
  const totalFaltas = historico.filter(
    (entry) => entry.status === "FALTOU"
  ).length;
  const totalAtendendo = filaAtual.filter(
    (entry) => entry.status === "ATENDENDO"
  ).length;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-yellow-500">
                Painel do Barbeiro
              </h1>
              <p className="text-gray-400">Bem-vindo, {barber.nome}</p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Botão Disponibilidade */}
              <button
                onClick={toggleDisponibilidade}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  barber.disponivel
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                }`}
              >
                {barber.disponivel ? "🟢 Disponível" : "🔴 Indisponível"}
              </button>

              {/* Botão Logout */}
              <button
                onClick={handleLogout}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {filaAtual.length}
              </div>
              <div className="text-gray-400">Na Fila</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-500">
                {totalAtendendo}
              </div>
              <div className="text-gray-400">Atendendo</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-500">
                {totalAtendidos}
              </div>
              <div className="text-gray-400">Atendidos</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-500">
                {totalFaltas}
              </div>
              <div className="text-gray-400">Faltas</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-700 mb-6">
            <button
              onClick={() => setActiveTab("fila")}
              className={`px-4 py-2 font-semibold ${
                activeTab === "fila"
                  ? "text-yellow-500 border-b-2 border-yellow-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Fila Atual ({filaAtual.length})
            </button>
            <button
              onClick={() => setActiveTab("historico")}
              className={`px-4 py-2 font-semibold ${
                activeTab === "historico"
                  ? "text-yellow-500 border-b-2 border-yellow-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Histórico ({historico.length})
            </button>
          </div>

          {/* Conteúdo das Tabs */}
          {activeTab === "fila" && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Fila Atual</h2>

              {filaAtual.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  Nenhum cliente na fila no momento
                </div>
              ) : (
                <div className="space-y-3">
                  {filaAtual.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-white">
                            {entry.cliente.nome}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            Telefone: {entry.cliente.telefone}
                          </p>
                          <p className="text-gray-400 text-sm">
                            Posição: {entry.posicao} • Entrou:{" "}
                            {new Date(entry.hora_entrada).toLocaleTimeString(
                              "pt-BR"
                            )}
                          </p>
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded ${
                              entry.status === "ATENDENDO"
                                ? "bg-green-500 text-white"
                                : "bg-yellow-500 text-gray-900"
                            }`}
                          >
                            {entry.status === "ATENDENDO"
                              ? "ATENDENDO"
                              : "AGUARDANDO"}
                          </span>
                        </div>

                        <div className="flex space-x-2">
                          {entry.status === "AGUARDANDO" && (
                            <button
                              onClick={() =>
                                updateStatus(entry.id, "ATENDENDO")
                              }
                              disabled={updating}
                              className="bg-green-500 hover:bg-green-600 disabled:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors"
                            >
                              Atender
                            </button>
                          )}

                          {entry.status === "ATENDENDO" && (
                            <button
                              onClick={() => updateStatus(entry.id, "ATENDIDO")}
                              disabled={updating}
                              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
                            >
                              Finalizar
                            </button>
                          )}

                          <button
                            onClick={() => updateStatus(entry.id, "FALTOU")}
                            disabled={updating}
                            className="bg-red-500 hover:bg-red-600 disabled:bg-red-700 text-white px-3 py-2 rounded text-sm transition-colors"
                          >
                            Não Compareceu
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "historico" && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Histórico Recente</h2>

              {historico.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  Nenhum atendimento no histórico
                </div>
              ) : (
                <div className="space-y-3">
                  {historico.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-white">
                            {entry.cliente.nome}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            Telefone: {entry.cliente.telefone}
                          </p>
                          <p className="text-gray-400 text-sm">
                            Entrada:{" "}
                            {new Date(entry.hora_entrada).toLocaleString(
                              "pt-BR"
                            )}
                            {entry.hora_saida &&
                              ` • Saída: ${new Date(entry.hora_saida).toLocaleString("pt-BR")}`}
                          </p>
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Informação de atualização */}
          <p className="text-gray-500 text-xs text-center mt-4">
            Atualizando automaticamente a cada 15 segundos
          </p>
        </div>
      </div>
    </div>
  );
}
