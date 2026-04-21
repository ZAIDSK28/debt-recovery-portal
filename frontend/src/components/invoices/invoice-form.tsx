// src/components/invoices/invoice-form.tsx
import { memo, useEffect, useMemo } from "react";
import { useFieldArray, useForm, useWatch, type Control, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateInvoiceReport } from "@/hooks/useInvoices";
import { useOutlets, useRoutes } from "@/hooks/useRoutes";
import { getApiError } from "@/lib/utils";
import type { CreateInvoiceReportPayload, InvoiceCreationMode, InvoiceReport } from "@/types";

const itemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.string().min(1, "Quantity is required"),
  rate: z.string().min(1, "Rate is required"),
  amount: z.string().min(1, "Amount is required"),
});

const invoiceFormSchema = z
  .object({
    invoice_number: z.string().min(1, "Invoice number is required"),
    invoice_date: z.string().min(1, "Invoice date is required"),
    customer_name: z.string().min(1, "Customer name is required"),
    customer_address: z.string(),
    customer_phone: z.string(),
    gst_number: z.string(),
    route_name: z.string(),
    outlet_name: z.string(),
    brand: z.string(),
    subtotal: z.string().min(1, "Subtotal is required"),
    tax_amount: z.string(),
    discount_amount: z.string(),
    total_amount: z.string().min(1, "Total amount is required"),
    notes: z.string(),
    terms: z.string(),
    creation_mode: z.enum(["bill_only", "printable_only", "printable_and_bill"]),
    items: z.array(itemSchema).min(1, "At least one item is required"),
  })
  .superRefine((values, ctx) => {
    const requiresBill =
      values.creation_mode === "bill_only" || values.creation_mode === "printable_and_bill";

    if (requiresBill) {
      if (!values.route_name.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["route_name"],
          message: "Route is required for selected mode",
        });
      }
      if (!values.outlet_name.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["outlet_name"],
          message: "Outlet is required for selected mode",
        });
      }
      if (!values.brand.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["brand"],
          message: "Brand is required for selected mode",
        });
      }
    }

    const subtotal = Number(values.subtotal || 0);
    const taxAmount = Number(values.tax_amount || 0);
    const discountAmount = Number(values.discount_amount || 0);
    const totalAmount = Number(values.total_amount || 0);
    const expectedTotal = subtotal + taxAmount - discountAmount;

    if (Math.abs(totalAmount - expectedTotal) > 0.001) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["total_amount"],
        message: "Total amount must equal subtotal + tax - discount",
      });
    }
  });

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
type SubmitMode = "save" | "save_and_view";

function toMoneyString(value: number): string {
  return value.toFixed(2);
}

function parseMoney(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const InvoiceItemRow = memo(function InvoiceItemRow({
  index,
  control,
  form,
  remove,
  disableRemove,
}: {
  index: number;
  control: Control<InvoiceFormValues>;
  form: UseFormReturn<InvoiceFormValues>;
  remove: (index: number) => void;
  disableRemove: boolean;
}) {
  const item = useWatch({
    control,
    name: `items.${index}`,
  });

  function updateField(key: "description" | "quantity" | "rate", value: string) {
    form.setValue(`items.${index}.${key}`, value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    const current = form.getValues(`items.${index}`);
    const quantity = parseMoney(key === "quantity" ? value : current.quantity);
    const rate = parseMoney(key === "rate" ? value : current.rate);
    const amount = toMoneyString(quantity * rate);

    form.setValue(`items.${index}.amount`, amount, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  return (
    <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 p-4 transition-all duration-200 hover:border-sky-200 hover:bg-sky-50/30 lg:grid-cols-12">
      <div className="space-y-2 lg:col-span-5">
        <Label>Description</Label>
        <Input
          value={item?.description ?? ""}
          onChange={(event) => updateField("description", event.target.value)}
        />
      </div>

      <div className="space-y-2 sm:max-w-[180px] lg:col-span-2 lg:max-w-none">
        <Label>Quantity</Label>
        <Input
          type="number"
          step="0.01"
          value={item?.quantity ?? ""}
          onChange={(event) => updateField("quantity", event.target.value)}
        />
      </div>

      <div className="space-y-2 sm:max-w-[180px] lg:col-span-2 lg:max-w-none">
        <Label>Rate</Label>
        <Input
          type="number"
          step="0.01"
          value={item?.rate ?? ""}
          onChange={(event) => updateField("rate", event.target.value)}
        />
      </div>

      <div className="space-y-2 sm:max-w-[180px] lg:col-span-2 lg:max-w-none">
        <Label>Amount</Label>
        <Input value={item?.amount ?? ""} readOnly />
      </div>

      <div className="flex items-end lg:col-span-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => remove(index)}
          disabled={disableRemove}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
});

export function InvoiceForm({
  onCreated,
  onCreatedAndView,
}: {
  onCreated?: (invoice: InvoiceReport) => void;
  onCreatedAndView?: (invoice: InvoiceReport) => void;
}) {
  const createMutation = useCreateInvoiceReport();
  const { data: routes = [] } = useRoutes();

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoice_number: "",
      invoice_date: "",
      customer_name: "",
      customer_address: "",
      customer_phone: "",
      gst_number: "",
      route_name: "",
      outlet_name: "",
      brand: "",
      subtotal: "0.00",
      tax_amount: "0.00",
      discount_amount: "0.00",
      total_amount: "0.00",
      notes: "",
      terms: "",
      creation_mode: "printable_and_bill",
      items: [
        {
          description: "",
          quantity: "1.00",
          rate: "0.00",
          amount: "0.00",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = useWatch({ control: form.control, name: "items" }) ?? [];
  const taxAmount = useWatch({ control: form.control, name: "tax_amount" }) ?? "0.00";
  const discountAmount = useWatch({ control: form.control, name: "discount_amount" }) ?? "0.00";
  const creationMode = useWatch({ control: form.control, name: "creation_mode" });
  const selectedRouteName = useWatch({ control: form.control, name: "route_name" });
  const selectedOutletName = useWatch({ control: form.control, name: "outlet_name" });

  const selectedRoute = useMemo(
    () => routes.find((route) => route.name === selectedRouteName),
    [routes, selectedRouteName]
  );

  const { data: outlets = [] } = useOutlets(selectedRoute?.id ?? null);

  const routeOptions = useMemo(
    () => routes.map((route) => ({ value: route.name, label: route.name })),
    [routes]
  );

  const outletOptions = useMemo(
    () => outlets.map((outlet) => ({ value: outlet.name, label: outlet.name })),
    [outlets]
  );

  const subtotalValue = useMemo(
    () => watchedItems.reduce((sum, item) => sum + parseMoney(item?.amount ?? "0"), 0),
    [watchedItems]
  );

  const totalValue = useMemo(
    () => subtotalValue + parseMoney(taxAmount) - parseMoney(discountAmount),
    [subtotalValue, taxAmount, discountAmount]
  );

  useEffect(() => {
    form.setValue("subtotal", toMoneyString(subtotalValue), { shouldValidate: true });
    form.setValue("total_amount", toMoneyString(totalValue), { shouldValidate: true });
  }, [subtotalValue, totalValue, form]);

  async function submitForm(mode: SubmitMode) {
    const parsed = await form.trigger();
    if (!parsed) {
      toast.error("Please correct the highlighted fields before continuing.");
      return;
    }

    try {
      const values = form.getValues();
      const payload: CreateInvoiceReportPayload = {
        ...values,
      };

      const created = await createMutation.mutateAsync(payload);

      if (created.linked_bill_id) {
        toast.success(`Invoice created. Dashboard bill created: #${created.linked_bill_id}`);
      } else {
        toast.success("Invoice created successfully");
      }

      if (mode === "save_and_view") {
        toast.info("Opening printable invoice view.");
        onCreatedAndView?.(created);
        return;
      }

      onCreated?.(created);
    } catch (error) {
      const message = getApiError(error);

      if (message === "Invoice number already exists.") {
        form.setError("invoice_number", {
          type: "server",
          message,
        });
      }

      toast.error(message);
    }
  }

  const modeOptions: Array<{ value: InvoiceCreationMode; label: string }> = [
    { value: "printable_only", label: "Printable only" },
    { value: "printable_and_bill", label: "Printable + Dashboard Bill" },
    { value: "bill_only", label: "Bill only" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invoice Info</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="invoice_number">Invoice Number</Label>
            <Input id="invoice_number" {...form.register("invoice_number")} />
            {form.formState.errors.invoice_number ? (
              <p className="text-sm text-red-500">{form.formState.errors.invoice_number.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice_date">Invoice Date</Label>
            <Input id="invoice_date" type="date" {...form.register("invoice_date")} />
            {form.formState.errors.invoice_date ? (
              <p className="text-sm text-red-500">{form.formState.errors.invoice_date.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Creation Mode</Label>
            <Select
              value={creationMode}
              onValueChange={(value) =>
                form.setValue("creation_mode", value as InvoiceCreationMode, { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                {modeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.creation_mode ? (
              <p className="text-sm text-red-500">{form.formState.errors.creation_mode.message}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Party Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customer_name">Customer Name</Label>
            <Input id="customer_name" {...form.register("customer_name")} />
            {form.formState.errors.customer_name ? (
              <p className="text-sm text-red-500">{form.formState.errors.customer_name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_phone">Customer Phone</Label>
            <Input id="customer_phone" {...form.register("customer_phone")} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="customer_address">Customer Address</Label>
            <Textarea id="customer_address" {...form.register("customer_address")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gst_number">GST Number</Label>
            <Input id="gst_number" {...form.register("gst_number")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bill Mapping</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Route</Label>
            <Combobox
              options={routeOptions}
              value={selectedRouteName}
              placeholder="Select route"
              searchPlaceholder="Search routes..."
              onChange={(value) => {
                const currentRoute = form.getValues("route_name");
                if (currentRoute !== value) {
                  form.setValue("route_name", value, { shouldValidate: true });
                  form.setValue("outlet_name", "", { shouldValidate: true });
                }
              }}
            />
            {form.formState.errors.route_name ? (
              <p className="text-sm text-red-500">{form.formState.errors.route_name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Outlet</Label>
            <Combobox
              options={outletOptions}
              value={selectedOutletName}
              placeholder={selectedRoute ? "Select outlet" : "Choose route first"}
              searchPlaceholder="Search outlets..."
              disabled={!selectedRoute}
              onChange={(value) =>
                form.setValue("outlet_name", value, { shouldValidate: true })
              }
            />
            {form.formState.errors.outlet_name ? (
              <p className="text-sm text-red-500">{form.formState.errors.outlet_name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" {...form.register("brand")} />
            {form.formState.errors.brand ? (
              <p className="text-sm text-red-500">{form.formState.errors.brand.message}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <InvoiceItemRow
              key={field.id}
              index={index}
              control={form.control}
              form={form}
              remove={remove}
              disableRemove={fields.length === 1}
            />
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() =>
              append({
                description: "",
                quantity: "1.00",
                rate: "0.00",
                amount: "0.00",
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>

          {form.formState.errors.items ? (
            <p className="text-sm text-red-500">{form.formState.errors.items.message as string}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Totals</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="subtotal">Subtotal</Label>
            <Input id="subtotal" value={toMoneyString(subtotalValue)} readOnly />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax_amount">Tax Amount</Label>
            <Input id="tax_amount" type="number" step="0.01" {...form.register("tax_amount")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount_amount">Discount Amount</Label>
            <Input id="discount_amount" type="number" step="0.01" {...form.register("discount_amount")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_amount">Grand Total</Label>
            <Input id="total_amount" value={toMoneyString(totalValue)} readOnly />
            {form.formState.errors.total_amount ? (
              <p className="text-sm text-red-500">{form.formState.errors.total_amount.message}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Footer</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...form.register("notes")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms">Terms</Label>
            <Textarea id="terms" {...form.register("terms")} />
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-3 z-10 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-lg backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" className="w-full sm:w-auto" onClick={() => void submitForm("save")} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Saving..." : "Save Invoice"}
          </Button>
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => void submitForm("save_and_view")} disabled={createMutation.isPending}>
            <Printer className="mr-2 h-4 w-4" />
            {createMutation.isPending ? "Saving..." : "Save & View"}
          </Button>
        </div>
      </div>
    </div>
  );
}