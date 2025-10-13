export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-yellow-500 mb-4">
            BOZO`s BARBEIROS
          </h1>
          <p className="text-xl text-gray-300 mb-8">Sistema de Fila Virtual</p>
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 max-w-md mx-auto border border-gray-700">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Bem-vindo!
            </h2>
            <p className="text-gray-400 mb-6">
              Entre na fila virtual e seja notificado no WhatsApp quando for sua
              vez.
            </p>
            <button className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-6 rounded-lg w-full transition-colors">
              Entrar na Fila
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
