"use client";

import { useEffect, useState } from "react";

interface Service {
  id: number;
  name: string;
  price: number;
  duration: number;
}

interface ServiceSelectorProps {
  onServiceSelect: (selectedServices: number[]) => void;
  selectedServices: number[];
}

export default function ServiceSelector({
  onServiceSelect,
  selectedServices,
}: ServiceSelectorProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("http://localhost:3000/services/active");
        if (!response.ok) {
          throw new Error("Erro ao carregar serviços");
        }
        const data = await response.json();
        setServices(
          data.map((service: any) => ({
            id: service.id,
            name: service.nome,
            price: service.preco,
            duration: service.tempo_estimado,
          }))
        );
      } catch (error) {
        console.error("Erro ao carregar serviços:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const toggleService = (serviceId: number) => {
    if (selectedServices.includes(serviceId)) {
      onServiceSelect(selectedServices.filter((id) => id !== serviceId));
    } else {
      onServiceSelect([...selectedServices, serviceId]);
    }
  };

  if (loading) {
    return (
      <div className="w-full text-center py-8">
        <div className="w-12 h-12 border-4 border-[#f2b63a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-xl">Carregando serviços...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-lg mb-4 text-center font-regular">
        Selecione os serviços desejados
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {services.map((service: Service) => (
          <button
            key={service.id}
            onClick={() => toggleService(service.id)}
            className={`
              p-4 rounded-xl transition-all duration-200
              ${
                selectedServices.includes(service.id)
                  ? "bg-[#f2b63a] text-[#2e2d37]"
                  : "bg-[#4b4950] text-white hover:bg-[#5b595f]"
              }
            `}
          >
            <div className="text-left">
              <div className="font-regular text-lg">{service.name}</div>
              <div className="flex justify-between items-center mt-2 text-sm opacity-80">
                <span>R$ {service.price.toFixed(2)}</span>
                <span>{service.duration} min</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
