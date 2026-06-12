// src/components/common/search-input.tsx
import type { InputHTMLAttributes } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[#9898B4]" />
      <Input className="pl-8" {...props} />
    </div>
  );
}