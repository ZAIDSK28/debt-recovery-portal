// src/components/invoices/invoice-form.tsx

import { useEffect, useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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

  const watchedItems = form.watch("items");
  const taxAmount = form.watch("tax_amount");
  const discountAmount = form.watch("discount_amount");
  const creationMode = form.watch("creation_mode");
  const selectedRouteName = form.watch("route_name");

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

  useEffect(() => {
    const subtotal = watchedItems.reduce((sum, item) => sum + parseMoney(item.amount), 0);
    const total = subtotal + parseMoney(taxAmount) - parseMoney(discountAmount);

    form.setValue("subtotal", toMoneyString(subtotal), { shouldValidate: true });
    form.setValue("total_amount", toMoneyString(total), { shouldValidate: true });
  }, [watchedItems, taxAmount, discountAmount, form]);

  function handleItemValueChange(index: number, key: "description" | "quantity" | "rate", value: string) {
    const current = form.getValues(`items.${index}`);
    const next = {
      ...current,
      [key]: value,
    };

    const quantity = parseMoney(key === "quantity" ? value : current.quantity);
    const rate = parseMoney(key === "rate" ? value : current.rate);
    next.amount = toMoneyString(quantity * rate);

    form.setValue(`items.${index}`, next, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  async function submitForm(mode: SubmitMode) {
    const parsed = await form.trigger();
    if (!parsed) return;

    try {
      const values = form.getValues();
      const payload: CreateInvoiceReportPayload = {
        ...values,
      };

      const created = await createMutation.mutateAsync(payload);
      toast.success(
        created.linked_bill_id
          ? `Invoice created. Dashboard bill created: #${created.linked_bill_id}`
          : "Invoice created successfully"
      );

      if (mode === "save_and_view") {
        onCreatedAndView?.(created);
        return;
      }

      onCreated?.(created);
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  const modeOptions: Array<{ value: InvoiceCreationMode; label: string }> = [
    { value: "printable_only", label: "Printable only" },
    { value: "printable_and_bill", label: "Printable + Dashboard Bill" },
    { value: "bill_only", label: "Bill only" },
  ];

  return (
    <div className="space-y-6">
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
              value={form.watch("route_name")}
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
              value={form.watch("outlet_name")}
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
            <div key={field.id} className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-12">
              <div className="space-y-2 md:col-span-5">
                <Label>Description</Label>
                <Input
                  value={form.watch(`items.${index}.description`)}
                  onChange={(event) => handleItemValueChange(index, "description", event.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.watch(`items.${index}.quantity`)}
                  onChange={(event) => handleItemValueChange(index, "quantity", event.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Rate</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.watch(`items.${index}.rate`)}
                  onChange={(event) => handleItemValueChange(index, "rate", event.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Amount</Label>
                <Input value={form.watch(`items.${index}.amount`)} readOnly />
              </div>

              <div className="flex items-end md:col-span-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
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
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="subtotal">Subtotal</Label>
            <Input id="subtotal" {...form.register("subtotal")} readOnly />
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
            <Input id="total_amount" {...form.register("total_amount")} readOnly />
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
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" onClick={() => void submitForm("save")} disabled={createMutation.isPending}>
          {createMutation.isPending ? "Saving..." : "Save Invoice"}
        </Button>
        <Button type="button" variant="outline" onClick={() => void submitForm("save_and_view")} disabled={createMutation.isPending}>
          <Printer className="mr-2 h-4 w-4" />
          {createMutation.isPending ? "Saving..." : "Save & View"}
        </Button>
      </div>
    </div>
  );
}