import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComboboxProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlighted, setHighlighted] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter options based on search
  const filteredOptions = React.useMemo(
    () =>
      options.filter((opt) =>
        opt.toLowerCase().includes(search.toLowerCase())
      ),
    [options, search]
  );

  // Open dropdown on input focus
  const handleFocus = () => {
    setOpen(true);
  };

  // Handle option selection
  const handleSelect = (option: string) => {
    onChange(option);
    setSearch("");
    setOpen(false);
    setHighlighted(-1);
    if (inputRef.current) inputRef.current.blur();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && ["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      setHighlighted((prev) =>
        Math.min(prev + 1, filteredOptions.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      setHighlighted((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      if (open && highlighted >= 0 && highlighted < filteredOptions.length) {
        handleSelect(filteredOptions[highlighted]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Reset highlight when options change
  useEffect(() => {
    setHighlighted(filteredOptions.length > 0 ? 0 : -1);
  }, [search, open]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        listRef.current &&
        !listRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Show selected value in input if not searching
  const displayValue = search !== "" ? search : value;

  return (
    <div className={cn("relative w-full", className)}>
      <div className="flex items-center">
        <input
          ref={inputRef}
          type="text"
          className={cn(
            "w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-8",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          value={displayValue}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={handleFocus}
          onBlur={() => {
            setTimeout(() => setOpen(false), 100);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          onClick={() => setOpen((o) => !o)}
          disabled={disabled}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
      {open && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md"
        >
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No options found</div>
          ) : (
            filteredOptions.map((opt, idx) => (
              <div
                key={opt}
                className={cn(
                  "flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                  idx === highlighted && "bg-accent text-accent-foreground",
                  opt === value && "font-semibold"
                )}
                onMouseDown={() => handleSelect(opt)}
                onMouseEnter={() => setHighlighted(idx)}
                role="option"
                aria-selected={opt === value}
                tabIndex={-1}
              >
                {opt === value && <Check className="mr-2 h-4 w-4 text-primary" />} {opt}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}; 