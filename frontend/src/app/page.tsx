import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#312e38] text-[#f4ede8]">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          {}
          <div className="flex justify-center mb-6">
            <Image
              src="/images/LOGO CMYK-2_page-0001.jpg"
              alt="BOZO`S BARBEIROS"
              width={128}
              height={128}
              className="rounded-full object-cover"
            />
          </div>

          <h1 className="text-4xl font-semibold text-white mb-4">
            BOZO`S BARBEIROS
          </h1>
          <p className="text-lg text-gray-300 mb-8">Sistema de Fila Virtual</p>

          <div className="bg-[#232129] rounded-lg shadow-xl p-8 max-w-md mx-auto border border-[#3e3b47]">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Bem-vindo!
            </h2>
            <p className="text-[#999591] mb-6">
              Entre na fila e seja notificado via WhatsApp quando for sua vez.
            </p>
            <button className="bg-[#FF9000] hover:bg-[#cc7300] text-[#312e38] font-bold py-4 px-8 rounded-lg w-full transition-colors text-lg">
              Entrar na Fila
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
