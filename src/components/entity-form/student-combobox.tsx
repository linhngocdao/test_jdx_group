"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebounce } from "@/hooks/use-debounce";
import { useStudentSearch } from "@/hooks/use-students";
import { cn } from "@/lib/utils";

interface StudentComboboxProps {
  value: string;
  onChange: (studentId: string) => void;
  excludeStudentIds?: string[];
  placeholder?: string;
}

/**
 * Dropdown chọn học viên có tìm kiếm (server-side, giới hạn 50 kết quả) thay
 * vì liệt kê toàn bộ học viên vào 1 `<Select>` — với hàng nghìn học viên,
 * render hết option cùng lúc làm trình duyệt bị đơ khi mở dropdown.
 */
export function StudentCombobox({
  value,
  onChange,
  excludeStudentIds = [],
  placeholder = "Chọn học viên",
}: StudentComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);

  const { data: results, isFetching } = useStudentSearch(debouncedSearch);
  const excludeSet = new Set(excludeStudentIds);
  const options = (results ?? []).filter((s) => !excludeSet.has(s.id));
  const selected = options.find((s) => s.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? `${selected.fullName} — ${selected.email}` : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isFetching && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isFetching && <CommandEmpty>Không tìm thấy học viên.</CommandEmpty>}
            <CommandGroup>
              {options.map((student) => (
                <CommandItem
                  key={student.id}
                  value={student.id}
                  onSelect={() => {
                    onChange(student.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("size-4", value === student.id ? "opacity-100" : "opacity-0")}
                  />
                  <div className="flex flex-col">
                    <span>{student.fullName}</span>
                    <span className="text-xs text-muted-foreground">{student.email}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
