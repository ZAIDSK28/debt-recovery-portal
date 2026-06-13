// src/components/users/user-form.tsx
import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiError } from "@/lib/utils";
import { useCreateUser, useUpdateUser } from "@/hooks/useUsers";
import type { User, UserRole } from "@/types";

const createSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().optional(),
  role: z.enum(["admin", "dra"]),
  is_active: z.enum(["true", "false"]),
});

const editSchema = z.object({
  username: z.string().optional(),
  password: z.string().optional(),
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().optional(),
  role: z.enum(["admin", "dra"]),
  is_active: z.enum(["true", "false"]),
});

type UserFormValues = z.infer<typeof createSchema>;

export function UserForm({
  user,
  onSuccess,
}: {
  user?: User;
  onSuccess?: (saved: User) => void;
}) {
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser(user?.id ?? 0);
  const isEditMode = Boolean(user);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(isEditMode ? editSchema : createSchema),
    defaultValues: {
      username: "",
      password: "",
      full_name: "",
      email: "",
      role: "dra",
      is_active: "true",
    },
  });

  useEffect(() => {
    if (!user) return;

    form.reset({
      username: user.username,
      password: "",
      full_name: user.full_name,
      email: user.email || "",
      role: user.role,
      is_active: String(user.is_active ?? true) as "true" | "false",
    });
  }, [user, form]);

  async function onSubmit(values: UserFormValues) {
    try {
      const saved = isEditMode && user
        ? await updateMutation.mutateAsync({
            full_name: values.full_name,
            email: values.email || "",
            role: values.role as UserRole,
            is_active: values.is_active === "true",
          })
        : await createMutation.mutateAsync({
            username: values.username,
            password: values.password,
            full_name: values.full_name,
            email: values.email || "",
            role: values.role as UserRole,
            is_active: values.is_active === "true",
          });

      toast.success(isEditMode ? "User updated" : "User created");
      onSuccess?.(saved);
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const roleValue = form.watch("role");
  const activeValue = form.watch("is_active");

  return (
    <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-1.5">
        <Label htmlFor="username" className="text-sm font-semibold text-gray-700">
          Username
        </Label>
        <Input
          id="username"
          {...form.register("username")}
          disabled={isEditMode}
          className="h-9 text-sm"
        />
        {form.formState.errors.username && (
          <p className="text-xs text-red-500">{form.formState.errors.username.message}</p>
        )}
      </div>

      {!isEditMode && (
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            {...form.register("password")}
            className="h-9 text-sm"
          />
          {form.formState.errors.password && (
            <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="full_name" className="text-sm font-semibold text-gray-700">
          Full Name
        </Label>
        <Input
          id="full_name"
          {...form.register("full_name")}
          className="h-9 text-sm"
        />
        {form.formState.errors.full_name && (
          <p className="text-xs text-red-500">{form.formState.errors.full_name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
          Email (optional)
        </Label>
        <Input
          id="email"
          {...form.register("email")}
          className="h-9 text-sm"
        />
        {form.formState.errors.email && (
          <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-semibold text-gray-700">Role</Label>
        <Select
          value={roleValue}
          onValueChange={(value) =>
            form.setValue("role", value as UserRole, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin" className="text-sm">Admin</SelectItem>
            <SelectItem value="dra" className="text-sm">DRA</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-semibold text-gray-700">Active Status</Label>
        <Select
          value={activeValue}
          onValueChange={(value) =>
            form.setValue("is_active", value as "true" | "false", {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true" className="text-sm">Active</SelectItem>
            <SelectItem value="false" className="text-sm">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end md:col-span-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-9 gap-1.5 text-sm"
        >
          {isSubmitting ? "Saving..." : isEditMode ? "Save Changes" : "Create User"}
        </Button>
      </div>
    </form>
  );
}