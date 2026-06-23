import type { JSX, ReactNode } from "react";

interface CalloutProps {
  type?: "info" | "warning" | "success" | "tip";
  children: ReactNode;
}

export const Callout = ({ type = "info", children }: CalloutProps): JSX.Element => {
  return (
    <div className={`callout callout-${type}`}>
      <div className="callout-type-tag">{type.toUpperCase()}</div>
      <div className="callout-content">{children}</div>
    </div>
  );
};

export default Callout;
