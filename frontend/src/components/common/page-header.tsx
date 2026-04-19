import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-[26px] font-bold tracking-tight text-slate-900 sm:text-[30px]">{title}</h1>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-stretch gap-2 sm:items-center lg:w-auto">
          {actions}
        </div>
      ) : null}
    </div>
  );
}