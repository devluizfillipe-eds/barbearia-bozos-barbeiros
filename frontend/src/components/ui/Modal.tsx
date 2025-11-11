interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Modal(props: ModalProps) {
  const { title, isOpen, children, className = "" } = props;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`bg-[#26242d] p-6 rounded-xl border border-[#4b4950]/20 shadow-2xl max-w-md w-full mx-4 ${className}`}
      >
        <h3 className="text-xl font-[700] text-[#f2b63a] font-['Almendra'] mb-6">
          {title}
        </h3>
        <button
          type="button"
          onClick={props.onClose}
          className="absolute top-4 right-4 text-[#f2b63a] hover:brightness-110"
          aria-label="Fechar modal"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
