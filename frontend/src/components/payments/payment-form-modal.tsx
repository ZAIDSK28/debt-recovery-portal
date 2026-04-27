import { useEffect, useMemo } from "react";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateInput } from "@/components/ui/date-input";
import { useRecordPayment } from "@/hooks/usePayments";
import { formatCurrency, getApiError } from "@/lib/utils";
import type { Invoice } from "@/types";

const paymentSchema = z
  .object({
    amount: z.string().min(1, "Amount is required"),
    payment_method: z.enum(["cash", "upi", "cheque", "electronic"]),
    transaction_number: z.string().optional(),
    cheque_number: z.string().optional(),
    cheque_date: z.string().optional(),
    cheque_type: z.enum(["rtgs", "neft", "imps"]).optional(),
    cheque_status: z.enum(["pending", "cleared", "bounced"]).optional(),
    firm: z.enum(["NA", "MZ"]).optional(),
  })
  .superRefine((values, ctx) => {
    const method = values.payment_method;

    if (method === "upi" && !values.transaction_number?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Transaction number is required",
        path: ["transaction_number"],
      });
    }

    if (method === "cheque" || method === "electronic") {
      if (!values.cheque_number?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Cheque number is required",
          path: ["cheque_number"],
        });
      }
      if (!values.cheque_date?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Cheque date is required",
          path: ["cheque_date"],
        });
      }
      if (!values.cheque_type) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Cheque type is required",
          path: ["cheque_type"],
        });
      }
      if (!values.firm) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Firm is required",
          path: ["firm"],
        });
      }
    }

    if (method === "electronic" && !values.transaction_number?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Transaction number is required",
        path: ["transaction_number"],
      });
    }
  });

type PaymentFormValues = z.infer<typeof paymentSchema>;

export function PaymentFormModal({
  open,
  onOpenChange,
  bill,
  onBillCleared,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: Invoice | null;
  onBillCleared: () => void;
}) {
  const mutation = useRecordPayment();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: "",
      payment_method: "cash",
      transaction_number: "",
      cheque_number: "",
      cheque_date: "",
      cheque_type: undefined,
      cheque_status: "pending",
      firm: "NA",
    },
  });

  const method = useWatch({ control: form.control, name: "payment_method" });
  const chequeType = useWatch({ control: form.control, name: "cheque_type" });
  const firm = useWatch({ control: form.control, name: "firm" });
  const chequeDate = useWatch({ control: form.control, name: "cheque_date" });

  useEffect(() => {
    if (open) {
      form.reset({
        amount: "",
        payment_method: "cash",
        transaction_number: "",
        cheque_number: "",
        cheque_date: "",
        cheque_type: undefined,
        cheque_status: "pending",
        firm: "NA",
      });
    }
  }, [open, form]);

  const remainingAmount = useMemo(() => Number(bill?.remaining_amount ?? 0), [bill]);

  async function onSubmit(values: PaymentFormValues) {
    if (!bill) return;

    const numericAmount = Number(values.amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error("Amount must be greater than zero.");
      return;
    }

    if (numericAmount > remainingAmount) {
      toast.error("Amount cannot exceed remaining amount.");
      return;
    }

    try {
      await mutation.mutateAsync({
        billId: bill.id,
        payload: {
          amount: values.amount,
          payment_method: values.payment_method,
          transaction_number: values.transaction_number?.trim() || undefined,
          cheque_number: values.cheque_number?.trim() || undefined,
          cheque_date: values.cheque_date?.trim() || undefined,
          cheque_type: values.cheque_type,
          cheque_status: values.cheque_status,
          firm: values.firm,
        },
      });

      const immediateClear =
        (values.payment_method === "cash" || values.payment_method === "upi") &&
        numericAmount === remainingAmount;

      toast.success("Payment recorded");
      onOpenChange(false);

      if (immediateClear) {
        onBillCleared();
      }
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  if (!bill) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <div className="mb-5 rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
            <p className="text-sm text-slate-500">Invoice</p>
            <p className="font-semibold text-slate-900">{bill.invoice_number}</p>
            <p className="mt-2 text-sm text-slate-600">
              Remaining: <span className="font-semibold">{formatCurrency(bill.remaining_amount)}</span>
            </p>
          </div>

          <form id="payment-form" className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" {...form.register("amount")} />
              {form.formState.errors.amount ? (
                <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p>
              ) : null}
            </div>

            <div className="space-y-2 md:col-span-1">
              <Label>Payment Method</Label>
              <Select
                value={method}
                onValueChange={(value) =>
                  form.setValue("payment_method", value as PaymentFormValues["payment_method"], {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="electronic">Electronic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(method === "upi" || method === "electronic") && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="transaction_number">Transaction Number</Label>
                <Input id="transaction_number" {...form.register("transaction_number")} />
                {form.formState.errors.transaction_number ? (
                  <p className="text-sm text-red-500">{form.formState.errors.transaction_number.message}</p>
                ) : null}
              </div>
            )}

            {(method === "cheque" || method === "electronic") && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cheque_number">Cheque Number</Label>
                  <Input id="cheque_number" {...form.register("cheque_number")} />
                  {form.formState.errors.cheque_number ? (
                    <p className="text-sm text-red-500">{form.formState.errors.cheque_number.message}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cheque_date">Cheque Date</Label>
                  <DateInput
                    value={chequeDate ?? ""}
                    onChange={(value) =>
                      form.setValue("cheque_date", value, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                    }
                    clearable
                  />
                  {form.formState.errors.cheque_date ? (
                    <p className="text-sm text-red-500">{form.formState.errors.cheque_date.message}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label>Cheque Type</Label>
                  <Select
                    value={chequeType}
                    onValueChange={(value) =>
                      form.setValue("cheque_type", value as "rtgs" | "neft" | "imps", {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rtgs">RTGS</SelectItem>
                      <SelectItem value="neft">NEFT</SelectItem>
                      <SelectItem value="imps">IMPS</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.cheque_type ? (
                    <p className="text-sm text-red-500">{form.formState.errors.cheque_type.message}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label>Firm</Label>
                  <Select
                    value={firm}
                    onValueChange={(value) =>
                      form.setValue("firm", value as "NA" | "MZ", {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select firm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NA">NA</SelectItem>
                      <SelectItem value="MZ">MZ</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.firm ? (
                    <p className="text-sm text-red-500">{form.formState.errors.firm.message}</p>
                  ) : null}
                </div>
              </>
            )}
          </form>
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button form="payment-form" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}