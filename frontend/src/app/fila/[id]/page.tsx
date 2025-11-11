"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

interface Barber {
  id: number;
  nome: string;
}

export default function EntrarFila() {
  const params = useParams();
  const router = useRouter();
  const barberId = parseInt(params.id as string);

  const [barber, setBarber] = useState<Barber | null>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchBarber();
  }, [barberId]);

  const fetchBarber = async () => {
    try {
      const response = await fetch(`http://localhost:3000/barbers/${barberId}`);
      const data = await response.json();
      setBarber(data);
    } catch (error) {
      console.error("Erro ao carregar barbeiro:", error);
      setMessage("Erro ao carregar dados do barbeiro");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Recupera serviços selecionados na Home (se houver)
      let serviceIds: number[] | undefined = undefined;
      try {
        if (typeof window !== "undefined") {
          const raw = localStorage.getItem("pendingServiceIds");
          const parsed = raw ? (JSON.parse(raw) as number[]) : [];
          if (Array.isArray(parsed) && parsed.length > 0) {
            serviceIds = parsed;
          }
        }
      } catch {}

      const response = await fetch("http://localhost:3000/queue/enter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          telefone,
          barbeiro_id: barberId,
          ...(serviceIds ? { serviceIds } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao entrar na fila");
      }

      // Persistir para facilitar retorno do cliente
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("queueEntryId", String(data.id));
          localStorage.setItem("clientPhone", telefone);
          localStorage.removeItem("pendingServiceIds");
        }
      } catch {}

      // Redirecionar para a página de posição
      router.push(`/posicao/${data.id}`);
    } catch (error: any) {
      console.error("Erro:", error);
      setMessage(error.message || "Erro ao entrar na fila. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!barber) {
    return (
      <div className="min-h-screen bg-[#2e2d37] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#f2b63a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl">Carregando...</div>
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
              onClick={() => router.back()}
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
            <p className="text-gray-300 font-regular">
              Barbeiro: {barber.nome}
            </p>
          </div>
        </div>
      </div>

      {/* Título Principal */}
      <div className="max-w-3xl mx-auto mt-8 px-4">
        <h1 className="text-3xl text-[#f2b63a] font-[700] text-center font-['Almendra'] tracking-wider">
          ENTRAR NA FILA
        </h1>
      </div>

      {/* Formulário */}
      <main className="max-w-3xl mx-auto mt-8 px-4 space-y-4">
        <div className="bg-[#4b4950] rounded-2xl p-6 shadow-lg max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Seu Nome
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#2e2d37] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#f2b63a]"
                placeholder="Digite seu nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Telefone
              </label>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#2e2d37] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#f2b63a]"
                placeholder="(31) 99999-9999"
              />
            </div>

            {message && (
              <div className="text-red-400 text-sm text-center">{message}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#f2b63a] hover:brightness-110 disabled:opacity-70 text-[#2e2d37] font-bold py-3 px-6 rounded-lg transition-all"
            >
              {loading ? "Entrando na fila..." : "Entrar na Fila"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
