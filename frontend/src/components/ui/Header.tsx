import Image from "next/image";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

export function Header({ title, subtitle, onBack }: HeaderProps) {
  return (
    <div className="w-full bg-barbearia-header py-8 relative z-10">
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
          {onBack && (
            <button
              onClick={onBack}
              className="absolute left-0 top-1/2 -translate-y-1/2 text-barbearia-accent hover:text-barbearia-accent/80 transition-colors"
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
          <h1 className="text-2xl font-bold text-barbearia-accent">{title}</h1>
          {subtitle && <p className="text-gray-300">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
