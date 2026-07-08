import type { HTMLAttributes, ReactNode } from 'react';

export default function Card({ children, className = '', ...rest }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`rounded-card bg-white shadow-[0_3px_12px_rgba(20,40,45,0.05)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
