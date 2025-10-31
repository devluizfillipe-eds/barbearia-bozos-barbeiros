"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Service {
  id: number;
  name: string;
  price: number;
  duration: number;
}

interface QueueEntry {
  id: number;
  cliente_id: number;
  barbeiro_id: number;
  status: string;
  posicao: number;
  hora_entrada: string;
  hora_saida: string | null;
  servicos: Service[];
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
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterService, setFilterService] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClient, setNewClient] = useState({
    nome: "",
    telefone: "",
    servicos: [] as number[],
  });

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

    if (!barber.disponivel) {
      setShowConfirmDialog(true);
      return;
    }

    await updateDisponibilidade();
  };

  const updateDisponibilidade = async () => {
    try {
      if (!barber) return;

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
      setShowConfirmDialog(false);
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao alterar disponibilidade");
    }
  };

  const filterEntries = (entries: QueueEntry[]) => {
    return entries.filter((entry) => {
      // Filtro por data
      if (filterDate) {
        const entryDate = new Date(entry.hora_entrada).toLocaleDateString();
        if (entryDate !== new Date(filterDate).toLocaleDateString()) {
          return false;
        }
      }

      // Filtro por serviço
      if (filterService && entry.servicos) {
        if (!entry.servicos.some((service) => service.id === filterService)) {
          return false;
        }
      }

      return true;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/barbeiro");
  };

  const handleAddClient = async () => {
    if (!barber) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/queue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          barbeiro_id: barber.id,
          cliente: {
            nome: newClient.nome,
            telefone: newClient.telefone,
          },
          servicos: newClient.servicos,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao adicionar cliente");
      }

      // Limpar formulário e fechar modal
      setNewClient({
        nome: "",
        telefone: "",
        servicos: [],
      });
      setShowAddClientModal(false);

      // Atualizar a fila
      fetchData(barber.id);
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao adicionar cliente");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2e2d37] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#f2b63a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl">Carregando...</div>
        </div>
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
    <div className="min-h-screen bg-[#2e2d37] text-white">
      {/* Logo e título */}
      <div className="w-full bg-[#26242d] py-8">
        <div className="max-w-3xl mx-auto text-center">
          <Image
            src="/images/logo.jpg"
            alt="BOZOS BARBEIROS"
            width={128}
            height={128}
            className="mx-auto rounded-full mb-4"
            priority
          />
          <div className="flex justify-between items-center px-4">
            <div>
              <h1 className="text-2xl font-bold text-[#f2b63a]">
                Painel do Barbeiro
              </h1>
              <p className="text-gray-300">Bem-vindo, {barber.nome}</p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Status de Disponibilidade */}
              <div className="flex items-center space-x-4">
                <div
                  className={`px-4 py-2 rounded-lg font-semibold transition-all transform ${
                    barber.disponivel
                      ? "bg-green-500/10 text-green-500 border-2 border-green-500"
                      : "bg-red-500/10 text-red-500 border-2 border-red-500"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        barber.disponivel
                          ? "bg-green-500 animate-pulse"
                          : "bg-red-500"
                      }`}
                    ></div>
                    <span>{barber.disponivel ? "Online" : "Offline"}</span>
                  </div>
                </div>
                <button
                  onClick={toggleDisponibilidade}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    barber.disponivel
                      ? "bg-red-500 hover:bg-red-600 text-white hover:scale-105"
                      : "bg-green-500 hover:bg-green-600 text-white hover:scale-105"
                  }`}
                >
                  {barber.disponivel ? "Ficar Offline" : "Ficar Online"}
                </button>
              </div>

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
            <div className="bg-[#4b4950] rounded-2xl p-4 text-center shadow-lg">
              <div className="text-2xl font-bold text-[#f2b63a]">
                {filaAtual.length}
              </div>
              <div className="text-gray-300">Na Fila</div>
            </div>
            <div className="bg-[#4b4950] rounded-2xl p-4 text-center shadow-lg">
              <div className="text-2xl font-bold text-green-400">
                {totalAtendendo}
              </div>
              <div className="text-gray-300">Atendendo</div>
            </div>
            <div className="bg-[#4b4950] rounded-2xl p-4 text-center shadow-lg">
              <div className="text-2xl font-bold text-blue-400">
                {totalAtendidos}
              </div>
              <div className="text-gray-300">Atendidos</div>
            </div>
            <div className="bg-[#4b4950] rounded-2xl p-4 text-center shadow-lg">
              <div className="text-2xl font-bold text-red-400">
                {totalFaltas}
              </div>
              <div className="text-gray-300">Faltas</div>
            </div>
          </div>{" "}
          {/* Modal de Adicionar Cliente */}
          {showAddClientModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[#4b4950] p-6 rounded-2xl shadow-xl max-w-md w-full mx-4">
                <h3 className="text-xl font-semibold mb-4 text-[#f2b63a]">
                  Adicionar Cliente
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={newClient.nome}
                      onChange={(e) =>
                        setNewClient({ ...newClient, nome: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-[#2e2d37] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f2b63a]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={newClient.telefone}
                      onChange={(e) =>
                        setNewClient({ ...newClient, telefone: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-[#2e2d37] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f2b63a]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      Serviços
                    </label>
                    <div className="space-y-2">
                      {[
                        { id: 1, name: "Corte" },
                        { id: 2, name: "Barba" },
                        { id: 3, name: "Sobrancelha" },
                        { id: 4, name: "Textura" },
                        { id: 5, name: "Pigmentação" },
                      ].map((servico) => (
                        <label key={servico.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newClient.servicos.includes(servico.id)}
                            onChange={(e) => {
                              const updatedServices = e.target.checked
                                ? [...newClient.servicos, servico.id]
                                : newClient.servicos.filter(
                                    (id) => id !== servico.id
                                  );
                              setNewClient({
                                ...newClient,
                                servicos: updatedServices,
                              });
                            }}
                            className="mr-2 accent-[#f2b63a]"
                          />
                          <span className="text-gray-300">{servico.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddClientModal(false)}
                    className="px-4 py-2 bg-[#2e2d37] hover:bg-opacity-80 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddClient}
                    disabled={
                      !newClient.nome ||
                      !newClient.telefone ||
                      newClient.servicos.length === 0
                    }
                    className="px-4 py-2 bg-[#f2b63a] hover:brightness-110 text-[#2e2d37] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Modal de Confirmação */}
          {showConfirmDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[#4b4950] p-6 rounded-2xl shadow-xl max-w-md w-full mx-4">
                <h3 className="text-xl font-semibold mb-4 text-[#f2b63a]">
                  Confirmar Disponibilidade
                </h3>
                <p className="text-gray-300 mb-6">
                  Você está prestes a ficar disponível para atendimento.
                  Confirma que está pronto para receber clientes?
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowConfirmDialog(false)}
                    className="px-4 py-2 bg-[#2e2d37] hover:bg-opacity-80 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={updateDisponibilidade}
                    className="px-4 py-2 bg-[#f2b63a] hover:brightness-110 text-[#2e2d37] rounded-lg transition-all"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-gray-400 mb-1">Data</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-gray-400 mb-1">
                Serviço
              </label>
              <select
                value={filterService || ""}
                onChange={(e) =>
                  setFilterService(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">Todos os serviços</option>
                <option value="1">Corte</option>
                <option value="2">Barba</option>
                <option value="3">Sobrancelha</option>
                <option value="4">Textura</option>
                <option value="5">Pigmentação</option>
              </select>
            </div>
            {(filterDate || filterService) && (
              <button
                onClick={() => {
                  setFilterDate("");
                  setFilterService(null);
                }}
                className="self-end px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
              >
                Limpar Filtros
              </button>
            )}
          </div>
          {/* Tabs */}
          <div className="flex border-b border-gray-600 mb-6">
            <button
              onClick={() => setActiveTab("fila")}
              className={`px-4 py-2 font-semibold ${
                activeTab === "fila"
                  ? "text-[#f2b63a] border-b-2 border-[#f2b63a]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Fila Atual ({filaAtual.length})
            </button>
            <button
              onClick={() => setActiveTab("historico")}
              className={`px-4 py-2 font-semibold ${
                activeTab === "historico"
                  ? "text-[#f2b63a] border-b-2 border-[#f2b63a]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Histórico ({historico.length})
            </button>
          </div>
          {/* Conteúdo das Tabs */}
          {activeTab === "fila" && (
            <div className="bg-[#4b4950] rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-[#f2b63a]">
                Fila Atual
              </h2>

              {/* Botão Adicionar Cliente */}
              <button
                onClick={() => setShowAddClientModal(true)}
                className="mb-4 px-4 py-2 bg-[#f2b63a] hover:brightness-110 text-[#2e2d37] rounded-lg transition-all font-semibold flex items-center"
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

              {filterEntries(filaAtual).length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  Nenhum cliente na fila no momento
                </div>
              ) : (
                <div className="space-y-3">
                  {filterEntries(filaAtual).map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                    >
                      <div className="flex justify-between items-center">
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
                                Posição: {entry.posicao} • Entrou:{" "}
                                {new Date(
                                  entry.hora_entrada
                                ).toLocaleTimeString("pt-BR")}
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
                                {entry.servicos &&
                                  entry.servicos.length > 0 && (
                                    <p className="text-sm text-yellow-500">
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
                              {entry.status === "ATENDENDO"
                                ? "ATENDENDO"
                                : "AGUARDANDO"}
                            </span>
                          </div>
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
            <div className="bg-[#4b4950] rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-[#f2b63a]">
                Histórico Recente
              </h2>

              {filterEntries(historico).length === 0 ? (
                <div className="text-center text-gray-300 py-8">
                  Nenhum atendimento no histórico
                </div>
              ) : (
                <div className="space-y-3">
                  {filterEntries(historico).map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                    >
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
                                  {new Date(entry.hora_entrada).toLocaleString(
                                    "pt-BR"
                                  )}
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
                                <p className="text-sm text-yellow-500">
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
