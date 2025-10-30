"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Barber {
  id: number;
  nome: string;
  login: string;
  ativo: boolean;
  disponivel: boolean;
  data_criacao: string;
}

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

interface Estatisticas {
  totalClientes: number;
  totalAtendimentos: number;
  totalFaltas: number;
  tempoMedio: number;
  barbeirosAtivos: number;
}

export default function PainelAdmin() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "barbeiros" | "fila"
  >("dashboard");
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [filaAtual, setFilaAtual] = useState<QueueEntry[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState<any>(null);

  // Estados para gerenciar barbeiros
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    login: "",
    senha: "",
  });
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);

  useEffect(() => {
    // Verificar se o usuário está logado como admin
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      router.push("/admin");
      return;
    }

    const userData = JSON.parse(user);
    if (userData.type !== "admin") {
      router.push("/admin");
      return;
    }

    setAdmin(userData);
    fetchData(userData.id);

    // Atualizar a cada 30 segundos
    const interval = setInterval(() => fetchData(userData.id), 30000);
    return () => clearInterval(interval);
  }, [router]);

  const fetchData = async (adminId: number) => {
    try {
      const token = localStorage.getItem("token");

      // Buscar barbeiros
      const barbersResponse = await fetch("http://localhost:3000/barbers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Buscar fila do admin (se ele também for barbeiro)
      const filaResponse = await fetch(
        `http://localhost:3000/queue/${adminId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Buscar estatísticas
      const statsResponse = await fetch(
        `http://localhost:3000/queue/${adminId}/historico`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!barbersResponse.ok) {
        throw new Error("Erro ao carregar dados");
      }

      const barbersData = await barbersResponse.json();
      const filaData = filaResponse.ok ? await filaResponse.json() : [];
      const statsData = statsResponse.ok ? await statsResponse.json() : [];

      setBarbers(barbersData);
      setFilaAtual(filaData);

      // Calcular estatísticas básicas
      const totalAtendimentos = statsData.filter(
        (entry: QueueEntry) => entry.status === "ATENDIDO"
      ).length;
      const totalFaltas = statsData.filter(
        (entry: QueueEntry) => entry.status === "FALTOU"
      ).length;

      setEstatisticas({
        totalClientes: statsData.length,
        totalAtendimentos,
        totalFaltas,
        tempoMedio: 25, // Placeholder - precisa de cálculo real
        barbeirosAtivos: barbersData.filter((b: Barber) => b.ativo).length,
      });
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/barbers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar barbeiro");
      }

      // Recarregar lista de barbeiros
      if (admin) {
        fetchData(admin.id);
      }

      setShowForm(false);
      setFormData({ nome: "", login: "", senha: "" });
      alert("Barbeiro criado com sucesso!");
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao criar barbeiro");
    }
  };

  const toggleBarberStatus = async (barberId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3000/barbers/${barberId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ativo: false }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao desativar barbeiro");
      }

      // Recarregar lista de barbeiros
      if (admin) {
        fetchData(admin.id);
      }

      alert("Barbeiro desativado com sucesso!");
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao desativar barbeiro");
    }
  };

  const updateStatus = async (queueId: number, status: string) => {
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

      // Atualizar a fila após mudança
      if (admin) {
        fetchData(admin.id);
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao atualizar status");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/admin");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-yellow-500">
                Painel Administrativo
              </h1>
              <p className="text-gray-400">Bem-vindo, {admin.nome}</p>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
              >
                Sair
              </button>
            </div>
          </div>

          {/* Tabs de Navegação */}
          <div className="flex border-b border-gray-700 mt-4">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 font-semibold ${
                activeTab === "dashboard"
                  ? "text-yellow-500 border-b-2 border-yellow-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab("barbeiros")}
              className={`px-4 py-2 font-semibold ${
                activeTab === "barbeiros"
                  ? "text-yellow-500 border-b-2 border-yellow-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              👥 Barbeiros
            </button>
            <button
              onClick={() => setActiveTab("fila")}
              className={`px-4 py-2 font-semibold ${
                activeTab === "fila"
                  ? "text-yellow-500 border-b-2 border-yellow-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              📋 Minha Fila
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* DASHBOARD */}
          {activeTab === "dashboard" && estatisticas && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Visão Geral</h2>

              {/* Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-500">
                    {estatisticas.barbeirosAtivos}
                  </div>
                  <div className="text-gray-400">Barbeiros Ativos</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {estatisticas.totalAtendimentos}
                  </div>
                  <div className="text-gray-400">Atendimentos</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-500">
                    {estatisticas.totalClientes}
                  </div>
                  <div className="text-gray-400">Clientes</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-500">
                    {estatisticas.totalFaltas}
                  </div>
                  <div className="text-gray-400">Faltas</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-500">
                    {estatisticas.tempoMedio}min
                  </div>
                  <div className="text-gray-400">Tempo Médio</div>
                </div>
              </div>

              {/* Lista Rápida de Barbeiros */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-semibold mb-4">Barbeiros</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {barbers.map((barber) => (
                    <div key={barber.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold">{barber.nome}</h4>
                          <p className="text-gray-400 text-sm">
                            {barber.login}
                          </p>
                          <div className="flex space-x-2 mt-2">
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                barber.ativo ? "bg-green-500" : "bg-red-500"
                              }`}
                            >
                              {barber.ativo ? "Ativo" : "Inativo"}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                barber.disponivel
                                  ? "bg-blue-500"
                                  : "bg-gray-500"
                              }`}
                            >
                              {barber.disponivel
                                ? "Disponível"
                                : "Indisponível"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* GERENCIAR BARBEIROS */}
          {activeTab === "barbeiros" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Gerenciar Barbeiros</h2>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded-lg"
                >
                  + Novo Barbeiro
                </button>
              </div>

              {/* Formulário de Novo Barbeiro */}
              {showForm && (
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-xl font-semibold mb-4">Novo Barbeiro</h3>
                  <form onSubmit={handleCreateBarber} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nome
                      </label>
                      <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) =>
                          setFormData({ ...formData, nome: e.target.value })
                        }
                        required
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Login
                      </label>
                      <input
                        type="text"
                        value={formData.login}
                        onChange={(e) =>
                          setFormData({ ...formData, login: e.target.value })
                        }
                        required
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Senha
                      </label>
                      <input
                        type="password"
                        value={formData.senha}
                        onChange={(e) =>
                          setFormData({ ...formData, senha: e.target.value })
                        }
                        required
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
                      >
                        Criar
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Lista de Barbeiros */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="space-y-4">
                  {barbers.map((barber) => (
                    <div
                      key={barber.id}
                      className="bg-gray-700 rounded-lg p-4 flex justify-between items-center"
                    >
                      <div>
                        <h4 className="font-semibold text-lg">{barber.nome}</h4>
                        <p className="text-gray-400">Login: {barber.login}</p>
                        <p className="text-gray-400 text-sm">
                          Cadastrado em:{" "}
                          {new Date(barber.data_criacao).toLocaleDateString(
                            "pt-BR"
                          )}
                        </p>
                        <div className="flex space-x-2 mt-2">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              barber.ativo ? "bg-green-500" : "bg-red-500"
                            }`}
                          >
                            {barber.ativo ? "Ativo" : "Inativo"}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              barber.disponivel ? "bg-blue-500" : "bg-gray-500"
                            }`}
                          >
                            {barber.disponivel ? "Disponível" : "Indisponível"}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {barber.ativo && (
                          <button
                            onClick={() => toggleBarberStatus(barber.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Desativar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* FILA DO ADMIN (como barbeiro) */}
          {activeTab === "fila" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Minha Fila de Atendimento</h2>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                {filaAtual.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    Nenhum cliente na sua fila no momento
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
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm"
                              >
                                Atender
                              </button>
                            )}

                            {entry.status === "ATENDENDO" && (
                              <button
                                onClick={() =>
                                  updateStatus(entry.id, "ATENDIDO")
                                }
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm"
                              >
                                Finalizar
                              </button>
                            )}

                            <button
                              onClick={() => updateStatus(entry.id, "FALTOU")}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm"
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
