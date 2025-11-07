"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import { Filters } from "@/components/ui/Filters";
import { SERVICOS } from "@/constants/servicos";
import { getToken, getUser, logout } from "@/lib/auth";
import { getImageUrl } from "@/lib/utils";
import { QueueEntry } from "@/types";

interface Barber {
  id: number;
  nome: string;
  disponivel: boolean;
  foto_url?: string;
}

export default function PainelBarbeiro() {
  const router = useRouter();
  const [filaAtual, setFilaAtual] = useState<QueueEntry[]>([]);
  const [historico, setHistorico] = useState<QueueEntry[]>([]);

  // Função para garantir que os dados são arrays
  const ensureArray = (data: any): QueueEntry[] => {
    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray(data.queue)) {
      return data.queue;
    }
    return [];
  };
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
    const checkAndFetchData = async () => {
      // Verificar se o usuário está logado
      const token = getToken();
      const user = getUser();

      if (!token || !user) {
        console.log("Token ou user não encontrado");
        router.push("/barbeiro");
        return;
      }

      try {
        try {
          if (user.type !== "barber") {
            console.log("Usuário não é barbeiro");
            router.push("/barbeiro");
            return;
          }

          // Verificar se o barbeiro ainda existe no sistema
          const response = await fetch(
            `http://localhost:3000/barbers/${user.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            if (response.status === 404) {
              console.log("Barbeiro não encontrado no sistema");
              // Limpar dados do usuário e redirecionar
              logout();
              router.push("/barbeiro");
              return;
            }
            throw new Error(`Erro ao verificar barbeiro: ${response.status}`);
          }

          const barberData = await response.json();
          console.log("Barber data:", barberData);
          setBarber(barberData);

          // Iniciar busca de dados
          await fetchData(user.id);

          // Atualizar a cada 15 segundos
          const interval = setInterval(() => fetchData(user.id), 15000);
          return () => clearInterval(interval);
        } catch (error) {
          console.error("Erro ao processar dados do usuário:", error);
          alert(
            "Erro ao carregar dados do barbeiro. Por favor, faça login novamente."
          );
          logout();
          router.push("/barbeiro");
        }
      } catch (error) {
        console.error("Erro ao processar dados do usuário:", error);
        alert(
          "Erro ao carregar dados do barbeiro. Por favor, faça login novamente."
        );
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/barbeiro");
      }
    };

    checkAndFetchData();
  }, [router]);

  const fetchData = async (barberId: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token não encontrado");
      }

      // Buscar fila atual
      const filaResponse = await fetch(
        `http://localhost:3000/queue/${barberId}/updates`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      ).catch(() => {
        throw new Error(
          "Não foi possível conectar ao servidor. Verifique se o backend está rodando."
        );
      });

      // Buscar histórico
      const historicoResponse = await fetch(
        `http://localhost:3000/queue/${barberId}/historico`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      ).catch(() => {
        throw new Error(
          "Não foi possível conectar ao servidor. Verifique se o backend está rodando."
        );
      });

      if (!filaResponse.ok || !historicoResponse.ok) {
        // Se alguma das respostas retornar 404, significa que o barbeiro não existe mais
        if (filaResponse.status === 404 || historicoResponse.status === 404) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/barbeiro");
          throw new Error(
            "Sua sessão expirou. Por favor, faça login novamente."
          );
        }

        // Para outros erros, tentar obter mais detalhes
        let errorMessage = "Erro ao carregar dados:";
        if (!filaResponse.ok) {
          const filaError = await filaResponse.json();
          errorMessage += `\nFila: ${filaError.message || filaResponse.statusText}`;
        }
        if (!historicoResponse.ok) {
          const historicoError = await historicoResponse.json();
          errorMessage += `\nHistórico: ${historicoError.message || historicoResponse.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const filaData = await filaResponse.json();
      const historicoData = await historicoResponse.json();

      // Usar a função helper para garantir arrays válidos
      setFilaAtual(ensureArray(filaData));
      setHistorico(ensureArray(historicoData));
    } catch (error) {
      console.error("Erro ao carregar dados:", error);

      // Se for erro de autenticação ou barbeiro não encontrado
      if (
        error instanceof Error &&
        (error.message.includes("sessão expirou") ||
          error.message.includes("Token não encontrado"))
      ) {
        // Já redirecionamos acima, não precisa fazer nada aqui
        return;
      }

      // Para erros de conexão
      if (
        error instanceof Error &&
        error.message.includes("conectar ao servidor")
      ) {
        alert(
          "Não foi possível conectar ao servidor. Verifique sua conexão e se o servidor está rodando."
        );
        return;
      }

      // Para outros tipos de erro, mostrar mensagem específica
      alert(
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao carregar dados"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (queueId: number, status: string) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error(
          "Token não encontrado. Por favor, faça login novamente."
        );
      }

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
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erro ao atualizar status do cliente"
        );
      }

      // Atualizar os dados após mudança
      if (barber) {
        fetchData(barber.id);
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao atualizar status";
      alert(errorMessage);
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!barber || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("foto", file);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3000/barbers/${barber.id}/foto`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao atualizar foto");
      }

      const updatedBarber = await response.json();
      setBarber(updatedBarber);
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao atualizar foto");
    }
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
    logout();
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
  const totalAtendidos = Array.isArray(historico)
    ? historico.filter((entry) => entry.status === "ATENDIDO").length
    : 0;
  const totalFaltas = Array.isArray(historico)
    ? historico.filter((entry) => entry.status === "FALTOU").length
    : 0;
  const totalAtendendo = Array.isArray(filaAtual)
    ? filaAtual.filter((entry) => entry.status === "ATENDENDO").length
    : 0;

  return (
    <div className="min-h-screen bg-[#2e2d37] text-white">
      {/* Header */}
      <div className="w-full bg-[#26242d] py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-[#4b4950] overflow-hidden">
                  {barber.foto_url ? (
                    <Image
                      src={getImageUrl(barber.foto_url) || ""}
                      alt={`Foto de ${barber.nome}`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#f2b63a]">
                      <svg
                        className="w-8 h-8"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <label
                  htmlFor="foto-upload"
                  className="absolute bottom-0 right-0 bg-[#f2b63a] rounded-full p-1 cursor-pointer hover:bg-[#d9a434] transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-[#2e2d37]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </label>
                <input
                  type="file"
                  id="foto-upload"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
              <div>
                <h1 className="text-2xl text-[#f2b63a] font-[700] font-['Almendra'] tracking-wider">
                  PAINEL DO BARBEIRO
                </h1>
                <p className="text-gray-400 text-sm">
                  Bem-vindo, {barber.nome}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Status de Disponibilidade */}
              <div
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  barber.disponivel
                    ? "bg-green-900/20 text-green-400 border border-green-500/20"
                    : "bg-red-900/20 text-red-400 border border-red-500/20"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      barber.disponivel
                        ? "bg-green-400 animate-pulse"
                        : "bg-red-400"
                    }`}
                  ></div>
                  <span>
                    {barber.disponivel ? "Disponível" : "Indisponível"}
                  </span>
                </div>
              </div>

              <button
                onClick={toggleDisponibilidade}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  barber.disponivel
                    ? "bg-red-900/20 text-red-400 border border-red-500/20 hover:bg-red-900/30"
                    : "bg-green-900/20 text-green-400 border border-green-500/20 hover:bg-green-900/30"
                }`}
              >
                {barber.disponivel ? "Ficar Indisponível" : "Ficar Disponível"}
              </button>

              {/* Botão Logout */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-[#4b4950] text-[#f2b63a] rounded-lg hover:bg-[#3d3b42] transition-colors text-sm"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Tabs */}
          <div className="flex border-b border-[#4b4950]/20">
            <button
              onClick={() => setActiveTab("fila")}
              className={`py-3 px-6 text-sm font-medium transition-colors ${
                activeTab === "fila"
                  ? "text-[#f2b63a] border-b-2 border-[#f2b63a]"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Fila Atual ({filaAtual.length})
            </button>
            <button
              onClick={() => setActiveTab("historico")}
              className={`py-3 px-6 text-sm font-medium transition-colors ${
                activeTab === "historico"
                  ? "text-[#f2b63a] border-b-2 border-[#f2b63a]"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Histórico ({historico.length})
            </button>
          </div>

          {/* Conteúdo das Tabs */}
          {activeTab === "fila" && (
            <div className="space-y-6">
              <div className="bg-[#26242d] rounded-xl p-6">
                {/* Botão Adicionar Cliente */}
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
                  {!Array.isArray(filaAtual) || filaAtual.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      Nenhum cliente na fila no momento
                    </div>
                  ) : (
                    filaAtual.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-4 bg-[#2e2d37] rounded-lg border border-[#4b4950]/20"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-[#f2b63a] mb-1">
                              {entry.cliente.nome}
                            </h3>
                            <div className="flex items-center gap-2 text-sm">
                              <div className="text-gray-400">
                                Telefone: {entry.cliente.telefone}
                              </div>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  entry.status === "ATENDENDO"
                                    ? "bg-green-900/20 text-green-400 border border-green-500/20"
                                    : entry.status === "AGUARDANDO"
                                      ? "bg-[#4b4950]/20 text-[#f2b63a] border border-[#f2b63a]/20"
                                      : entry.status === "DESISTIU"
                                        ? "bg-yellow-900/20 text-yellow-400 border border-yellow-500/20"
                                        : entry.status === "FALTOU"
                                          ? "bg-red-900/20 text-red-400 border border-red-500/20"
                                          : "bg-[#4b4950]/20 text-gray-400"
                                }`}
                              >
                                {entry.status === "ATENDENDO"
                                  ? "Em Atendimento"
                                  : entry.status === "AGUARDANDO"
                                    ? "Aguardando"
                                    : entry.status === "DESISTIU"
                                      ? "Desistiu"
                                      : entry.status === "FALTOU"
                                        ? "Faltou"
                                        : entry.status}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {entry.servicos && entry.servicos.length > 0 ? (
                                entry.servicos.map((servico) => (
                                  <span
                                    key={servico.id}
                                    className="px-2 py-1 bg-[#4b4950]/20 text-gray-300 rounded text-xs"
                                  >
                                    {servico.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-gray-400">
                                  Nenhum serviço selecionado
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {entry.status === "AGUARDANDO" && (
                              <button
                                onClick={() =>
                                  updateStatus(entry.id, "ATENDENDO")
                                }
                                disabled={updating}
                                className="px-4 py-2 bg-[#4b4950] text-[#f2b63a] rounded-lg hover:bg-[#3d3b42] transition-colors text-sm font-medium"
                              >
                                Iniciar Atendimento
                              </button>
                            )}

                            {entry.status === "ATENDENDO" && (
                              <button
                                onClick={() =>
                                  updateStatus(entry.id, "ATENDIDO")
                                }
                                disabled={updating}
                                className="px-4 py-2 bg-green-900/20 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-900/30 transition-colors text-sm font-medium"
                              >
                                Finalizar Atendimento
                              </button>
                            )}

                            <button
                              onClick={() => updateStatus(entry.id, "DESISTIU")}
                              disabled={updating || entry.status === "ATENDIDO"}
                              className="px-4 py-2 bg-yellow-900/20 text-yellow-400 border border-yellow-500/20 rounded-lg hover:bg-yellow-900/30 transition-colors text-sm font-medium"
                            >
                              Desistiu
                            </button>

                            <button
                              onClick={() => updateStatus(entry.id, "FALTOU")}
                              disabled={updating || entry.status === "ATENDIDO"}
                              className="px-4 py-2 bg-red-900/20 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-900/30 transition-colors text-sm font-medium"
                            >
                              Faltou
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "historico" && (
            <div className="space-y-6">
              {/* Filtros */}
              <div className="bg-[#26242d] rounded-xl p-6">
                <Filters
                  filterDate={filterDate}
                  onDateChange={setFilterDate}
                  filterService={filterService}
                  onServiceChange={setFilterService}
                  onClearFilters={() => {
                    setFilterDate("");
                    setFilterService(null);
                  }}
                />
              </div>

              <div className="bg-[#26242d] rounded-xl p-6">
                {filterEntries(historico).length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    Nenhum atendimento no histórico
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filterEntries(historico).map((entry) => (
                      <div
                        key={entry.id}
                        className="p-4 bg-[#2e2d37] rounded-lg border border-[#4b4950]/20"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-[#f2b63a] mb-1">
                              {entry.cliente.nome}
                            </h3>
                            <div className="space-y-1 text-sm text-gray-400">
                              <div>Telefone: {entry.cliente.telefone}</div>
                              <div>
                                Entrada:{" "}
                                {new Date(entry.hora_entrada).toLocaleString()}
                              </div>
                              {entry.hora_saida && (
                                <div>
                                  Finalização:{" "}
                                  {new Date(entry.hora_saida).toLocaleString()}
                                </div>
                              )}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {entry.servicos && entry.servicos.length > 0 ? (
                                entry.servicos.map((servico) => (
                                  <span
                                    key={servico.id}
                                    className="px-2 py-1 bg-[#4b4950]/20 text-gray-300 rounded text-xs"
                                  >
                                    {servico.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-gray-400">
                                  Nenhum serviço selecionado
                                </span>
                              )}
                            </div>
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              entry.status === "ATENDIDO"
                                ? "bg-green-900/20 text-green-400"
                                : entry.status === "FALTOU"
                                  ? "bg-red-900/20 text-red-400"
                                  : "bg-[#4b4950]/20 text-gray-300"
                            }`}
                          >
                            {entry.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#26242d] rounded-xl p-6 text-center">
              <h3 className="text-gray-400 text-sm font-medium mb-2">
                Na Fila
              </h3>
              <div className="text-2xl font-bold text-[#f2b63a]">
                {filaAtual.length}
              </div>
            </div>
            <div className="bg-[#26242d] rounded-xl p-6 text-center">
              <h3 className="text-gray-400 text-sm font-medium mb-2">
                Atendendo
              </h3>
              <div className="text-2xl font-bold text-green-400">
                {totalAtendendo}
              </div>
            </div>
            <div className="bg-[#26242d] rounded-xl p-6 text-center">
              <h3 className="text-gray-400 text-sm font-medium mb-2">
                Atendidos
              </h3>
              <div className="text-2xl font-bold text-[#f2b63a]">
                {totalAtendidos}
              </div>
            </div>
            <div className="bg-[#26242d] rounded-xl p-6 text-center">
              <h3 className="text-gray-400 text-sm font-medium mb-2">Faltas</h3>
              <div className="text-2xl font-bold text-red-400">
                {totalFaltas}
              </div>
            </div>
          </div>

          {/* Modal de Adicionar Cliente */}
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
                <label className="block text-sm text-gray-400 mb-2">
                  Telefone
                </label>
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
                <label className="block text-sm text-gray-400 mb-2">
                  Serviços
                </label>
                <div className="space-y-3 bg-[#2e2d37] p-4 rounded-lg border border-[#4b4950]/20">
                  {SERVICOS.map((servico) => (
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
                        className="mr-3 h-4 w-4 rounded border-[#4b4950]/20 text-[#f2b63a] focus:ring-[#f2b63a] focus:ring-offset-0 bg-[#26242d]"
                      />
                      <span className="text-gray-300 text-sm">
                        {servico.name}
                      </span>
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
                onClick={handleAddClient}
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

          {/* Modal de Confirmação */}
          <Modal
            isOpen={showConfirmDialog}
            onClose={() => setShowConfirmDialog(false)}
            title="CONFIRMAR DISPONIBILIDADE"
          >
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Você está prestes a ficar disponível para atendimento. Confirma
              que está pronto para receber clientes?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 bg-[#4b4950]/20 text-gray-400 rounded-lg hover:bg-[#4b4950]/30 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={updateDisponibilidade}
                className="px-4 py-2 bg-[#4b4950] text-[#f2b63a] rounded-lg hover:bg-[#3d3b42] transition-colors text-sm font-medium"
              >
                Confirmar
              </button>
            </div>
          </Modal>

          {/* Informação de atualização */}
          <div className="flex justify-end mt-4">
            <p className="text-gray-500 text-xs">
              Atualizando automaticamente a cada 15 segundos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
