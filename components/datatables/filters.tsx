"use client";

import * as React from "react";
import { Search, X, Calendar as CalendarIcon, Filter, Check, ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";

// Type untuk filter configuration
export type FilterConfig = {
  type: "search" | "select" | "dateRange" | "date" | "numberRange";
  key: string;
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[]; // Untuk select
  columnKey?: string | string[]; // Column key untuk filter (default: key). Bisa array untuk search multiple columns
};

export interface DataTableFiltersProps {
  filters: FilterConfig[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onReset?: () => void;
  onSubmit?: (values: Record<string, any>) => void; // Add onSubmit prop
}

export function DataTableFilters({
  filters,
  values,
  onChange,
  onReset,
  onSubmit,
}: DataTableFiltersProps) {
  // State untuk draft filter values (belum di-submit)
  const [draftValues, setDraftValues] = React.useState<Record<string, any>>(values);
  
  // Update draft values ketika values prop berubah (dari luar)
  React.useEffect(() => {
    setDraftValues(values);
  }, [values]);

 
  const activeFiltersCount = Object.values(values).filter(
    (v) => v !== undefined && v !== null && v !== ""
  ).length;

  const draftFiltersCount = Object.values(draftValues).filter(
    (v) => v !== undefined && v !== null && v !== ""
  ).length;

  // Handler untuk update draft values (tidak langsung submit)
  const handleDraftChange = (key: string, value: any) => {
    setDraftValues((prev) => {
      const newValues = { ...prev };
      if (value === undefined || value === null || value === "") {
        delete newValues[key];
      } else {
        newValues[key] = value;
      }
      return newValues;
    });
  };

  // Handler untuk submit filter
  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(draftValues);
    } else {
      // Fallback: langsung update jika tidak ada onSubmit
      Object.keys(draftValues).forEach((key) => {
        onChange(key, draftValues[key]);
      });
      // Clear keys yang dihapus
      Object.keys(values).forEach((key) => {
        if (!(key in draftValues)) {
          onChange(key, undefined);
        }
      });
    }
  };

  const handleReset = () => {
    setDraftValues({});
    onReset?.();
  };

  const renderFilter = (filter: FilterConfig) => {
    switch (filter.type) {
      case "search":
        return (
          <div key={filter.key}>
            <Label htmlFor={filter.key} className="sr-only">
              {filter.label}
            </Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id={filter.key}
                placeholder={
                  filter.placeholder || `Cari ${filter.label.toLowerCase()}...`
                }
                value={draftValues[filter.key] || ""}
                onChange={(e) => handleDraftChange(filter.key, e.target.value)}
                className="pl-8 max-w-sm"
              />
            </div>
          </div>
        );

      case "select":
        const selectValue = draftValues[filter.key] ?? "__all__";
        // Generate dynamic "Semua" text based on filter label
        const allLabel = filter.label 
          ? `Semua ${filter.label.toLowerCase()}`
          : "Semua";
        return (
          <div key={filter.key}>
            <Label htmlFor={filter.key} className="sr-only">
              {filter.label}
            </Label>
            <Select
              value={selectValue}
              onValueChange={(value) =>
                handleDraftChange(filter.key, value === "__all__" ? undefined : value)
              }
            >
              <SelectTrigger className="max-w-sm" id={filter.key}>
                <SelectValue placeholder={filter.placeholder || filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{allLabel}</SelectItem>
                {filter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "date":
        return (
          <div key={filter.key}>
            <Label htmlFor={filter.key} className="sr-only">
              {filter.label}
            </Label>
            <Input
              id={filter.key}
              type="date"
              value={draftValues[filter.key] || ""}
              onChange={(e) =>
                handleDraftChange(filter.key, e.target.value || undefined)
              }
              placeholder={filter.placeholder || filter.label}
            />
          </div>
        );

      case "dateRange":
        const dateRangeValue = draftValues[filter.key] || {};
        // Helper to parse date string without timezone issues
        const parseDateString = (dateString: string): Date | undefined => {
          if (!dateString) return undefined;
          // Parse YYYY-MM-DD format as local date
          const parts = dateString.split("-");
          if (parts.length !== 3) return undefined;
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
          const day = parseInt(parts[2], 10);
          const date = new Date(year, month, day);
          return isNaN(date.getTime()) ? undefined : date;
        };

        // Get today's date (normalized to start of day)
        const getToday = () => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return today;
        };

        // Helper to check if date is after today
        const isAfterToday = (date: Date): boolean => {
          const today = getToday();
          const normalizedDate = new Date(date);
          normalizedDate.setHours(0, 0, 0, 0);
          return normalizedDate > today;
        };

        const [startDate, setStartDate] = React.useState<Date | undefined>(() => {
          if (dateRangeValue?.from) {
            return parseDateString(dateRangeValue.from);
          }
          return undefined;
        });
        const [endDate, setEndDate] = React.useState<Date | undefined>(() => {
          if (dateRangeValue?.to) {
            return parseDateString(dateRangeValue.to);
          }
          return undefined;
        });
        const [startOpen, setStartOpen] = React.useState(false);
        const [endOpen, setEndOpen] = React.useState(false);

        // Sync with draftValues changes
        React.useEffect(() => {
          const currentValue = draftValues[filter.key] || {};
          const newStartDate = currentValue?.from 
            ? parseDateString(currentValue.from)
            : undefined;
          const newEndDate = currentValue?.to
            ? parseDateString(currentValue.to)
            : undefined;
          
          // Only update if different to prevent unnecessary re-renders
          if (newStartDate?.getTime() !== startDate?.getTime()) {
            setStartDate(newStartDate);
          }
          if (newEndDate?.getTime() !== endDate?.getTime()) {
            setEndDate(newEndDate);
          }
        }, [draftValues[filter.key]]);

        const formatDateDisplay = (date: Date | undefined) => {
          if (!date) return "";
          return date.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        };

        const formatDateValue = (date: Date | undefined) => {
          if (!date) return undefined;
          // Use local date to avoid timezone issues
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        return (
          <div key={filter.key} className="flex gap-2">
            {/* Start Date Picker */}
            <Popover open={startOpen} onOpenChange={setStartOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[180px] justify-between text-left font-normal"
                >
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="size-4" />
                    <span className="truncate">
                      {startDate ? formatDateDisplay(startDate) : "Dari Tanggal"}
                    </span>
                  </div>
                  <ChevronDownIcon className="size-4 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  captionLayout="dropdown"
                  disabled={(date) => isAfterToday(date)}
                  onSelect={(date) => {
                    if (!date) return;
                    
                    setStartDate(date);
                    setStartOpen(false);
                    
                    // Reset end date if it's before or equal to the new start date
                    let newEndDate: Date | undefined = undefined;
                    if (endDate) {
                      const normalizeDate = (d: Date) => {
                        const normalized = new Date(d);
                        normalized.setHours(0, 0, 0, 0);
                        return normalized;
                      };
                      const normalizedEndDate = normalizeDate(endDate);
                      const normalizedNewDate = normalizeDate(date);
                      if (normalizedEndDate > normalizedNewDate) {
                        newEndDate = endDate;
                      } else {
                        setEndDate(undefined);
                      }
                    }
                    
                    handleDraftChange(filter.key, {
                      from: formatDateValue(date),
                      to: newEndDate ? formatDateValue(newEndDate) : undefined,
                    });
                  }}
                />
              </PopoverContent>
            </Popover>

            {/* End Date Picker */}
            <Popover open={endOpen} onOpenChange={setEndOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[180px] justify-between text-left font-normal"
                >
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="size-4" />
                    <span className="truncate">
                      {endDate ? formatDateDisplay(endDate) : "Sampai Tanggal"}
                    </span>
                  </div>
                  <ChevronDownIcon className="size-4 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  defaultMonth={startDate || endDate || new Date()}
                  captionLayout="dropdown"
                  disabled={(date) => {
                    // Disable dates after today
                    if (isAfterToday(date)) {
                      return true;
                    }
                    // Disable dates before start date (if start date is set)
                    if (startDate) {
                      const normalizeDate = (d: Date) => {
                        const normalized = new Date(d);
                        normalized.setHours(0, 0, 0, 0);
                        return normalized;
                      };
                      const normalizedDate = normalizeDate(date);
                      const normalizedStartDate = normalizeDate(startDate);
                      return normalizedDate < normalizedStartDate;
                    }
                    
                    return false;
                  }}
                  onSelect={(date) => {
                    if (!date) return;
                    
                    // If selected date is before start date, don't update
                    if (startDate) {
                      const normalizeDate = (d: Date) => {
                        const normalized = new Date(d);
                        normalized.setHours(0, 0, 0, 0);
                        return normalized;
                      };
                      const normalizedDate = normalizeDate(date);
                      const normalizedStartDate = normalizeDate(startDate);
                      if (normalizedDate < normalizedStartDate) {
                        return; // Don't update if before start date
                      }
                    }
                    
                    setEndDate(date);
                    setEndOpen(false);
                    handleDraftChange(filter.key, {
                      ...draftValues[filter.key],
                      to: formatDateValue(date),
                    });
                  }}
                />
              </PopoverContent>
            </Popover>

            {/* Reset Button - Hidden by default */}
          </div>
        );

      case "numberRange":
        return (
          <Popover key={filter.key}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px]">
                <Filter className="mr-2 size-4" />
                {filter.label}
                {(draftValues[filter.key]?.min || draftValues[filter.key]?.max) && (
                  <Badge variant="secondary" className="ml-2">
                    {draftFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Min</Label>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={draftValues[filter.key]?.min || ""}
                    onChange={(e) =>
                      handleDraftChange(filter.key, {
                        ...draftValues[filter.key],
                        min: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max</Label>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={draftValues[filter.key]?.max || ""}
                    onChange={(e) =>
                      handleDraftChange(filter.key, {
                        ...draftValues[filter.key],
                        max: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleDraftChange(filter.key, undefined)}
                >
                  Reset
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex-col gap-2 flex">
      <div className="flex gap-2 flex-row">
        {filters.map((filter) => renderFilter(filter))}
      </div>

      {(activeFiltersCount > 0 || draftFiltersCount > 0) && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-9"
          >
            <X className="mr-2 size-4" />
            Reset Filter
            {activeFiltersCount > 0 && (
              <Badge className="ml-2">{activeFiltersCount}</Badge>
            )}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSubmit}
            className="h-9"
            disabled={draftFiltersCount === 0 && activeFiltersCount === 0}
          >
            <Check className="mr-2 size-4" />
            Submit Filter
           
          </Button>
        </div>
      )}
    </div>
  );
}
