import type { JSX } from "react";

export const More = (): JSX.Element => {
  return (
    <div className="read-more-divider">
      <span className="read-more-dot">●</span>
      <span className="read-more-dot">●</span>
      <span className="read-more-dot">●</span>
    </div>
  );
};

export default More;
