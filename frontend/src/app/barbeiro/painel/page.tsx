"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Header,
  Card,
  Button,
  Modal,
  Input,
  Select,
  Tabs,
  Filters,
} from "@/components/ui";
import { EntryCard, HistoryEntryCard } from "@/components";
import { SERVICOS } from "@/constants/servicos";
import { QueueEntry } from "@/types";

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
      console.log("Token ou user não encontrado");
      router.push("/barbeiro");
      return;
    }

    try {
      const userData = JSON.parse(user);
      console.log("User data:", userData);

      if (userData.type !== "barber") {
        console.log("Usuário não é barbeiro");
        router.push("/barbeiro");
        return;
      }

      const barberData = {
        id: userData.id,
        nome: userData.nome,
        disponivel: true
      };

      console.log("Barber data:", barberData);
      setBarber(barberData);
      fetchData(userData.id);

      // Atualizar a cada 15 segundos
      const interval = setInterval(() => fetchData(userData.id), 15000);
      return () => clearInterval(interval);
    } catch (error) {
      console.error("Erro ao processar dados do usuário:", error);
      router.push("/barbeiro");
    }
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
    <div className="min-h-screen bg-barbearia-background text-white">
      <Header
        title="Painel do Barbeiro"
        subtitle={`Bem-vindo, ${barber.nome}`}
      />

      <div className="flex justify-end items-center space-x-4 px-4 py-4 bg-barbearia-header shadow-md">
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
          <Button
            onClick={toggleDisponibilidade}
            className={
              barber.disponivel
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            }
          >
            {barber.disponivel ? "Ficar Offline" : "Ficar Online"}
          </Button>
        </div>

        {/* Botão Logout */}
        <Button variant="secondary" onClick={handleLogout}>
          Sair
        </Button>
      </div>

      {/* Conteúdo */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card title="Na Fila" className="text-center">
              <div className="text-2xl font-bold text-barbearia-accent">
                {filaAtual.length}
              </div>
            </Card>
            <Card title="Atendendo" className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {totalAtendendo}
              </div>
            </Card>
            <Card title="Atendidos" className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {totalAtendidos}
              </div>
            </Card>
            <Card title="Faltas" className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {totalFaltas}
              </div>
            </Card>
          </div>{" "}
          {/* Modal de Adicionar Cliente */}
          <Modal
            isOpen={showAddClientModal}
            onClose={() => setShowAddClientModal(false)}
            title="Adicionar Cliente"
          >
            <div className="space-y-4">
              <Input
                label="Nome"
                type="text"
                value={newClient.nome}
                onChange={(e) =>
                  setNewClient({ ...newClient, nome: e.target.value })
                }
              />
              <Input
                label="Telefone"
                type="tel"
                value={newClient.telefone}
                onChange={(e) =>
                  setNewClient({ ...newClient, telefone: e.target.value })
                }
              />
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Serviços
                </label>
                <div className="space-y-2">
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
                        className="mr-2 accent-barbearia-accent"
                      />
                      <span className="text-gray-300">{servico.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowAddClientModal(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddClient}
                disabled={
                  !newClient.nome ||
                  !newClient.telefone ||
                  newClient.servicos.length === 0
                }
              >
                Adicionar
              </Button>
            </div>
          </Modal>
          {/* Modal de Confirmação */}
          <Modal
            isOpen={showConfirmDialog}
            onClose={() => setShowConfirmDialog(false)}
            title="Confirmar Disponibilidade"
          >
            <p className="text-gray-300 mb-6">
              Você está prestes a ficar disponível para atendimento. Confirma
              que está pronto para receber clientes?
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancelar
              </Button>
              <Button onClick={updateDisponibilidade}>Confirmar</Button>
            </div>
          </Modal>
          {/* Filtros */}
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
          {/* Tabs */}
          <Tabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            filaLength={filaAtual.length}
            historicoLength={historico.length}
          />
          {/* Conteúdo das Tabs */}
          {activeTab === "fila" && (
            <Card title="Fila Atual">
              {/* Botão Adicionar Cliente */}
              <Button
                onClick={() => setShowAddClientModal(true)}
                className="mb-4 flex items-center"
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
              </Button>

              {filterEntries(filaAtual).length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  Nenhum cliente na fila no momento
                </div>
              ) : (
                <div className="space-y-3">
                  {filterEntries(filaAtual).map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      onUpdateStatus={updateStatus}
                      updating={updating}
                    />
                  ))}
                </div>
              )}
            </Card>
          )}
          {activeTab === "historico" && (
            <Card title="Histórico Recente">
              {filterEntries(historico).length === 0 ? (
                <div className="text-center text-gray-300 py-8">
                  Nenhum atendimento no histórico
                </div>
              ) : (
                <div className="space-y-3">
                  {filterEntries(historico).map((entry) => (
                    <HistoryEntryCard key={entry.id} entry={entry} />
                  ))}
                </div>
              )}
            </Card>
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
