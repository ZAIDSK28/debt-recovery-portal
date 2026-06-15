// src/components/bills/bill-form-modal.tsx
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/lib/toast";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateInput } from "@/components/ui/date-input";
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

export const BillFormModal = memo(function BillFormModal({
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
  const submitLockRef = useRef(false);

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
  const watchedOutlet = useWatch({ control: form.control, name: "outlet" });
  const assignedTo = useWatch({ control: form.control, name: "assigned_to" });
  const invoiceDate = useWatch({ control: form.control, name: "invoice_date" });

  const effectiveRouteId = watchedRouteId
    ? Number(watchedRouteId)
    : bill?.route_id
      ? Number(bill.route_id)
      : null;

  const { data: outlets = [] } = useOutlets(effectiveRouteId);

  // Reset form when modal opens or the bill context changes
  useEffect(() => {
    if (!open) return;
    submitLockRef.current = false;

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
    () => routes.map((r) => ({ value: String(r.id), label: r.name })),
    [routes],
  );

  const outletOptions = useMemo(
    () => outlets.map((o) => ({ value: String(o.id), label: o.name })),
    [outlets],
  );

  const onSubmit = useCallback(
    async (values: BillFormValues) => {
      if (submitLockRef.current) return;
      submitLockRef.current = true;

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
          await updateBill.mutateAsync({ id: bill.id, payload });
          toast.success("Invoice updated");
        } else {
          await createBill.mutateAsync(payload);
          toast.success("Invoice created");
        }

        onOpenChange(false);
      } catch (error) {
        toast.error(getApiError(error));
      } finally {
        submitLockRef.current = false;
      }
    },
    [bill, createBill, updateBill, onOpenChange],
  );

  const isSubmitting = createBill.isPending || updateBill.isPending;

  // handleSubmit is stable — fine to call inline from onClick
  const handleClickSubmit = useCallback(() => {
    void form.handleSubmit(onSubmit)();
  }, [form, onSubmit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[100]">
        <DialogHeader>
          <DialogTitle>{bill ? "Edit Invoice" : "New Invoice"}</DialogTitle>
        </DialogHeader>

        <DialogBody>
          {/*
           * No id / form attribute pattern here.
           * The submit button in DialogFooter calls form.handleSubmit directly via
           * onClick to avoid cross-form submit event propagation through the Radix
           * portal boundary, which was causing underlying page elements to fire.
           */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="invoice_number">Invoice Number</Label>
              <Input id="invoice_number" {...form.register("invoice_number")} />
              {form.formState.errors.invoice_number ? (
                <p className="text-[11px] text-[#E04E6A]">
                  {form.formState.errors.invoice_number.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invoice_date">Invoice Date</Label>
              <DateInput
                value={invoiceDate ?? ""}
                onChange={(value) =>
                  form.setValue("invoice_date", value, { shouldValidate: true })
                }
                clearable
              />
              {form.formState.errors.invoice_date ? (
                <p className="text-[11px] text-[#E04E6A]">
                  {form.formState.errors.invoice_date.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label>Route</Label>
              <Combobox
                options={routeOptions}
                value={watchedRouteId}
                placeholder="Select route"
                searchPlaceholder="Search routes..."
                onChange={(value) => {
                  if (form.getValues("route_id") !== value) {
                    form.setValue("route_id", value, { shouldValidate: true });
                    form.setValue("outlet", "", { shouldValidate: true });
                  }
                }}
              />
              {form.formState.errors.route_id ? (
                <p className="text-[11px] text-[#E04E6A]">
                  {form.formState.errors.route_id.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label>Outlet</Label>
              <Combobox
                options={outletOptions}
                value={watchedOutlet}
                placeholder={effectiveRouteId ? "Select outlet" : "Choose route first"}
                searchPlaceholder="Search outlets..."
                disabled={!effectiveRouteId}
                onChange={(value) =>
                  form.setValue("outlet", value, { shouldValidate: true })
                }
              />
              {form.formState.errors.outlet ? (
                <p className="text-[11px] text-[#E04E6A]">
                  {form.formState.errors.outlet.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" {...form.register("brand")} />
              {form.formState.errors.brand ? (
                <p className="text-[11px] text-[#E04E6A]">
                  {form.formState.errors.brand.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="actual_amount">Total Amount</Label>
              <Input
                id="actual_amount"
                type="number"
                step="0.01"
                min="0"
                {...form.register("actual_amount")}
              />
              {form.formState.errors.actual_amount ? (
                <p className="text-[11px] text-[#E04E6A]">
                  {form.formState.errors.actual_amount.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Assign to Agent</Label>
              <Select
                value={assignedTo ?? "unassigned"}
                onValueChange={(value) =>
                  form.setValue("assigned_to", value, { shouldValidate: true })
                }
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
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleClickSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving…" : bill ? "Save Changes" : "Create Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});