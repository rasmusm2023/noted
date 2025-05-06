import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline";
}

export const Button = ({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) => {
  const baseStyles = "px-4 py-2 rounded-md font-medium transition-colors";
  const variantStyles = {
    primary: "bg-pri-blue-500 text-neu-100 hover:bg-pri-blue-600",
    secondary: "bg-neu-300 text-neu-100 hover:bg-neu-400",
    outline:
      "border-2 border-pri-blue-500 text-pri-blue-500 hover:bg-pri-blue-100",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
