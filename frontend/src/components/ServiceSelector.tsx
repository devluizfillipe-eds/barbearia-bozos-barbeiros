"use client";

interface Service {
  id: number;
  name: string;
  price: number;
  duration: number;
}

interface ServiceSelectorProps {
  onServiceSelect: (serviceId: number) => void;
  selectedService: number | null;
}

const services: Service[] = [
  { id: 1, name: "Corte", price: 35, duration: 30 },
  { id: 2, name: "Barba", price: 25, duration: 20 },
  { id: 3, name: "Sobrancelha", price: 15, duration: 15 },
  { id: 4, name: "Textura", price: 45, duration: 45 },
  { id: 5, name: "Pigmentação", price: 40, duration: 40 },
];

export default function ServiceSelector({
  onServiceSelect,
  selectedService,
}: ServiceSelectorProps) {
  return (
    <div className="w-full">
      <h3 className="text-lg mb-4 text-center font-regular">
        Selecione o serviço desejado
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => onServiceSelect(service.id)}
            className={`
              p-4 rounded-xl transition-all duration-200
              ${
                selectedService === service.id
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
