// src/components/stock/stock-movement-form-modal.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateStockMovement, useProducts, useWarehouses } from "@/hooks/useProducts";
import { getApiError } from "@/lib/utils";

const movementSchema = z.object({
  product: z.string().min(1, "Product is required"),
  warehouse: z.string().min(1, "Warehouse is required"),
  movement_type: z.enum(["in", "out", "adjustment"], {
    required_error: "Movement type is required",
  }),
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, {
      message: "Quantity must be greater than zero",
    }),
  note: z.string().max(255).optional(),
});

type MovementFormValues = z.infer<typeof movementSchema>;

const MOVEMENT_LABELS: Record<string, string> = {
  in: "IN — add to stock",
  out: "OUT — remove from stock",
  adjustment: "ADJUSTMENT — set absolute quantity",
};

export function StockMovementFormModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createMovement = useCreateStockMovement();
  const { data: productsPage } = useProducts({ page_size: 200, is_active: true });
  const { data: warehouses = [] } = useWarehouses({ is_active: true });

  const products = productsPage?.results ?? [];

  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      product: "",
      warehouse: "",
      movement_type: "in",
      quantity: "",
      note: "",
    },
  });

  // Reset when modal opens
  useEffect(() => {
    if (open) form.reset();
  }, [open, form]);

  const movementType = useWatch({ control: form.control, name: "movement_type" });

  const productOptions = products.map((p) => ({
    value: String(p.id),
    label: `${p.product_code} — ${p.name}`,
  }));

  const warehouseOptions = warehouses.map((w) => ({
    value: String(w.id),
    label: w.name,
  }));

  async function onSubmit(values: MovementFormValues) {
    try {
      await createMovement.mutateAsync({
        product: Number(values.product),
        warehouse: Number(values.warehouse),
        movement_type: values.movement_type,
        quantity: values.quantity,
        note: values.note?.trim() || undefined,
      });
      toast.success("Stock movement recorded");
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Stock Movement</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

            {/* Warehouse */}
            <div className="space-y-2">
              <Label>Warehouse</Label>
              <Combobox
                options={warehouseOptions}
                value={form.watch("warehouse")}
                placeholder="Select warehouse..."
                searchPlaceholder="Search warehouse..."
                onChange={(v) =>
                  form.setValue("warehouse", v, {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  })
                }
              />
              {form.formState.errors.warehouse ? (
                <p className="text-sm text-red-500">{form.formState.errors.warehouse.message}</p>
              ) : null}
            </div>

            {/* Movement Type */}
            <div className="space-y-2">
              <Label>Movement Type</Label>
              <Select
                value={movementType}
                onValueChange={(v) =>
                  form.setValue("movement_type", v as "in" | "out" | "adjustment", {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">IN — add to stock</SelectItem>
                  <SelectItem value="out">OUT — remove from stock</SelectItem>
                  <SelectItem value="adjustment">ADJUSTMENT — set absolute quantity</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.movement_type ? (
                <p className="text-sm text-red-500">
                  {form.formState.errors.movement_type.message}
                </p>
              ) : null}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                {movementType === "adjustment" ? "Set Quantity To" : "Quantity"}
              </Label>
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

            {/* Adjustment note */}
            {movementType === "adjustment" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700 sm:col-span-2">
                <span className="font-semibold">Adjustment mode:</span> This will set the stock
                quantity to the exact value entered, overriding the current on-hand count.
              </div>
            ) : null}

            {/* Note */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Input id="note" placeholder="Reason for movement..." {...form.register("note")} />
              {form.formState.errors.note ? (
                <p className="text-sm text-red-500">{form.formState.errors.note.message}</p>
              ) : null}
            </div>
          </div>
        </DialogBody>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={createMovement.isPending}>
              {createMovement.isPending ? "Saving..." : "Record Movement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}