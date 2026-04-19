import { useEffect, useMemo } from "react";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateBill, useUpdateBill } from "@/hooks/useBills";
import { useOutlets, useRoutes } from "@/hooks/useRoutes";
import { useUsers } from "@/hooks/useUsers";
import { getApiError } from "@/lib/utils";
import type { Invoice } from "@/types";

const billSchema = z.object({
  invoice_number: z.string().min(1, "Invoice number is required"),
  invoice_date: z.string().min(1, "Invoice date is required"),
  route_id: z.string().min(1, "Route is required"),
  outlet: z.string().min(1, "Outlet is required"),
  brand: z.string().min(1, "Brand is required"),
  actual_amount: z.string().min(1, "Amount is required"),
  assigned_to: z.string().optional(),
});

type BillFormValues = z.infer<typeof billSchema>;

export function BillFormModal({
  open,
  onOpenChange,
  bill,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill?: Invoice | null;
}) {
  const createBill = useCreateBill();
  const updateBill = useUpdateBill();
  const { data: routes = [] } = useRoutes();
  const { data: users = [] } = useUsers("dra");

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      invoice_number: "",
      invoice_date: "",
      route_id: "",
      outlet: "",
      brand: "",
      actual_amount: "",
      assigned_to: "unassigned",
    },
  });

  const watchedRouteId = useWatch({ control: form.control, name: "route_id" });
  const assignedTo = useWatch({ control: form.control, name: "assigned_to" });

  const effectiveRouteId = watchedRouteId
    ? Number(watchedRouteId)
    : bill?.route_id
      ? Number(bill.route_id)
      : null;

  const { data: outlets = [] } = useOutlets(effectiveRouteId);

  useEffect(() => {
    if (!open) return;

    if (bill) {
      form.reset({
        invoice_number: bill.invoice_number,
        invoice_date: bill.invoice_date,
        route_id: bill.route_id ? String(bill.route_id) : "",
        outlet: String(bill.outlet),
        brand: bill.brand,
        actual_amount: bill.actual_amount,
        assigned_to: bill.assigned_to_id ? String(bill.assigned_to_id) : "unassigned",
      });
    } else {
      form.reset({
        invoice_number: "",
        invoice_date: "",
        route_id: "",
        outlet: "",
        brand: "",
        actual_amount: "",
        assigned_to: "unassigned",
      });
    }
  }, [bill, form, open]);

  const routeOptions = useMemo(
    () => routes.map((route) => ({ value: String(route.id), label: route.name })),
    [routes]
  );

  const outletOptions = useMemo(
    () => outlets.map((outlet) => ({ value: String(outlet.id), label: outlet.name })),
    [outlets]
  );

  async function onSubmit(values: BillFormValues) {
    try {
      const payload = {
        invoice_number: values.invoice_number,
        invoice_date: values.invoice_date,
        outlet: Number(values.outlet),
        brand: values.brand,
        actual_amount: values.actual_amount,
        assigned_to:
          values.assigned_to && values.assigned_to !== "unassigned"
            ? Number(values.assigned_to)
            : null,
      };

      if (bill) {
        await updateBill.mutateAsync({
          id: bill.id,
          payload,
        });
        toast.success("Invoice updated");
      } else {
        await createBill.mutateAsync(payload);
        toast.success("Invoice created");
      }

      onOpenChange(false);
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  const isSubmitting = createBill.isPending || updateBill.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{bill ? "Edit Invoice" : "New Invoice"}</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <form id="bill-form" className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
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
              <Label>Route</Label>
              <Combobox
                options={routeOptions}
                value={watchedRouteId}
                placeholder="Select route"
                searchPlaceholder="Search routes..."
                onChange={(value) => {
                  const currentRouteId = form.getValues("route_id");
                  if (currentRouteId !== value) {
                    form.setValue("route_id", value, { shouldValidate: true });
                    form.setValue("outlet", "", { shouldValidate: true });
                  }
                }}
              />
              {form.formState.errors.route_id ? (
                <p className="text-sm text-red-500">{form.formState.errors.route_id.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Outlet</Label>
              <Combobox
                options={outletOptions}
                value={form.getValues("outlet")}
                placeholder={effectiveRouteId ? "Select outlet" : "Choose route first"}
                searchPlaceholder="Search outlets..."
                disabled={!effectiveRouteId}
                onChange={(value) => form.setValue("outlet", value, { shouldValidate: true })}
              />
              {form.formState.errors.outlet ? (
                <p className="text-sm text-red-500">{form.formState.errors.outlet.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" {...form.register("brand")} />
              {form.formState.errors.brand ? (
                <p className="text-sm text-red-500">{form.formState.errors.brand.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="actual_amount">Total Amount</Label>
              <Input id="actual_amount" type="number" step="0.01" {...form.register("actual_amount")} />
              {form.formState.errors.actual_amount ? (
                <p className="text-sm text-red-500">{form.formState.errors.actual_amount.message}</p>
              ) : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Assign to Agent</Label>
              <Select
                value={assignedTo ?? "unassigned"}
                onValueChange={(value) => form.setValue("assigned_to", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </form>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button form="bill-form" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : bill ? "Save Changes" : "Create Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}