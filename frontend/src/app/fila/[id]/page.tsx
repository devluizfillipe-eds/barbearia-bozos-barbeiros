"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

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
      const response = await fetch("http://localhost:3000/queue/enter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          telefone,
          barbeiro_id: barberId,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao entrar na fila");
      }

      const data = await response.json();

      // Redirecionar para a página de posição
      router.push(`/posicao/${data.id}`);
    } catch (error) {
      console.error("Erro:", error);
      setMessage("Erro ao entrar na fila. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!barber) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <button
            onClick={() => router.back()}
            className="text-yellow-500 hover:text-yellow-400 mb-4"
          >
            ← Voltar
          </button>
          <h1 className="text-3xl font-bold text-yellow-500 text-center">
            Entrar na Fila
          </h1>
          <p className="text-gray-400 text-center mt-2">
            Barbeiro: {barber.nome}
          </p>
        </div>
      </div>

      {/* Formulário */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
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
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
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
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
                  placeholder="(11) 99999-9999"
                />
              </div>

              {message && (
                <div className="text-red-400 text-sm text-center">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-700 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors"
              >
                {loading ? "Entrando na fila..." : "Entrar na Fila"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
