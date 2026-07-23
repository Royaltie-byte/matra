import type { CardProps } from "./Card.types";

function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`
        w-full
        max-w-md
        rounded-2xl
        bg-white
        p-8
        shadow-xl
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export default Card;
