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
  const ensureArray = (data: any): QueueEntry[] => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.queue)) return data.queue;
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
    let intervalId: number | undefined;
    const init = async () => {
      const token = getToken();
      const user = getUser();
      if (!token || !user || user.type !== "barber") {
        router.push("/barbeiro");
        return;
      }
      const resp = await fetch(`http://localhost:3000/barbers/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        logout();
        router.push("/barbeiro");
        return;
      }
      const barberData = await resp.json();
      setBarber(barberData);
      await fetchData(user.id);
      intervalId && clearInterval(intervalId);
      intervalId = window.setInterval(() => fetchData(user.id), 15000);
    };
    void init();
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [router]);

  const fetchData = async (barberId: number) => {
    try {
      const token = getToken();
      if (!token) {
        logout();
        router.push("/barbeiro");
        return;
      }
      const filaResponse = await fetch(
        `http://localhost:3000/queue/${barberId}/updates`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).catch(() => {
        throw new Error(
          "Não foi possível conectar ao servidor. Verifique se o backend está rodando."
        );
      });
      const historicoResponse = await fetch(
        `http://localhost:3000/queue/${barberId}/historico`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).catch(() => {
        throw new Error(
          "Não foi possível conectar ao servidor. Verifique se o backend está rodando."
        );
      });
      if (!filaResponse.ok || !historicoResponse.ok) {
        if (filaResponse.status === 404 || historicoResponse.status === 404) {
          logout();
          router.push("/barbeiro");
          return;
        }
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
      setFilaAtual(ensureArray(filaData));
      setHistorico(ensureArray(historicoData));
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      if (
        error instanceof Error &&
        (error.message.includes("sessão expirou") ||
          error.message.includes("Token não encontrado"))
      ) {
        return;
      }
      if (
        error instanceof Error &&
        error.message.includes("conectar ao servidor")
      ) {
        alert(
          "Não foi possível conectar ao servidor. Verifique sua conexão e se o servidor está rodando."
        );
        return;
      }
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
      const token = getToken();
      if (!token) {
        logout();
        router.push("/barbeiro");
        return;
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
      if (barber) fetchData(barber.id);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao atualizar status"
      );
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
      const token = getToken();
      const response = await fetch(
        `http://localhost:3000/barbers/${barber.id}/foto`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      if (!response.ok) throw new Error("Erro ao atualizar foto");
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
      const token = getToken();
      const response = await fetch(
        `http://localhost:3000/barbers/${barber.id}/disponibilidade`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("Erro ao alterar disponibilidade");
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
      if (filterDate) {
        const entryDate = new Date(entry.hora_entrada).toLocaleDateString();
        if (entryDate !== new Date(filterDate).toLocaleDateString())
          return false;
      }
      if (filterService && entry.servicos) {
        if (!entry.servicos.some((service) => service.id === filterService))
          return false;
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
      const token = getToken();
      // Enviar para o endpoint correto que aceita serviços
      const response = await fetch("http://localhost:3000/queue/enter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          barbeiro_id: barber.id,
          nome: newClient.nome,
          telefone: newClient.telefone,
          serviceIds: newClient.servicos,
        }),
      });
      if (!response.ok) throw new Error("Erro ao adicionar cliente");
      setNewClient({ nome: "", telefone: "", servicos: [] });
      setShowAddClientModal(false);
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
          <div className="w-12 h-12 border-4 border-[#f2b63a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-xl">Carregando...</div>
        </div>
      </div>
    );
  }
  if (!barber) return null;

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
      {/* Header mobile-first */}
      <div className="w-full bg-[#26242d] py-5">
        <div className="max-w-7xl mx-auto px-4 relative">
          {/* Botão logout mobile posicionado no canto superior direito */}
          <button
            onClick={handleLogout}
            className="sm:hidden absolute top-2 right-4 px-3 py-1 bg-[#4b4950] text-[#f2b63a] rounded-md text-[11px] font-medium shadow-sm hover:bg-[#3d3b42] transition-colors"
          >
            Sair
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#4b4950] overflow-hidden">
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
                        className="w-7 h-7"
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
                  className="absolute -bottom-1 -right-1 bg-[#f2b63a] rounded-full p-1 cursor-pointer hover:brightness-110 transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5 text-[#2e2d37]"
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
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl text-[#f2b63a] font-[700] font-['Almendra'] tracking-wider whitespace-nowrap overflow-hidden text-ellipsis">
                  PAINEL DO BARBEIRO
                </h1>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">
                  Bem-vindo, {barber.nome}
                </p>
                {/* Status textual no mobile */}
                <p
                  className={`sm:hidden text-[11px] mt-1 font-semibold tracking-wider ${
                    barber.disponivel ? "text-green-400" : "text-red-400"
                  }`}
                >
                  STATUS: {barber.disponivel ? "ONLINE" : "OFFLINE"}
                </p>
              </div>
            </div>
            {/* Desktop actions */}
            <div className="hidden sm:flex items-center gap-3">
              <p
                className={`text-xs font-semibold tracking-wider ${
                  barber.disponivel ? "text-green-400" : "text-red-400"
                }`}
              >
                STATUS: {barber.disponivel ? "ONLINE" : "OFFLINE"}
              </p>
              <button
                onClick={toggleDisponibilidade}
                className="px-3 py-1.5 rounded-md text-xs font-medium border border-[#4b4950]/50 text-gray-300 hover:bg-[#4b4950]/20 transition-colors"
              >
                {barber.disponivel ? "ficar indisponivel" : "ficar disponivel"}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-[#4b4950] text-[#f2b63a] rounded-lg hover:bg-[#3d3b42] transition-colors text-xs font-medium"
              >
                Sair
              </button>
            </div>
            {/* Mobile actions (logout movido para canto superior direito) */}
            <div className="sm:hidden w-full grid grid-cols-1 gap-2 mt-1">
              <button
                onClick={toggleDisponibilidade}
                className="px-3 py-2 rounded-md text-[10px] font-medium border border-[#4b4950]/50 text-gray-300 hover:bg-[#4b4950]/20 transition-colors leading-tight"
              >
                {barber.disponivel ? "ficar indisponivel" : "ficar disponivel"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
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

          {activeTab === "fila" && (
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
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <h3 className="font-medium text-[#f2b63a]">
                                {entry.cliente.nome}
                              </h3>
                              <span
                                className={`text-xs sm:text-sm ${
                                  entry.status === "ATENDENDO"
                                    ? "text-green-400"
                                    : entry.status === "AGUARDANDO"
                                      ? "text-white"
                                      : "text-gray-400"
                                }`}
                              >
                                {entry.status === "ATENDENDO"
                                  ? "em atendimento"
                                  : entry.status === "AGUARDANDO"
                                    ? "aguardando"
                                    : entry.status.toLowerCase()}
                              </span>
                            </div>
                            <div className="text-sm text-gray-400 mt-1">
                              Telefone: {entry.cliente.telefone}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {entry.servicos && entry.servicos.length > 0 ? (
                                entry.servicos.map((servico) => (
                                  <span
                                    key={servico.id}
                                    className="px-2 py-1 bg-[#4b4950]/20 text-gray-300 rounded text-xs"
                                  >
                                    {(servico as any).name ||
                                      (servico as any).nome ||
                                      "Sem nome"}
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
                            {entry.status === "AGUARDANDO" && (
                              <button
                                onClick={() =>
                                  updateStatus(entry.id, "ATENDENDO")
                                }
                                disabled={updating}
                                className="px-4 py-2 bg-[#4b4950] text-green-400 rounded-lg hover:bg-[#3d3b42] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                                className="px-4 py-2 bg-[#4b4950] text-[#f2b63a] rounded-lg hover:bg-[#3d3b42] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Finalizar Atendimento
                              </button>
                            )}
                            <button
                              onClick={() => updateStatus(entry.id, "FALTOU")}
                              disabled={updating || entry.status === "ATENDIDO"}
                              className="px-4 py-2 bg-[#4b4950] text-red-400 rounded-lg hover:bg-[#3d3b42] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="bg-[#26242d] rounded-xl p-4 sm:p-6">
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
              <div className="bg-[#26242d] rounded-xl p-4 sm:p-6">
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
                                    {(servico as any).name ||
                                      (servico as any).nome ||
                                      "Sem nome"}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#26242d] rounded-xl p-4 sm:p-6 text-center">
              <h3 className="text-gray-400 text-sm font-medium mb-2">
                Na Fila
              </h3>
              <div className="text-2xl font-bold text-[#f2b63a]">
                {filaAtual.length}
              </div>
            </div>
            <div className="bg-[#26242d] rounded-xl p-4 sm:p-6 text-center">
              <h3 className="text-gray-400 text-sm font-medium mb-2">
                Atendendo
              </h3>
              <div className="text-2xl font-bold text-green-400">
                {totalAtendendo}
              </div>
            </div>
            <div className="bg-[#26242d] rounded-xl p-4 sm:p-6 text-center">
              <h3 className="text-gray-400 text-sm font-medium mb-2">
                Atendidos
              </h3>
              <div className="text-2xl font-bold text-[#f2b63a]">
                {totalAtendidos}
              </div>
            </div>
            <div className="bg-[#26242d] rounded-xl p-4 sm:p-6 text-center">
              <h3 className="text-gray-400 text-sm font-medium mb-2">Faltas</h3>
              <div className="text-2xl font-bold text-red-400">
                {totalFaltas}
              </div>
            </div>
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
                          const updated = e.target.checked
                            ? [...newClient.servicos, servico.id]
                            : newClient.servicos.filter(
                                (id) => id !== servico.id
                              );
                          setNewClient({ ...newClient, servicos: updated });
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
