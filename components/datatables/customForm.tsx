"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "../ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDownIcon, Calendar as CalendarIcon } from "lucide-react";
import dayjs from "@/lib/dayjs";
import { formatCurrency, parseCurrency } from "@/lib/utils";
import { JumlahKgInput } from "@/components/ui/jumlah-kg-input";

// Type untuk field configuration
export type FieldConfig = {
  name: string;
  label: string;
  type: "text" | "email" | "number" | "select" | "textarea" | "checkbox" | "multiselect" | "currency" | "date" | "time" | "phone" | "formattedNumber" | "jumlahKg";
  placeholder?: string;
  description?: string; // Description untuk field (akan ditampilkan di bawah label)
  options?: { value: string; label: string }[]; // Untuk select dan multiselect
  defaultValue?: string | string[] | Date | boolean; // Support array untuk multiselect, Date untuk date, boolean untuk checkbox
  validation?: z.ZodString | z.ZodNumber | z.ZodTypeAny;
  gridCols?: 1 | 2 | 3; // Untuk layout grid (responsive: 3 cols -> mobile 1, md+ 3)
  isDisabled?: boolean | ((formValues: Record<string, any>) => boolean); // Support untuk disable field secara dinamis
  /** Custom control (e.g. select + "Tambah" shortcut). Receives field, form, fieldConfig. Renders the input only. */
  customComponent?: React.ComponentType<{
    field: any;
    form: any;
    fieldConfig: FieldConfig;
    isInvalid: boolean;
  }>;
};


// Type untuk form config
export type FormConfig<T extends Record<string, any> = Record<string, any>> = {
  title: string;
  description?: string;
  /** Optional content rendered above the header (e.g. Saldo Akhir) */
  slotAboveHeader?: React.ReactNode;
  fields: FieldConfig[];
  schema: z.ZodObject<any>;
  defaultValues: T;
  onSubmit: (data: T) => Promise<void> | void;
};

// DatePickerField component
function DatePickerField({
  field,
  fieldConfig,
  isDisabled,
  isInvalid,
}: {
  field: any;
  fieldConfig: FieldConfig;
  isDisabled: boolean;
  isInvalid: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  
  // Convert field value to Date
  const dateValue = React.useMemo(() => {
    const value = field.state.value;
    if (!value) {
      // Check if defaultValue is set
      if (fieldConfig.defaultValue instanceof Date) {
        return fieldConfig.defaultValue;
      }
      if (typeof fieldConfig.defaultValue === "string" && fieldConfig.defaultValue) {
        const date = new Date(fieldConfig.defaultValue);
        return isNaN(date.getTime()) ? undefined : date;
      }
      return undefined;
    }
    if (value instanceof Date) return value;
    if (typeof value === "string") {
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date;
    }
    return undefined;
  }, [field.state.value, fieldConfig.defaultValue]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Store as Date object, will be converted to ISO string when submitting
      field.handleChange(date);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id={field.name}
          className="w-full justify-between font-normal"
          disabled={isDisabled}
          aria-invalid={isInvalid}
          type="button"
        >
          {dateValue ? (
            dayjs(dateValue).format("DD MMM YYYY")
          ) : (
            <span className="text-muted-foreground">
              {fieldConfig.placeholder || "Pilih tanggal"}
            </span>
          )}
          <ChevronDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          captionLayout="dropdown"
          onSelect={handleDateSelect}
        />
      </PopoverContent>
    </Popover>
  );
}

// TimeInputField component dengan mask input HH:mm
function TimeInputField({
  field,
  fieldConfig,
  isDisabled,
  isInvalid,
}: {
  field: any;
  fieldConfig: FieldConfig;
  isDisabled: boolean;
  isInvalid: boolean;
}) {
  const [displayValue, setDisplayValue] = React.useState("");

  // Initialize display value from field value or defaultValue (jangan pakai || agar "" tidak diganti default)
  React.useEffect(() => {
    const value = field.state.value ?? fieldConfig.defaultValue ?? "";
    if (typeof value === "string" && value) {
      // Format existing value to HH:mm
      const formatted = formatTimeInput(value);
      setDisplayValue(formatted);
    } else {
      setDisplayValue("");
    }
  }, [field.state.value, fieldConfig.defaultValue]);

  // Format time input to HH:mm mask
  const formatTimeInput = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "");
    
    if (digits.length === 0) return "";
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) {
      // Format as HH:mm
      return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
    }
    // Limit to 4 digits (HH:mm)
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatTimeInput(inputValue);
    setDisplayValue(formatted);
    
    // Update field value (store as formatted string HH:mm)
    field.handleChange(formatted || "");
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    field.handleBlur();
    
    // Validate format on blur
    const value = displayValue.trim();
    if (value && value.length === 5) {
      const [hours, minutes] = value.split(":");
      const hoursNum = parseInt(hours, 10);
      const minutesNum = parseInt(minutes, 10);
      
      // Validate hours (00-23) and minutes (00-59)
      if (hoursNum < 0 || hoursNum > 23 || minutesNum < 0 || minutesNum > 59) {
        // Reset to empty if invalid
        setDisplayValue("");
        field.handleChange("");
      }
    }
  };

  return (
    <Input
      id={field.name}
      name={field.name}
      type="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={fieldConfig.placeholder || "HH:mm"}
      disabled={isDisabled}
      aria-invalid={isInvalid}
      autoComplete="off"
      maxLength={5}
      className="font-mono"
    />
  );
}

// PhoneInputField component dengan mask input untuk nomor telepon
function PhoneInputField({
  field,
  fieldConfig,
  isDisabled,
  isInvalid,
}: {
  field: any;
  fieldConfig: FieldConfig;
  isDisabled: boolean;
  isInvalid: boolean;
}) {
  const [displayValue, setDisplayValue] = React.useState("");

  // Initialize display value from field value or defaultValue
  React.useEffect(() => {
    const value = field.state.value || fieldConfig.defaultValue || "";
    if (typeof value === "string" && value) {
      // Format existing value (remove non-digits first, then format)
      const digits = value.replace(/\D/g, "");
      const formatted = formatPhoneInput(digits);
      setDisplayValue(formatted);
    } else {
      setDisplayValue("");
    }
  }, [field.state.value, fieldConfig.defaultValue]);

  // Format phone input dengan mask: hanya angka, format 0812-3456-7890
  const formatPhoneInput = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "");
    
    // Format: 0812-3456-7890 (maksimal 12 digit)
    if (digits.length === 0) return "";
    if (digits.length <= 4) {
      return digits;
    } else if (digits.length <= 8) {
      return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    } else if (digits.length <= 12) {
      return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
    } else {
      // Limit to 12 digits
      return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatPhoneInput(inputValue);
    setDisplayValue(formatted);
    
    // Store as digits only (without dashes) untuk konsistensi dengan backend
    const digitsOnly = inputValue.replace(/\D/g, "");
    field.handleChange(digitsOnly || "");
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    field.handleBlur();
  };

  return (
    <Input
      id={field.name}
      name={field.name}
      type="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={fieldConfig.placeholder || "0812-3456-7890"}
      disabled={isDisabled}
      aria-invalid={isInvalid}
      autoComplete="tel"
      maxLength={14} // Format: 0812-3456-7890 (12 digits + 2 dashes)
    />
  );
}

interface ReusableFormDialogProps<T extends Record<string, any>> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: FormConfig<T>;
  onSuccess?: (data: T) => void;
  onFieldChange?: (fieldName: string, value: any, form?: any) => void;
}

export function ReusableFormDialog<T extends Record<string, any>>({
  open,
  onOpenChange,
  config,
  onSuccess,
  onFieldChange,
}: ReusableFormDialogProps<T>) {
  const form = useForm({
    defaultValues: config.defaultValues as any,
    validators: {
      onSubmit: config.schema as any,
    },
    onSubmit: async ({ value }) => {
      try {
        await config.onSubmit(value);
        toast.success("Data berhasil disimpan");
        onSuccess?.(value);
        form.reset();
        onOpenChange(false);
      } catch (error: any) {
        const msg = error?.message || error?.response?.data?.error?.message || "Terjadi kesalahan saat menyimpan data";
        toast.error(msg);
      }
    },
  });

  // Reset form dengan defaultValues baru ketika dialog dibuka (hanya saat pertama kali dibuka)
  const hasResetRef = React.useRef(false);
  React.useEffect(() => {
    if (open && !hasResetRef.current) {
      // Use setTimeout to ensure form is reset after dialog is fully mounted
      const timer = setTimeout(() => {
        form.reset(config.defaultValues as any);
        hasResetRef.current = true;
      }, 100);
      return () => clearTimeout(timer);
    } else if (!open) {
      hasResetRef.current = false;
    }
  }, [open, form, config.defaultValues]);

  const renderField = (fieldConfig: FieldConfig) => {
    // If isDisabled is a function, we need to subscribe to form values
    const needsSubscription = typeof fieldConfig.isDisabled === "function";

    return (
      <form.Field
        key={fieldConfig.name}
        name={fieldConfig.name as any}
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;

          // If isDisabled is a function, subscribe to form values for reactivity
          if (needsSubscription) {
            return (
              <form.Subscribe
                selector={(state) => state.values}
                children={(formValues) => {
                  // Calculate disabled state with reactive form values
                  const getDisabledState = () => {
                    if (fieldConfig.isDisabled === undefined) return false;
                    if (typeof fieldConfig.isDisabled === "boolean") {
                      return fieldConfig.isDisabled;
                    }
                    return fieldConfig.isDisabled(formValues);
                  };

                  const isDisabled = getDisabledState();
                  return renderFieldUI(field, fieldConfig, isDisabled, isInvalid);
                }}
              />
            );
          }

          // Calculate disabled state without subscription
          const getDisabledState = () => {
            if (fieldConfig.isDisabled === undefined) return false;
            if (typeof fieldConfig.isDisabled === "boolean") {
              return fieldConfig.isDisabled;
            }
            return fieldConfig.isDisabled(form.state.values);
          };

          const isDisabled = getDisabledState();
          return renderFieldUI(field, fieldConfig, isDisabled, isInvalid);
        }}
      />
    );
  };

  const renderFieldUI = (
    field: any,
    fieldConfig: FieldConfig,
    isDisabled: boolean,
    isInvalid: boolean
  ) => {

    const CustomComponent = fieldConfig.customComponent;
  return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor={field.name}>{fieldConfig.label}</FieldLabel>
        {fieldConfig.description && (
          <p className="text-xs text-muted-foreground mt-1 mb-2">
            {fieldConfig.description}
          </p>
        )}
        {CustomComponent ? (
          <>
            <CustomComponent field={field} form={form} fieldConfig={fieldConfig} isInvalid={isInvalid} />
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </>
        ) : fieldConfig.type === "select" ? (
          <Select
            value={String(field.state.value || "")}
            onValueChange={(value) => {
              field.handleChange(value as any);
              onFieldChange?.(field.name, value, form);
            }}
            disabled={isDisabled || !fieldConfig.options || fieldConfig.options.length === 0}
          >
            <SelectTrigger id={field.name}>
              <SelectValue
                placeholder={fieldConfig.placeholder || "Pilih..."}
              />
            </SelectTrigger>
            <SelectContent>
              {fieldConfig.options && fieldConfig.options.length > 0 ? (
                fieldConfig.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="__empty__" disabled>
                  {fieldConfig.placeholder || "Pilih tipe subjek terlebih dahulu"}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        ) : fieldConfig.type === "textarea" ? (
          <textarea
            id={field.name}
            name={field.name}
            value={String(field.state.value || "")}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value as any)}
            placeholder={fieldConfig.placeholder}
            disabled={isDisabled}
            aria-invalid={isInvalid}
            autoComplete="off"
            className="min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />


        ) : fieldConfig.type === "checkbox" ? (
          <div className="flex items-center gap-2">
            <Checkbox
              id={field.name}
              checked={
                typeof field.state.value === "boolean"
                  ? field.state.value
                  : field.state.value === "true" || field.state.value === true
              }
              onCheckedChange={(checked) => {
                field.handleChange(checked as any);
                onFieldChange?.(field.name, checked, form);
              }}
              onBlur={field.handleBlur}
              disabled={isDisabled}
              aria-invalid={isInvalid}
            />
            {fieldConfig.placeholder && (
              <span className="text-sm text-muted-foreground">
                {fieldConfig.placeholder}
              </span>
            )}
          </div>
        ) : fieldConfig.type === "currency" ? (
          <div className="relative">
            <Input
              id={field.name}
              name={field.name}
              type="text"
              value={formatCurrency(field.state.value || "")}
              onBlur={field.handleBlur}
              onChange={(e) => {
                const rawValue = parseCurrency(e.target.value);
                field.handleChange(rawValue as any);
              }}
              placeholder={fieldConfig.placeholder || "0"}
              disabled={isDisabled}
              aria-invalid={isInvalid}
              autoComplete="off"
              className="pl-10"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
              Rp
            </span>
          </div>
        ) : fieldConfig.type === "formattedNumber" ? (
          <Input
            id={field.name}
            name={field.name}
            type="text"
            value={formatCurrency(field.state.value || "")}
            onBlur={field.handleBlur}
            onChange={(e) => {
              const rawValue = parseCurrency(e.target.value);
              field.handleChange(rawValue as any);
            }}
            placeholder={fieldConfig.placeholder || "0"}
            disabled={isDisabled}
            aria-invalid={isInvalid}
            autoComplete="off"
          />
        ) : fieldConfig.type === "jumlahKg" ? (
          <JumlahKgInput
            value={String(field.state.value ?? "")}
            onChange={(value) => field.handleChange(value)}
            onBlur={field.handleBlur}
            disabled={isDisabled}
            aria-invalid={isInvalid}
            satuan="kg"
            placeholder={fieldConfig.placeholder}
          />
        ) : fieldConfig.type === "multiselect" ? (
          <div className="space-y-2">
            <div className="border rounded-lg p-3 max-h-70 overflow-y-auto">
              {fieldConfig.options && fieldConfig.options.length > 0 ? (
                fieldConfig.options.map((option) => {
                  const currentValue = Array.isArray(field.state.value)
                    ? field.state.value
                    : [];
                  const isChecked = currentValue.includes(option.value);

                  return (
                    <div
                      key={option.value}
                      className="flex items-center gap-2 py-1.5 hover:bg-muted/50 rounded-md px-1"
                    >
                      <Checkbox
                        id={`${field.name}-${option.value}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          // Get fresh value from field state
                          const prevValue = Array.isArray(field.state.value)
                            ? field.state.value
                            : [];
                          const newValue = checked
                            ? [...prevValue, option.value]
                            : prevValue.filter((v: string) => v !== option.value);
                          field.handleChange(newValue as any);
                        }}
                        onBlur={field.handleBlur}
                        aria-invalid={isInvalid}
                      />
                      <label
                        htmlFor={`${field.name}-${option.value}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {option.label}
                      </label>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-muted-foreground py-2">
                  {fieldConfig.placeholder || "Tidak ada opsi tersedia"}
                </div>
              )}
            </div>
            {Array.isArray(field.state.value) && field.state.value.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {field.state.value.length} item dipilih
              </div>
            )}
          </div>
              ) : fieldConfig.type === "date" ? (
                <DatePickerField
                  field={field}
                  fieldConfig={fieldConfig}
                  isDisabled={isDisabled}
                  isInvalid={isInvalid}
                />
              ) : fieldConfig.type === "time" ? (
                <TimeInputField
                  field={field}
                  fieldConfig={fieldConfig}
                  isDisabled={isDisabled}
                  isInvalid={isInvalid}
                />
              ) : fieldConfig.type === "phone" ? (
                <PhoneInputField
                  field={field}
                  fieldConfig={fieldConfig}
                  isDisabled={isDisabled}
                  isInvalid={isInvalid}
                />
              ) : (
          <Input
            id={field.name}
            name={field.name}
            type={fieldConfig.type}
            value={String(field.state.value || "")}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value as any)}
            placeholder={fieldConfig.placeholder}
            disabled={isDisabled}
            aria-invalid={isInvalid}
            autoComplete="off"
          />
        )}
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    );
  };

  // Group fields by gridCols
  const groupedFields = React.useMemo(() => {
    const groups: { fields: FieldConfig[]; cols: 1 | 2 | 3 }[] = [];
    let currentGroup: FieldConfig[] = [];
    let currentCols: 1 | 2 | 3 = 1;

    config.fields.forEach((field) => {
      const fieldCols = (field.gridCols || 1) as 1 | 2 | 3;

      if (currentGroup.length === 0) {
        currentCols = fieldCols;
        currentGroup.push(field);
      } else if (currentCols === fieldCols) {
        const maxPerGroup = currentCols === 3 ? 3 : 2;
        if (currentGroup.length < maxPerGroup) {
          currentGroup.push(field);
        } else {
          groups.push({ fields: [...currentGroup], cols: currentCols });
          currentGroup = [field];
          currentCols = fieldCols;
        }
      } else {
        if (currentGroup.length > 0) {
          groups.push({ fields: [...currentGroup], cols: currentCols });
        }
        currentGroup = [field];
        currentCols = fieldCols;
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ fields: currentGroup, cols: currentCols });
    }

    return groups;
  }, [config.fields]);

  const gridClassName = (cols: 1 | 2 | 3) => {
    if (cols === 1) return "flex flex-col gap-4";
    if (cols === 2) return "grid grid-cols-1 sm:grid-cols-2 gap-4";
    return "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 sm:max-w-lg"
      >
        {config.slotAboveHeader && (
          <div className="shrink-0 px-6 pt-6 pb-2">
            {config.slotAboveHeader}
          </div>
        )}
        <SheetHeader className="shrink-0">
          <SheetTitle>{config.title}</SheetTitle>
          {config.description && (
            <SheetDescription>{config.description}</SheetDescription>
          )}
        </SheetHeader>
        <Separator className="shrink-0" />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <form
              id="reusable-form"
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
            >
              <FieldGroup>
                {groupedFields.map((group, groupIndex) => (
                  <div
                    key={groupIndex}
                    className={gridClassName(group.cols)}
                  >
                    {group.fields.map((field) => renderField(field))}
                  </div>
                ))}
              </FieldGroup>
            </form>
          </div>
          <SheetFooter className="shrink-0 border-t px-4 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset(config.defaultValues as any);
                onOpenChange(false);
              }}
            >
              Batal
            </Button>
            <Button
              type="submit"
              form="reusable-form"
              disabled={form.state.isSubmitting}
            >
              {form.state.isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
