// src/components/stock/stock-transfer-form-modal.tsx
import { useEffect } from "react";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { useCreateStockTransfer, useProducts, useWarehouses } from "@/hooks/useProducts";
import { getApiError } from "@/lib/utils";

const transferSchema = z
  .object({
    source_warehouse: z.string().min(1, "Source warehouse is required"),
    destination_warehouse: z.string().min(1, "Destination warehouse is required"),
    product: z.string().min(1, "Product is required"),
    quantity: z
      .string()
      .min(1, "Quantity is required")
      .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, {
        message: "Quantity must be greater than zero",
      }),
    note: z.string().max(255).optional(),
  })
  .refine((data) => data.source_warehouse !== data.destination_warehouse, {
    message: "Source and destination warehouses must be different",
    path: ["destination_warehouse"],
  });

type TransferFormValues = z.infer<typeof transferSchema>;

export function StockTransferFormModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createTransfer = useCreateStockTransfer();
  const { data: productsPage } = useProducts({ page_size: 200, is_active: true });
  const { data: warehouses = [] } = useWarehouses({ is_active: true });

  const products = productsPage?.results ?? [];

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      source_warehouse: "",
      destination_warehouse: "",
      product: "",
      quantity: "",
      note: "",
    },
  });

  useEffect(() => {
    if (open) form.reset();
  }, [open, form]);

  const sourceWarehouseId = useWatch({ control: form.control, name: "source_warehouse" });

  const productOptions = products.map((p) => ({
    value: String(p.id),
    label: `${p.product_code} — ${p.name}`,
  }));

  const allWarehouseOptions = warehouses.map((w) => ({
    value: String(w.id),
    label: w.name,
  }));

  // Destination list excludes whichever warehouse was picked as source
  const destinationOptions = allWarehouseOptions.filter(
    (w) => w.value !== sourceWarehouseId,
  );

  async function onSubmit(values: TransferFormValues) {
    try {
      await createTransfer.mutateAsync({
        source_warehouse: Number(values.source_warehouse),
        destination_warehouse: Number(values.destination_warehouse),
        product: Number(values.product),
        quantity: values.quantity,
        note: values.note?.trim() || undefined,
      });
      toast.success("Stock transferred successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Stock Between Warehouses</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Source Warehouse */}
            <div className="space-y-2">
              <Label>Source Warehouse</Label>
              <Combobox
                options={allWarehouseOptions}
                value={form.watch("source_warehouse")}
                placeholder="From warehouse..."
                searchPlaceholder="Search warehouse..."
                onChange={(v) => {
                  form.setValue("source_warehouse", v, {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  });
                  // Clear destination if it now matches source
                  if (form.getValues("destination_warehouse") === v) {
                    form.setValue("destination_warehouse", "", { shouldValidate: true });
                  }
                }}
              />
              {form.formState.errors.source_warehouse ? (
                <p className="text-sm text-red-500">
                  {form.formState.errors.source_warehouse.message}
                </p>
              ) : null}
            </div>

            {/* Destination Warehouse */}
            <div className="space-y-2">
              <Label>Destination Warehouse</Label>
              <Combobox
                options={destinationOptions}
                value={form.watch("destination_warehouse")}
                placeholder="To warehouse..."
                searchPlaceholder="Search warehouse..."
                onChange={(v) =>
                  form.setValue("destination_warehouse", v, {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  })
                }
              />
              {form.formState.errors.destination_warehouse ? (
                <p className="text-sm text-red-500">
                  {form.formState.errors.destination_warehouse.message}
                </p>
              ) : null}
            </div>

            {/* Product */}
            <div className="space-y-2 sm:col-span-2">
              <Label>Product</Label>
              <Combobox
                options={productOptions}
                value={form.watch("product")}
                placeholder="Search product..."
                searchPlaceholder="Type to search..."
                onChange={(v) =>
                  form.setValue("product", v, {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  })
                }
              />
              {form.formState.errors.product ? (
                <p className="text-sm text-red-500">{form.formState.errors.product.message}</p>
              ) : null}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity to Transfer</Label>
              <Input
                id="quantity"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                {...form.register("quantity")}
              />
              {form.formState.errors.quantity ? (
                <p className="text-sm text-red-500">{form.formState.errors.quantity.message}</p>
              ) : null}
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Input id="note" placeholder="Reason for transfer..." {...form.register("note")} />
              {form.formState.errors.note ? (
                <p className="text-sm text-red-500">{form.formState.errors.note.message}</p>
              ) : null}
            </div>

            <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-xs text-sky-700 sm:col-span-2">
              <span className="font-semibold">Note:</span> The system will automatically deduct
              stock from the source warehouse and credit it to the destination. Both movement
              records will be created in the audit trail.
            </div>
            </div>
          </DialogBody>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={createTransfer.isPending}>
              {createTransfer.isPending ? "Transferring..." : "Transfer Stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}