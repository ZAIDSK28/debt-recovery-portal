import { memo, useEffect, useMemo, useState } from "react";
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
import { DateInput } from "@/components/ui/date-input";
import { useCreateInvoiceReport } from "@/hooks/useInvoices";
import { useOutlets, useRoutes } from "@/hooks/useRoutes";
import { useProducts } from "@/hooks/useProducts";
import { formatCurrency, getApiError } from "@/lib/utils";
import type { CreateInvoiceReportPayload, InvoiceCreationMode, InvoiceReport, Product } from "@/types";

const itemSchema = z.object({
  product_id: z.string().min(1, "Product is required"),
  quantity: z.string().min(1, "Quantity is required"),
});

const invoiceFormSchema = z
  .object({
    invoice_number: z.string().min(1, "Invoice number is required"),
    invoice_date: z.string().min(1, "Invoice date is required"),
    customer_name: z.string().min(1, "Customer name is required"),
    customer_address: z.string().optional(),
    customer_phone: z.string().optional(),
    gst_number: z.string().optional(),
    route_name: z.string().optional(),
    outlet_name: z.string().optional(),
    brand: z.string().optional(),
    discount_amount: z.string().optional(),
    notes: z.string().optional(),
    terms: z.string().optional(),
    creation_mode: z.enum(["bill_only", "printable_only", "printable_and_bill"]),
    items: z.array(itemSchema).min(1, "At least one product is required"),
  })
  .superRefine((values, ctx) => {
    const requiresBill =
      values.creation_mode === "bill_only" || values.creation_mode === "printable_and_bill";

    if (requiresBill) {
      if (!values.route_name?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["route_name"],
          message: "Route is required for selected mode",
        });
      }
      if (!values.outlet_name?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["outlet_name"],
          message: "Outlet is required for selected mode",
        });
      }
      if (!values.brand?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["brand"],
          message: "Brand is required for selected mode",
        });
      }
    }
  });

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
type SubmitMode = "save" | "save_and_view";

function parseMoney(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildProductLabel(product: Product): string {
  return `${product.product_code} - ${product.name} (${product.category})`;
}

const InvoiceItemRow = memo(function InvoiceItemRow({
  index,
  control,
  form,
  remove,
  disableRemove,
  products,
}: {
  index: number;
  control: Control<InvoiceFormValues>;
  form: UseFormReturn<InvoiceFormValues>;
  remove: (index: number) => void;
  disableRemove: boolean;
  products: Product[];
}) {
  const item = useWatch({
    control,
    name: `items.${index}`,
  });

  const selectedProduct = useMemo(
    () => products.find((product) => String(product.id) === (item?.product_id ?? "")),
    [products, item?.product_id]
  );

  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        value: String(product.id),
        label: buildProductLabel(product),
      })),
    [products]
  );

  const quantity = parseMoney(item?.quantity ?? "0");
  const price = parseMoney(selectedProduct?.price ?? "0");
  const taxRate = parseMoney(selectedProduct?.tax_rate ?? "0");
  const lineAmount = quantity * price;
  const lineTax = (lineAmount * taxRate) / 100;
  const lineTotal = lineAmount + lineTax;

  return (
    <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 p-4 transition-all duration-200 hover:border-sky-200 hover:bg-sky-50/30 xl:grid-cols-12">
      <div className="space-y-2 xl:col-span-5">
        <Label>Product</Label>
        <Combobox
          options={productOptions}
          value={item?.product_id ?? ""}
          placeholder="Select product"
          searchPlaceholder="Search products..."
          onChange={(value) =>
            form.setValue(`items.${index}.product_id`, value, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            })
          }
        />
        {form.formState.errors.items?.[index]?.product_id ? (
          <p className="text-sm text-red-500">{form.formState.errors.items[index]?.product_id?.message}</p>
        ) : null}
      </div>

      <div className="space-y-2 sm:max-w-[180px] xl:col-span-2 xl:max-w-none">
        <Label>Quantity</Label>
        <Input
          type="number"
          step="0.01"
          value={item?.quantity ?? ""}
          onChange={(event) =>
            form.setValue(`items.${index}.quantity`, event.target.value, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            })
          }
        />
        {form.formState.errors.items?.[index]?.quantity ? (
          <p className="text-sm text-red-500">{form.formState.errors.items[index]?.quantity?.message}</p>
        ) : null}
      </div>

      <div className="space-y-2 sm:max-w-[180px] xl:col-span-1 xl:max-w-none">
        <Label>Price</Label>
        <Input value={selectedProduct ? formatCurrency(selectedProduct.price) : "—"} readOnly />
      </div>

      <div className="space-y-2 sm:max-w-[180px] xl:col-span-1 xl:max-w-none">
        <Label>Tax %</Label>
        <Input value={selectedProduct ? `${selectedProduct.tax_rate}%` : "—"} readOnly />
      </div>

      <div className="space-y-2 sm:max-w-[180px] xl:col-span-2 xl:max-w-none">
        <Label>Estimated Total</Label>
        <Input value={selectedProduct ? formatCurrency(lineTotal) : "—"} readOnly />
      </div>

      <div className="flex items-end xl:col-span-1">
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
  const [productSearch, setProductSearch] = useState("");
  const { data: productsResponse } = useProducts({
    search: productSearch || undefined,
    page: 1,
    page_size: 50,
  });

  const products = productsResponse?.results ?? [];

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
      discount_amount: "",
      notes: "",
      terms: "",
      creation_mode: "printable_and_bill",
      items: [
        {
          product_id: "",
          quantity: "1.00",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const creationMode = useWatch({ control: form.control, name: "creation_mode" });
  const invoiceDate = useWatch({ control: form.control, name: "invoice_date" });
  const selectedRouteName = useWatch({ control: form.control, name: "route_name" });
  const selectedOutletName = useWatch({ control: form.control, name: "outlet_name" });
  const watchedItems = useWatch({ control: form.control, name: "items" }) ?? [];
  const discountAmount = useWatch({ control: form.control, name: "discount_amount" }) ?? "";

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

  const preview = useMemo(() => {
    const subtotal = watchedItems.reduce((sum, item) => {
      const product = products.find((entry) => String(entry.id) === item.product_id);
      if (!product) return sum;
      return sum + parseMoney(product.price) * parseMoney(item.quantity || "0");
    }, 0);

    const taxAmount = watchedItems.reduce((sum, item) => {
      const product = products.find((entry) => String(entry.id) === item.product_id);
      if (!product) return sum;
      const lineAmount = parseMoney(product.price) * parseMoney(item.quantity || "0");
      return sum + (lineAmount * parseMoney(product.tax_rate)) / 100;
    }, 0);

    const discount = parseMoney(discountAmount || "0");
    const total = subtotal + taxAmount - discount;

    return {
      subtotal,
      taxAmount,
      total,
    };
  }, [watchedItems, products, discountAmount]);

  useEffect(() => {
    const selectedIds = watchedItems.map((item) => item.product_id).filter(Boolean);
    const missingSelectedIds = selectedIds.some(
      (id) => !products.some((product) => String(product.id) === id)
    );

    if (missingSelectedIds && selectedIds.length > 0) {
      setProductSearch((current) => (current ? current : selectedIds.join(" ")));
    }
  }, [watchedItems, products]);

  async function submitForm(mode: SubmitMode) {
    const parsed = await form.trigger();
    if (!parsed) {
      toast.error("Please correct the highlighted fields before continuing.");
      return;
    }

    try {
      const values = form.getValues();
      const payload: CreateInvoiceReportPayload = {
        invoice_number: values.invoice_number,
        invoice_date: values.invoice_date,
        customer_name: values.customer_name,
        customer_address: values.customer_address || "",
        customer_phone: values.customer_phone || "",
        gst_number: values.gst_number || "",
        route_name: values.route_name || "",
        outlet_name: values.outlet_name || "",
        brand: values.brand || "",
        discount_amount: values.discount_amount || undefined,
        notes: values.notes || "",
        terms: values.terms || "",
        creation_mode: values.creation_mode,
        items: values.items.map((item) => ({
          product_id: Number(item.product_id),
          quantity: item.quantity,
        })),
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
            <DateInput
              value={invoiceDate ?? ""}
              onChange={(value) => form.setValue("invoice_date", value, { shouldValidate: true })}
              clearable
            />
            {form.formState.errors.invoice_date ? (
              <p className="text-sm text-red-500">{form.formState.errors.invoice_date.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Creation Mode</Label>
            <Select
              value={creationMode}
              onValueChange={(value) =>
                form.setValue("creation_mode", value as InvoiceCreationMode, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
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
                  form.setValue("route_name", value, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
                  form.setValue("outlet_name", "", {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
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
                form.setValue("outlet_name", value, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
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
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm space-y-2">
            <Label htmlFor="product-search">Search Products</Label>
            <Input
              id="product-search"
              placeholder="Search by code, name, or category..."
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
            />
          </div>

          {fields.map((field, index) => (
            <InvoiceItemRow
              key={field.id}
              index={index}
              control={form.control}
              form={form}
              remove={remove}
              disableRemove={fields.length === 1}
              products={products}
            />
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() =>
              append({
                product_id: "",
                quantity: "1.00",
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>

          {form.formState.errors.items ? (
            <p className="text-sm text-red-500">{form.formState.errors.items.message as string}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Discount & Preview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="discount_amount">Discount Amount</Label>
            <Input id="discount_amount" type="number" step="0.01" {...form.register("discount_amount")} />
            {form.formState.errors.discount_amount ? (
              <p className="text-sm text-red-500">{form.formState.errors.discount_amount.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Estimated Subtotal</Label>
            <Input value={formatCurrency(preview.subtotal)} readOnly />
          </div>

          <div className="space-y-2">
            <Label>Estimated Tax</Label>
            <Input value={formatCurrency(preview.taxAmount)} readOnly />
          </div>

          <div className="space-y-2">
            <Label>Estimated Total</Label>
            <Input value={formatCurrency(preview.total)} readOnly />
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