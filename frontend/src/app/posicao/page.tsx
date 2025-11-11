"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface PositionData {
  id: number;
  cliente: { nome: string; telefone: string };
  barbeiro: { nome: string };
  posicao: number;
  pessoas_na_frente: number;
  status: string;
  hora_entrada: string;
}

export default function RecuperarPosicao() {
  const router = useRouter();
  const [queueId, setQueueId] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PositionData | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("queueEntryId");
        if (stored) setQueueId(stored);
        const storedPhone = localStorage.getItem("clientPhone");
        if (storedPhone && !phone) setPhone(storedPhone);
      }
    } catch {}
  }, []);

  const goToExisting = () => {
    if (queueId) router.push(`/posicao/${queueId}`);
  };

  const lookupByPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const cleanPhone = phone.replace(/\D/g, "");
      const resp = await fetch(
        `http://localhost:3000/queue/by-phone/${cleanPhone}`
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || "Não encontrado");
      setResult(data);
      // Cache queue id
      try {
        localStorage.setItem("queueEntryId", String(data.id));
        localStorage.setItem("clientPhone", cleanPhone);
      } catch {}
    } catch (err: any) {
      setError(err.message || "Erro ao buscar posição");
    } finally {
      setLoading(false);
    }
  };

  const statusText: Record<string, string> = {
    AGUARDANDO: "Aguardando",
    ATENDENDO: "Sendo atendido",
    ATENDIDO: "Atendido",
    DESISTIU: "Desistiu",
    FALTOU: "Faltou",
  };

  return (
    <div className="min-h-screen bg-[#2e2d37] text-white">
      <div className="w-full bg-[#26242d] py-8">
        <div className="max-w-md mx-auto text-center px-4">
          <Image
            src="/images/logo.jpg"
            alt="BOZOS BARBEIROS"
            width={96}
            height={96}
            className="mx-auto rounded-full mb-4"
          />
          <h1 className="text-2xl font-bold text-[#f2b63a]">
            Recuperar Posição
          </h1>
          <p className="text-gray-300 mt-1 text-sm">
            Acompanhe sua vez na fila
          </p>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 mt-8 space-y-6 pb-16">
        {queueId && (
          <div className="bg-[#4b4950] p-4 rounded-xl shadow flex flex-col gap-3">
            <div>
              <p className="text-sm text-gray-300 mb-1">
                Você possui uma fila salva.
              </p>
              <button
                onClick={goToExisting}
                className="w-full bg-[#f2b63a] text-[#2e2d37] font-bold py-3 rounded-lg hover:brightness-110 transition-all"
              >
                Ver minha posição atual
              </button>
            </div>
          </div>
        )}

        <div className="bg-[#4b4950] p-6 rounded-2xl shadow space-y-4">
          <h2 className="text-lg font-semibold text-[#f2b63a]">
            Buscar pelo telefone
          </h2>
          <form onSubmit={lookupByPhone} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Telefone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#2e2d37] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#f2b63a]"
                placeholder="(31) 99999-9999"
              />
            </div>
            {error && (
              <div className="text-red-400 text-sm text-center">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#f2b63a] disabled:opacity-60 text-[#2e2d37] font-bold py-3 rounded-lg hover:brightness-110 transition-all"
            >
              {loading ? "Buscando..." : "Buscar posição"}
            </button>
          </form>
        </div>

        {result && (
          <div className="bg-[#4b4950] p-6 rounded-2xl shadow space-y-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-[#f2b63a]">Resultado</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Cliente</p>
                <p className="text-white font-medium">{result.cliente.nome}</p>
              </div>
              <div>
                <p className="text-gray-400">Barbeiro</p>
                <p className="text-white font-medium">{result.barbeiro.nome}</p>
              </div>
              <div>
                <p className="text-gray-400">Posição</p>
                <p className="text-[#f2b63a] font-bold text-xl">
                  {result.posicao}º
                </p>
              </div>
              <div>
                <p className="text-gray-400">Na frente</p>
                <p className="text-[#f2b63a] font-semibold">
                  {result.pessoas_na_frente}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Status</p>
                <p className="font-medium">
                  {statusText[result.status] || result.status}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Entrada</p>
                <p className="text-white">
                  {new Date(result.hora_entrada).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/posicao/${result.id}`)}
              className="w-full bg-[#f2b63a] text-[#2e2d37] font-bold py-3 rounded-lg hover:brightness-110 transition-all"
            >
              Acompanhar em tempo real
            </button>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors underline"
          >
            Voltar para início
          </button>
        </div>
      </main>
    </div>
  );
}
