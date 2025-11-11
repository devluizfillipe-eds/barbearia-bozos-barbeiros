"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ServiceSelector from "@/components/ServiceSelector";
import { fetchAvailableBarbers, type Barber } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [step, setStep] = useState<"service" | "barber">("service");

  useEffect(() => {
    fetchBarbers();
  }, []);

  // Auto redirect se houver posição ativa armazenada e válida
  useEffect(() => {
    let cancelled = false;
    const tryRedirect = async () => {
      try {
        if (typeof window === "undefined") return;
        const storedId = localStorage.getItem("queueEntryId");
        if (!storedId) return;
        // Verifica se a entrada da fila ainda está ativa antes de redirecionar
        const resp = await fetch(
          `http://localhost:3000/queue/${storedId}/position`
        );
        if (!resp.ok) {
          // Se não existir mais, limpa
          localStorage.removeItem("queueEntryId");
          return;
        }
        const data = await resp.json();
        if (cancelled) return;
        if (["AGUARDANDO", "ATENDENDO"].includes(data.status)) {
          router.replace(`/posicao/${storedId}`);
        } else {
          // Finalizado: remover referência
          localStorage.removeItem("queueEntryId");
        }
      } catch {
        // Falha silenciosa não bloqueia a página
      }
    };
    tryRedirect();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const fetchBarbers = async () => {
    try {
      const barbersData = await fetchAvailableBarbers();
      setBarbers(barbersData);
    } catch (error) {
      console.error("Erro ao carregar barbeiros:", error);
      alert(
        "Erro ao conectar com o servidor. Verifique se o backend está rodando."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2e2d37] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#f2b63a] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <div className="text-lg sm:text-xl font-display">
            Carregando barbeiros...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2e2d37] text-white pb-24">
      {/* Logo e título */}
      <div className="w-full bg-[#26242d] py-6">
        <div className="max-w-md mx-auto text-center px-4">
          <Image
            src="/images/logo.jpg"
            alt="BOZOS BARBEIROS"
            width={96}
            height={96}
            className="mx-auto rounded-full mb-3 sm:mb-4 sm:w-[128px] sm:h-[128px]"
            priority
          />
          <p className="text-gray-300 font-regular text-sm sm:text-base">
            {step === "service"
              ? "Em que podemos te ajudar?"
              : "Escolha seu barbeiro e entre na fila"}
          </p>
        </div>
      </div>

      {/* Título Principal */}
      <div className="max-w-md mx-auto mt-6 px-4">
        <div className="relative">
          {step === "barber" && (
            <button
              onClick={() => setStep("service")}
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
          )}
          <h1 className="text-2xl sm:text-3xl text-[#f2b63a] font-[700] text-center font-['Almendra'] tracking-wider">
            {step === "service" ? "NOSSOS SERVIÇOS" : "BARBEIROS DISPONÍVEIS"}
          </h1>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <main className="max-w-md mx-auto mt-6 px-4 space-y-4">
        {step === "service" ? (
          <div className="bg-[#4b4950] rounded-2xl p-4 sm:p-6 shadow-lg">
            <ServiceSelector
              selectedServices={selectedServices}
              onServiceSelect={setSelectedServices}
            />
            <div className="mt-4 sm:mt-6 flex justify-center">
              <button
                onClick={() => selectedServices.length > 0 && setStep("barber")}
                className={`w-full sm:w-auto px-5 py-3 rounded-lg font-bold transition-all ${
                  selectedServices.length > 0
                    ? "bg-[#f2b63a] text-[#2e2d37] hover:brightness-110"
                    : "bg-gray-500 text-gray-300 cursor-not-allowed"
                }`}
              >
                Próximo
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {barbers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-[#4b4950] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-10 h-10 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 font-display">
                  Nenhum barbeiro disponível
                </h3>
                <p className="text-gray-400 text-sm sm:text-base">
                  Todos os barbeiros estão ocupados no momento
                </p>
              </div>
            ) : (
              barbers.map((barber) => {
                const barberImage = barber.foto_url
                  ? (getImageUrl(barber.foto_url) ?? "/images/logo.jpg")
                  : "/images/logo.jpg";

                return (
                  <div
                    key={barber.id}
                    className="relative bg-[#4b4950] rounded-2xl p-3 pl-5 sm:p-4 sm:pl-6 flex items-center justify-between shadow-lg"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#f2b63a] rounded-l-2xl"></div>

                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#3d3c41] rounded-full overflow-hidden flex items-center justify-center">
                        <Image
                          src={barberImage}
                          alt={`Foto de ${barber.nome}`}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div>
                        <h3 className="text-lg sm:text-xl font-regular">
                          {barber.nome}
                        </h3>
                        <p className="text-gray-300 text-xs sm:text-sm italic">
                          disponível para atendimento
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        try {
                          if (typeof window !== "undefined") {
                            localStorage.setItem(
                              "pendingServiceIds",
                              JSON.stringify(selectedServices)
                            );
                          }
                        } catch {}
                        window.location.href = `/fila/${barber.id}`;
                      }}
                      className="bg-[#f2b63a] text-[#2e2d37] font-bold py-2 px-4 rounded-lg hover:brightness-110 transition-all text-sm"
                    >
                      Entrar na fila
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* Footer/Navegação - Botão flutuante */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 transform">
        <div className="bg-[#4b4950] rounded-full px-6 py-3 shadow-lg flex items-center space-x-6">
          <button className="text-[#f2b63a] font-semibold">Sou Cliente</button>
          <button
            onClick={() => (window.location.href = "/barbeiro")}
            className="text-gray-300 hover:text-white transition-colors"
          >
            Sou Barbeiro
          </button>
          <button
            onClick={() => (window.location.href = "/admin")}
            className="text-gray-300 hover:text-white transition-colors"
          >
            Sou Admin
          </button>
        </div>
      </div>
    </div>
  );
}
