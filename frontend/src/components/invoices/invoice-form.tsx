// src/components/invoices/invoice-form.tsx
import { memo, useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch, type Control, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateInput } from "@/components/ui/date-input";
import { useCreateInvoiceReport, useUpdateInvoiceReport } from "@/hooks/useInvoices";
import { useOutlets, useRoutes } from "@/hooks/useRoutes";
import { useProducts } from "@/hooks/useProducts";
import { useParties } from "@/hooks/useParties";
import { formatCurrency, getApiError } from "@/lib/utils";
import type { CreateInvoiceReportPayload, InvoiceCreationMode, InvoiceReport, Product } from "@/types";

const itemSchema = z.object({
  product_id: z.string().min(1, "Product is required"),
  quantity: z.string().min(1, "Quantity is required"),
});

const invoiceFormSchema = z
  .object({
    invoice_number: z.string().optional(),
    invoice_date: z.string().min(1, "Invoice date is required"),
    party_id: z.string().optional(),
    customer_name: z.string().optional(),
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

    if (!values.party_id?.trim() && !values.customer_name?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customer_name"],
        message: "Select a party or enter a customer name",
      });
    }

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
  return `${product.product_code} - ${product.name} (${product.category_name || product.category})`;
}

// --- NEW: Product list row as a simple table row (no tile) ---
const ProductListItem = memo(function ProductListItem({
  index,
  control,
  form,
  remove,
  products,
}: {
  index: number;
  control: Control<InvoiceFormValues>;
  form: UseFormReturn<InvoiceFormValues>;
  remove: (index: number) => void;
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

  const quantity = parseMoney(item?.quantity ?? "0");
  const price = parseMoney(selectedProduct?.price ?? "0");
  const taxRate = parseMoney(selectedProduct?.tax_rate ?? "0");
  const lineAmount = quantity * price;
  const lineTax = (lineAmount * taxRate) / 100;
  const lineTotal = lineAmount + lineTax;

  return (
    <div className="grid grid-cols-1 gap-3 border-b border-gray-100 py-3 first:pt-0 last:border-0 sm:grid-cols-12 sm:gap-2">
      {/* Product Name */}
      <div className="sm:col-span-4">
        <div className="text-xs text-gray-500 sm:hidden">Product</div>
        <div className="text-sm font-medium text-gray-800">{selectedProduct?.name || "—"}</div>
        {selectedProduct?.product_code && (
          <div className="text-xs text-gray-400">{selectedProduct.product_code}</div>
        )}
      </div>

      {/* Quantity */}
      <div className="sm:col-span-2">
        <div className="text-xs text-gray-500 sm:hidden">Quantity</div>
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
          className="h-8 text-sm"
        />
        {form.formState.errors.items?.[index]?.quantity && (
          <p className="text-xs text-red-500">{form.formState.errors.items[index]?.quantity?.message}</p>
        )}
      </div>

      {/* Price (read-only) */}
      <div className="sm:col-span-2">
        <div className="text-xs text-gray-500 sm:hidden">Unit Price</div>
        <Input
          value={selectedProduct ? formatCurrency(price) : "—"}
          readOnly
          className="h-8 text-sm bg-gray-50"
        />
      </div>

      {/* Tax & Total combined */}
      <div className="sm:col-span-3">
        <div className="text-xs text-gray-500 sm:hidden">Details</div>
        <div className="text-sm text-gray-700">
          {selectedProduct ? (
            <>
              <span>Tax: {taxRate}%</span>
              <span className="mx-1">•</span>
              <span className="font-semibold">Total: {formatCurrency(lineTotal)}</span>
            </>
          ) : (
            "—"
          )}
        </div>
      </div>

      {/* Delete button */}
      <div className="sm:col-span-1 flex items-start justify-end sm:justify-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => remove(index)}
          className="h-7 w-7 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
});

export function InvoiceForm({
  initialInvoice,
  onCreated,
  onCreatedAndView,
  onUpdated,
  onLocked,
}: {
  initialInvoice?: InvoiceReport;
  onCreated?: (invoice: InvoiceReport) => void;
  onCreatedAndView?: (invoice: InvoiceReport) => void;
  onUpdated?: (invoice: InvoiceReport) => void;
  onLocked?: () => void;
}) {
  const createMutation = useCreateInvoiceReport();
  const updateMutation = useUpdateInvoiceReport(initialInvoice?.id ?? 0);
  const { data: routes = [] } = useRoutes();
  const { data: parties = [] } = useParties();
  const [productSearch, setProductSearch] = useState("");
  const { data: productsResponse } = useProducts({
    search: productSearch || undefined,
    page: 1,
    page_size: 50,
  });
  const products = productsResponse?.results ?? [];
  const isEditMode = Boolean(initialInvoice);

  // State for the single product selection dropdown
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedProductQuantity, setSelectedProductQuantity] = useState<string>("1");

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoice_number: "",
      invoice_date: "",
      party_id: "",
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
      items: [],
    },
  });

  useEffect(() => {
    if (!initialInvoice) return;

    form.reset({
      invoice_number: initialInvoice.invoice_number || "",
      invoice_date: initialInvoice.invoice_date,
      party_id: initialInvoice.party_id ? String(initialInvoice.party_id) : "",
      customer_name: initialInvoice.customer_name || "",
      customer_address: initialInvoice.customer_address || "",
      customer_phone: initialInvoice.customer_phone || "",
      gst_number: initialInvoice.gst_number || "",
      route_name: initialInvoice.route_name || "",
      outlet_name: initialInvoice.outlet_name || "",
      brand: initialInvoice.brand || "",
      discount_amount: initialInvoice.discount_amount || "",
      notes: initialInvoice.notes || "",
      terms: initialInvoice.terms || "",
      creation_mode: initialInvoice.creation_mode,
      items:
        initialInvoice.items.length > 0
          ? initialInvoice.items.map((item) => ({
              product_id: item.product_id ? String(item.product_id) : "",
              quantity: item.quantity,
            }))
          : [],
    });
  }, [initialInvoice, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const creationMode = useWatch({ control: form.control, name: "creation_mode" });
  const invoiceDate = useWatch({ control: form.control, name: "invoice_date" });
  const selectedPartyId = useWatch({ control: form.control, name: "party_id" });
  const selectedRouteName = useWatch({ control: form.control, name: "route_name" });
  const selectedOutletName = useWatch({ control: form.control, name: "outlet_name" });
  const watchedItems = useWatch({ control: form.control, name: "items" }) ?? [];
  const discountAmount = useWatch({ control: form.control, name: "discount_amount" }) ?? "";

  const selectedParty = useMemo(
    () => parties.find((party) => String(party.id) === selectedPartyId),
    [parties, selectedPartyId]
  );

  useEffect(() => {
    if (!selectedParty) return;

    form.setValue("customer_name", selectedParty.name, { shouldDirty: true, shouldValidate: true });
    form.setValue("customer_address", selectedParty.address || "", { shouldDirty: true, shouldValidate: true });
    form.setValue("customer_phone", selectedParty.phone || "", { shouldDirty: true, shouldValidate: true });
    form.setValue("gst_number", selectedParty.gst_number || "", { shouldDirty: true, shouldValidate: true });
  }, [selectedParty, form]);

  const selectedRoute = useMemo(
    () => routes.find((route) => route.name === selectedRouteName),
    [routes, selectedRouteName]
  );

  const { data: outlets = [] } = useOutlets(selectedRoute?.id ?? null);

  const partyOptions = useMemo(
    () => parties.filter((party) => party.is_active).map((party) => ({ value: String(party.id), label: party.name })),
    [parties]
  );

  const routeOptions = useMemo(
    () => routes.map((route) => ({ value: route.name, label: route.name })),
    [routes]
  );

  const outletOptions = useMemo(
    () => outlets.map((outlet) => ({ value: outlet.name, label: outlet.name })),
    [outlets]
  );

  const productOptions = useMemo(
    () => products.map((product) => ({ value: String(product.id), label: buildProductLabel(product) })),
    [products]
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

    return { subtotal, taxAmount, total };
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

  // Add product from the single dropdown
  const handleAddProduct = () => {
    if (!selectedProductId) {
      toast.error("Please select a product first.");
      return;
    }
    const quantity = selectedProductQuantity;
    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error("Please enter a valid quantity.");
      return;
    }
    // Check if product already exists in list (optional, but we allow duplicates? Usually not)
    const alreadyExists = watchedItems.some((item) => item.product_id === selectedProductId);
    if (alreadyExists) {
      toast.error("Product already added. Update quantity in the list instead.");
      return;
    }
    append({
      product_id: selectedProductId,
      quantity: quantity,
    });
    // Reset selection
    setSelectedProductId("");
    setSelectedProductQuantity("1");
  };

  async function submitForm(mode: SubmitMode) {
    const parsed = await form.trigger();
    if (!parsed) {
      toast.error("Please correct the highlighted fields before continuing.");
      return;
    }

    try {
      const values = form.getValues();
      const payload: CreateInvoiceReportPayload = {
        invoice_number: values.invoice_number || "",
        invoice_date: values.invoice_date,
        party_id: values.party_id ? Number(values.party_id) : undefined,
        customer_name: values.customer_name || "",
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

      if (isEditMode && initialInvoice) {
        const updated = await updateMutation.mutateAsync(payload);
        toast.success("Invoice updated successfully");
        onUpdated?.(updated);
        return;
      }

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

      if (message === "Invoice cannot be edited after the first payment is recorded.") {
        onLocked?.();
        return;
      }

      toast.error(message);
    }
  }

  const modeOptions: Array<{ value: InvoiceCreationMode; label: string }> = [
    { value: "printable_only", label: "Printable only" },
    { value: "printable_and_bill", label: "Printable + Dashboard Bill" },
    { value: "bill_only", label: "Bill only" },
  ];

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Invoice Info Card - unchanged except SelectTrigger height */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Info</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="invoice_number" className="text-sm font-semibold text-gray-700">Invoice Number</Label>
            <Input id="invoice_number" placeholder="Leave blank to auto-generate" {...form.register("invoice_number")} className="h-9 text-sm" />
            {form.formState.errors.invoice_number && (
              <p className="text-xs text-red-500">{form.formState.errors.invoice_number.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invoice_date" className="text-sm font-semibold text-gray-700">Invoice Date</Label>
            <DateInput
              value={invoiceDate ?? ""}
              onChange={(value) => form.setValue("invoice_date", value, { shouldValidate: true })}
              clearable
            />
            {form.formState.errors.invoice_date && (
              <p className="text-xs text-red-500">{form.formState.errors.invoice_date.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">Creation Mode</Label>
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
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                {modeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-sm">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.creation_mode && (
              <p className="text-xs text-red-500">{form.formState.errors.creation_mode.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Party Details Card - unchanged */}
      <Card>
        <CardHeader>
          <CardTitle>Party Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-sm font-semibold text-gray-700">Party</Label>
            <Combobox
              options={partyOptions}
              value={selectedPartyId}
              placeholder="Select party"
              searchPlaceholder="Search parties..."
              onChange={(value) =>
                form.setValue("party_id", value, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customer_name" className="text-sm font-semibold text-gray-700">Customer Name</Label>
            <Input id="customer_name" {...form.register("customer_name")} className="h-9 text-sm" />
            {form.formState.errors.customer_name && (
              <p className="text-xs text-red-500">{form.formState.errors.customer_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customer_phone" className="text-sm font-semibold text-gray-700">Customer Phone</Label>
            <Input id="customer_phone" {...form.register("customer_phone")} className="h-9 text-sm" />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="customer_address" className="text-sm font-semibold text-gray-700">Customer Address</Label>
            <Textarea id="customer_address" {...form.register("customer_address")} className="text-sm" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gst_number" className="text-sm font-semibold text-gray-700">GST Number</Label>
            <Input id="gst_number" {...form.register("gst_number")} className="h-9 text-sm" />
          </div>
        </CardContent>
      </Card>

      {/* Bill Mapping Card - unchanged */}
      <Card>
        <CardHeader>
          <CardTitle>Bill Mapping</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">Route</Label>
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
            {form.formState.errors.route_name && (
              <p className="text-xs text-red-500">{form.formState.errors.route_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">Outlet</Label>
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
            {form.formState.errors.outlet_name && (
              <p className="text-xs text-red-500">{form.formState.errors.outlet_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="brand" className="text-sm font-semibold text-gray-700">Brand</Label>
            <Input id="brand" {...form.register("brand")} className="h-9 text-sm" />
            {form.formState.errors.brand && (
              <p className="text-xs text-red-500">{form.formState.errors.brand.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* PRODUCTS SECTION - REDESIGNED */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Single product selection row */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
            <div className="sm:col-span-7">
              <Label className="text-sm font-semibold text-gray-700">Select Product</Label>
              <Combobox
                options={productOptions}
                value={selectedProductId}
                placeholder="Search and select product..."
                searchPlaceholder="Type product name, code or category..."
                onChange={setSelectedProductId}
              />
            </div>
            <div className="sm:col-span-3">
              <Label className="text-sm font-semibold text-gray-700">Quantity</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={selectedProductQuantity}
                onChange={(e) => setSelectedProductQuantity(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="sm:col-span-2 flex items-end">
              <Button
                type="button"
                onClick={handleAddProduct}
                className="h-9 w-full gap-1.5 text-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>
          </div>

          {/* Product list (compact rows) */}
          {fields.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-8 text-center text-sm text-gray-500">
              No products added. Select a product above and click "Add".
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3">
              {/* Header - hidden on mobile, visible on sm+ */}
              <div className="hidden grid-cols-12 gap-2 border-b border-gray-200 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:grid">
                <div className="col-span-4">Product</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-2">Unit Price</div>
                <div className="col-span-3">Tax / Total</div>
                <div className="col-span-1"></div>
              </div>
              {fields.map((field, index) => (
                <ProductListItem
                  key={field.id}
                  index={index}
                  control={form.control}
                  form={form}
                  remove={remove}
                  products={products}
                />
              ))}
            </div>
          )}

          {form.formState.errors.items && (
            <p className="text-xs text-red-500">{form.formState.errors.items.message as string}</p>
          )}
        </CardContent>
      </Card>

      {/* Discount & Preview Card - unchanged */}
      <Card>
        <CardHeader>
          <CardTitle>Discount & Preview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="discount_amount" className="text-sm font-semibold text-gray-700">Discount Amount</Label>
            <Input id="discount_amount" type="number" step="0.01" {...form.register("discount_amount")} className="h-9 text-sm" />
            {form.formState.errors.discount_amount && (
              <p className="text-xs text-red-500">{form.formState.errors.discount_amount.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">Subtotal</Label>
            <Input value={formatCurrency(preview.subtotal)} readOnly className="h-9 text-sm bg-gray-50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">Tax</Label>
            <Input value={formatCurrency(preview.taxAmount)} readOnly className="h-9 text-sm bg-gray-50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">Total</Label>
            <Input value={formatCurrency(preview.total)} readOnly className="h-9 text-sm bg-gray-50 font-semibold text-gray-900" />
          </div>
        </CardContent>
      </Card>

      {/* Footer Card - unchanged */}
      <Card>
        <CardHeader>
          <CardTitle>Footer</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">Notes</Label>
            <Textarea id="notes" {...form.register("notes")} className="text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="terms" className="text-sm font-semibold text-gray-700">Terms</Label>
            <Textarea id="terms" {...form.register("terms")} className="text-sm" />
          </div>
        </CardContent>
      </Card>

      {/* Actions bar */}
      <div className="sticky bottom-3 z-10 rounded-2xl border border-gray-200 bg-white/90 p-3 shadow-lg backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" className="h-9 w-full sm:w-auto gap-1.5 text-sm" onClick={() => void submitForm("save")} disabled={isPending}>
            {isPending ? "Saving..." : isEditMode ? "Save Changes" : "Save Invoice"}
          </Button>
          {!isEditMode && (
            <Button type="button" variant="outline" className="h-9 w-full sm:w-auto gap-1.5 text-sm" onClick={() => void submitForm("save_and_view")} disabled={isPending}>
              <Printer className="h-3.5 w-3.5" />
              {isPending ? "Saving..." : "Save & View"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}