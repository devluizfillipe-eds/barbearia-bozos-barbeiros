"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

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
  servicos?: Array<{
    id: number;
    nome?: string;
    name?: string;
    preco?: number;
  }>;
}

export default function MinhaPosicao() {
  const params = useParams();
  const router = useRouter();
  const queueId = parseInt(params.id as string);

  const [positionData, setPositionData] = useState<PositionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Guarda o id atual para facilitar retorno futuro
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("queueEntryId", String(queueId));
      }
    } catch {}

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

  // getStatusColor removido (não utilizado)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2e2d37] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#f2b63a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl">Carregando sua posição...</div>
        </div>
      </div>
    );
  }

  if (error || !positionData) {
    return (
      <div className="min-h-screen bg-[#2e2d37] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">
            {error || "Erro ao carregar dados"}
          </div>
          <button
            onClick={() => router.push("/")}
            className="bg-[#f2b63a] hover:brightness-110 text-[#2e2d37] font-bold py-2 px-6 rounded-lg transition-all"
          >
            Voltar para Home
          </button>
        </div>
      </div>
    );
  }

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
          <div className="relative px-4">
            <button
              onClick={() => router.push("/")}
              className="absolute left-0 top-1/2 -translate-y-1/2 text-[#f2b63a] hover:text-[#f2b63a]/80 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-[#f2b63a]">
              Sua Posição na Fila
            </h1>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Card Principal */}
          <div className="bg-[#4b4950] rounded-2xl p-8 shadow-lg">
            {/* Informações do Cliente */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-[#f2b63a] mb-2">
                Olá, {positionData.cliente.nome}!
              </h2>
              <p className="text-gray-300">
                Barbeiro: {positionData.barbeiro.nome}
              </p>
            </div>

            {/* Grid de Informações */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Posição */}
              <div className="bg-[#2e2d37] rounded-xl p-6 text-center">
                <div className="text-5xl font-bold text-[#f2b63a] mb-2">
                  {positionData.posicao}º
                </div>
                <p className="text-gray-300">Sua Posição</p>
              </div>

              {/* Pessoas na Frente */}
              <div className="bg-[#2e2d37] rounded-xl p-6 text-center">
                <div className="text-5xl font-bold text-[#f2b63a] mb-2">
                  {positionData.pessoas_na_frente}
                </div>
                <p className="text-gray-300">
                  {positionData.pessoas_na_frente === 0
                    ? "Você é o próximo!"
                    : positionData.pessoas_na_frente === 1
                      ? "Pessoa na frente"
                      : "Pessoas na frente"}
                </p>
              </div>

              {/* Status */}
              <div className="bg-[#2e2d37] rounded-xl p-6 text-center">
                <div
                  className={`text-2xl font-bold mb-2 ${
                    positionData.status === "AGUARDANDO"
                      ? "text-[#f2b63a]"
                      : positionData.status === "ATENDENDO"
                        ? "text-green-400"
                        : positionData.status === "ATENDIDO"
                          ? "text-blue-400"
                          : "text-red-400"
                  }`}
                >
                  {getStatusText(positionData.status)}
                </div>
                <p className="text-gray-300">Status</p>
              </div>
            </div>

            {/* Serviços selecionados */}
            <div className="bg-[#2e2d37] rounded-xl p-6 mb-6">
              <h3 className="text-[#f2b63a] font-semibold mb-4 text-center text-lg">
                Serviços Selecionados
              </h3>
              {positionData.servicos && positionData.servicos.length > 0 ? (
                <div className="flex flex-wrap gap-2 justify-center">
                  {positionData.servicos.map((s) => (
                    <span
                      key={s.id}
                      className="px-3 py-1 bg-[#4b4950] text-gray-200 rounded-full text-sm"
                    >
                      {s.nome || s.name || "Sem nome"}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center text-sm">
                  Nenhum serviço associado ao atendimento.
                </p>
              )}
            </div>

            {/* Informações Adicionais */}
            <div className="bg-[#2e2d37] rounded-xl p-6 mb-6">
              <div className="text-center">
                <p className="text-gray-300 mb-2">
                  Horário de Entrada:
                  <br />
                  <span className="text-[#f2b63a]">
                    {new Date(positionData.hora_entrada).toLocaleString(
                      "pt-BR"
                    )}
                  </span>
                </p>
              </div>
            </div>

            {/* Botão de Atualizar */}
            <button
              onClick={fetchPosition}
              disabled={loading}
              className="w-full bg-[#f2b63a] hover:brightness-110 disabled:opacity-50 text-[#2e2d37] font-bold py-3 px-6 rounded-lg transition-all"
            >
              {loading ? "Atualizando..." : "Atualizar Posição"}
            </button>

            {/* Informação de atualização automática */}
            <p className="text-gray-400 text-xs text-center mt-4">
              Atualizando automaticamente a cada 30 segundos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
