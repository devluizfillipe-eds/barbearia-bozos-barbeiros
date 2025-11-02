interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  title,
  isOpen,
  onClose,
  children,
  className = "",
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`bg-barbearia-card p-6 rounded-2xl shadow-xl max-w-md w-full mx-4 ${className}`}
      >
        <h3 className="text-xl font-semibold mb-4 text-barbearia-accent">
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}
