import type { JSX, ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export const Button = ({ children, className = "", ...props }: ButtonProps): JSX.Element => {
  return (
    <button className={`btn-primary ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
