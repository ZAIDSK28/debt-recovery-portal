// src/components/ui/empty-state.tsx
import { memo } from "react";
import type { ReactNode } from "react";

export const EmptyState = memo(function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[18px] border border-dashed border-[#C8CAE0] bg-white px-6 py-12 text-center shadow-[0_2px_8px_rgba(30,30,48,0.04)]">
      {icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#EAEBF8] text-[#6F72BE]">
          {icon}
        </div>
      ) : null}
      <h3 className="text-[15px] font-semibold text-[#1E1E30]">{title}</h3>
      <p className="mt-1.5 max-w-md text-[13px] leading-6 text-[#7878A0]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
});