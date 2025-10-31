"use client";

import { useEffect, useState } from "react";

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

export default function AdminFila() {
  const [filaAtual, setFilaAtual] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [adminId, setAdminId] = useState<number | null>(null);
  const [disponivel, setDisponivel] = useState(false);

  const fetchBarberStatus = async (barberId: number) => {
    // Verificar se estamos no navegador
    if (typeof window === "undefined") {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3000/barbers/${barberId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDisponivel(data.disponivel);
      }
    } catch (error) {
      console.error("Erro ao buscar status do barbeiro:", error);
    }
  };

  const toggleDisponibilidade = async () => {
    if (!adminId) return;

    // Verificar se estamos no navegador
    if (typeof window === "undefined") {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3000/barbers/${adminId}/disponibilidade`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDisponivel(data.disponivel);
      } else {
        console.error(
          "Erro ao atualizar disponibilidade:",
          await response.text()
        );
      }
    } catch (error) {
      console.error("Erro ao atualizar disponibilidade:", error);
    }
  };

  useEffect(() => {
    const initializePage = async () => {
      // Verificar se estamos no navegador
      if (typeof window === "undefined") {
        return;
      }

      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");

      if (!token || !user) {
        setLoading(false);
        return;
      }

      try {
        const userData = JSON.parse(user);

        // Se é admin mas não tem barberId associado, buscar o barbeiro vinculado
        if (userData.roles?.includes("admin")) {
          try {
            const response = await fetch(
              `http://localhost:3000/barbers?adminId=${userData.id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (response.ok) {
              const barbers = await response.json();
              if (barbers && barbers.length > 0) {
                const barberId = barbers[0].id;
                setAdminId(barberId);
                await fetchBarberStatus(barberId);
                await fetchFila(barberId);
                return;
              }
            }
          } catch (error) {
            console.error("Erro ao buscar barbeiro:", error);
          }
        }

        // Se tem barberId direto, usar ele
        if (userData.barberId) {
          setAdminId(userData.barberId);
          await fetchBarberStatus(userData.barberId);
          await fetchFila(userData.barberId);
          return;
        }
      } catch (error) {
        console.error("Erro ao inicializar página:", error);
      } finally {
        setLoading(false);
      }

      // Atualizar a cada 15 segundos se tiver barberId
      if (userData?.barberId) {
        const interval = setInterval(() => fetchFila(userData.barberId), 15000);
        return () => clearInterval(interval);
      }
    };

    initializePage();
  }, []);

  const fetchFila = async (barberId: number) => {
    // Verificar se estamos no navegador
    if (typeof window === "undefined") {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3000/queue/${barberId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar fila");
      }

      const data = await response.json();
      setFilaAtual(data);
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (queueId: number, status: string) => {
    if (!adminId) return;

    // Verificar se estamos no navegador
    if (typeof window === "undefined") {
      return;
    }

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

      // Atualizar a fila após mudança
      fetchFila(adminId);
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao atualizar status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-xl text-gray-400">Carregando...</div>
      </div>
    );
  }

  const user = localStorage.getItem("user");
  const userData = user ? JSON.parse(user) : null;
  const isAdmin = userData?.roles?.includes("admin");

  if (!adminId && !isAdmin) {
    return (
      <div className="text-center py-12">
        <div className="text-xl text-gray-400">
          Você não está configurado como barbeiro. Entre em contato com o
          administrador do sistema.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-yellow-500">
          Minha Fila de Atendimento
        </h2>
        <button
          onClick={toggleDisponibilidade}
          className={`px-4 py-2 rounded font-semibold transition-colors ${
            disponivel
              ? "bg-green-500 hover:bg-green-600"
              : "bg-red-500 hover:bg-red-600"
          }`}
        >
          {disponivel ? "Online" : "Offline"}
        </button>
      </div>

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

                  <div className="flex space-x-2">
                    {entry.status === "AGUARDANDO" && (
                      <button
                        onClick={() => updateStatus(entry.id, "ATENDENDO")}
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

      {/* Informação de atualização */}
      <p className="text-gray-500 text-xs text-center">
        Atualizando automaticamente a cada 15 segundos
      </p>
    </div>
  );
}
