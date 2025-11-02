interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, children, className = "" }: CardProps) {
  return (
    <div className={`bg-barbearia-card rounded-lg p-6 ${className}`}>
      {title && (
        <h2 className="text-xl font-semibold text-barbearia-accent mb-4">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
