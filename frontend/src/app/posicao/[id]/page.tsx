"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface PositionData {
  id: number;
  cliente: {
    id: number;
    nome: string;
    telefone: string;
    data_criacao: string;
  };
  barbeiro: {
    id: number;
    nome: string;
  };
  posicao: number;
  pessoas_na_frente: number;
  status: string;
  hora_entrada: string;
}

export default function MinhaPosicao() {
  const params = useParams();
  const router = useRouter();
  const queueId = parseInt(params.id as string);

  const [positionData, setPositionData] = useState<PositionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPosition();
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchPosition, 30000);
    return () => clearInterval(interval);
  }, [queueId]);

  const fetchPosition = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/queue/${queueId}/position`
      );

      if (!response.ok) {
        throw new Error("Erro ao carregar posição");
      }

      const data = await response.json();
      setPositionData(data);
      setError("");
    } catch (error) {
      console.error("Erro:", error);
      setError("Erro ao carregar sua posição na fila");
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      AGUARDANDO: "Aguardando",
      ATENDENDO: "Sendo atendido",
      ATENDIDO: "Atendido",
      DESISTIU: "Desistiu",
      FALTOU: "Faltou",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      AGUARDANDO: "text-yellow-500",
      ATENDENDO: "text-green-500",
      ATENDIDO: "text-blue-500",
      DESISTIU: "text-red-500",
      FALTOU: "text-red-500",
    };
    return colorMap[status] || "text-gray-400";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Carregando sua posição...</div>
      </div>
    );
  }

  if (error || !positionData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">
            {error || "Erro ao carregar dados"}
          </div>
          <button
            onClick={() => router.push("/")}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-6 rounded-lg"
          >
            Voltar para Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <button
            onClick={() => router.push("/")}
            className="text-yellow-500 hover:text-yellow-400 mb-4"
          >
            ← Voltar para Home
          </button>
          <h1 className="text-3xl font-bold text-yellow-500 text-center">
            Minha Posição
          </h1>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            {/* Informações do Cliente */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-white mb-2">
                Olá, {positionData.cliente.nome}!
              </h2>
              <p className="text-gray-400">
                Barbeiro: {positionData.barbeiro.nome}
              </p>
            </div>

            {/* Posição na Fila */}
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-yellow-500 mb-2">
                {positionData.posicao}º
              </div>
              <p className="text-gray-400">
                {positionData.pessoas_na_frente === 0
                  ? "Você é o próximo!"
                  : `${positionData.pessoas_na_frente} pessoa(s) na sua frente`}
              </p>
            </div>

            {/* Status */}
            <div className="text-center mb-6">
              <div
                className={`text-lg font-semibold ${getStatusColor(positionData.status)}`}
              >
                Status: {getStatusText(positionData.status)}
              </div>
              <p className="text-gray-400 text-sm mt-1">
                Entrada:{" "}
                {new Date(positionData.hora_entrada).toLocaleString("pt-BR")}
              </p>
            </div>

            {/* Botão de Atualizar */}
            <button
              onClick={fetchPosition}
              disabled={loading}
              className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? "Atualizando..." : "Atualizar Posição"}
            </button>

            {/* Informação de atualização automática */}
            <p className="text-gray-500 text-xs text-center mt-4">
              Atualizando automaticamente a cada 30 segundos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
