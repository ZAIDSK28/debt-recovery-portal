// src/components/common/search-input.tsx
import { useRef, type InputHTMLAttributes } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchInput({
  className,
  value,
  onChange,
  placeholder = "Search...",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasValue = Boolean(value);

  function handleClear() {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;

    if (inputRef.current && nativeInputValueSetter) {
      nativeInputValueSetter.call(inputRef.current, "");
      inputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
    }

    if (onChange) {
      const syntheticEvent = {
        target: { value: "" },
        currentTarget: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }

    inputRef.current?.focus();
  }

  return (
    <div className="group relative w-full">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
        <Search
          className={cn(
            "h-3.5 w-3.5 text-[#9898B4] transition-all duration-200",
            "group-focus-within:text-[#6F72BE] group-focus-within:scale-105",
          )}
        />
      </div>

      <Input
        ref={inputRef}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          "h-8 rounded-[8px] border-[#DFE1F0] bg-white pl-8 text-[12px] leading-none",
          "transition-all duration-200",
          "placeholder:text-[12px] placeholder:text-[#9898B4]",
          "hover:border-[#6F72BE]/30 hover:bg-[#FCFCFF]",
          "focus:border-[#6F72BE] focus:ring-2 focus:ring-[#6F72BE]/20 focus:ring-offset-0",
          hasValue ? "pr-7" : "pr-2.5",
          className,
        )}
        {...props}
      />

      {hasValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          tabIndex={-1}
          className={cn(
            "absolute inset-y-0 right-0 flex items-center pr-2",
            "text-[#9898B4] transition-all duration-200",
            "hover:text-[#E04E6A] hover:scale-110",
            "focus:outline-none",
          )}
        >
          <X className="h-3 w-3 shrink-0" />
        </button>
      )}
    </div>
  );
}