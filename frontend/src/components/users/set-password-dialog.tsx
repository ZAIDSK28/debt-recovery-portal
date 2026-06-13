// src/components/users/set-password-dialog.tsx
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/lib/toast";
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
import { useSetUserPassword } from "@/hooks/useUsers";
import { getApiError } from "@/lib/utils";

const schema = z
  .object({
    password: z.string().min(1, "Password is required"),
    confirm_password: z.string().min(1, "Confirm password is required"),
  })
  .refine((values) => values.password === values.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match",
  });

type Values = z.infer<typeof schema>;

export function SetPasswordDialog({
  open,
  onOpenChange,
  userId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number | null;
}) {
  const mutation = useSetUserPassword(userId ?? 0);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      confirm_password: "",
    },
  });

  const [resetKey, setResetKey] = useState(0);

  async function onSubmit(values: Values) {
    if (!userId) return;

    try {
      const response = await mutation.mutateAsync({ password: values.password });
      toast.success(response.detail);
      onOpenChange(false);
      form.reset();
      setResetKey((prev) => prev + 1);
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          form.reset();
          setResetKey((prev) => prev + 1);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Password</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form key={resetKey} id="set-password-form" className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...form.register("password")} />
              {form.formState.errors.password ? (
                <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm Password</Label>
              <Input id="confirm_password" type="password" {...form.register("confirm_password")} />
              {form.formState.errors.confirm_password ? (
                <p className="text-sm text-red-500">{form.formState.errors.confirm_password.message}</p>
              ) : null}
            </div>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button form="set-password-form" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Update Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}