type BurgerMenuProps = {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
};

const BurgerMenu = ({ isOpen, onClick, className = "" }: BurgerMenuProps) => {
  return (
    <button
      type="button"
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-pressed={isOpen}
      onClick={onClick}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/60 ${className}`}
    >
      <span className="relative flex h-5 w-6 items-center justify-center">
        <span
          className={`absolute h-0.5 w-6 rounded-full bg-current transition-transform duration-200 ${
            isOpen ? "translate-y-0 rotate-45" : "-translate-y-2"
          }`}
        />
        <span
          className={`absolute h-0.5 w-6 rounded-full bg-current transition-opacity duration-200 ${
            isOpen ? "opacity-0" : "opacity-100"
          }`}
        />
        <span
          className={`absolute h-0.5 w-6 rounded-full bg-current transition-transform duration-200 ${
            isOpen ? "translate-y-0 -rotate-45" : "translate-y-2"
          }`}
        />
      </span>
    </button>
  );
};

export default BurgerMenu;
