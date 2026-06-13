// src/components/products/product-form.tsx
import { useEffect } from "react";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiError } from "@/lib/utils";
import { useCreateProduct, useProductCategories, useUpdateProduct } from "@/hooks/useProducts";
import type { Product } from "@/types";

const productSchema = z.object({
  product_code: z.string().optional(),
  category: z.string().optional(),
  category_id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  price: z.string().min(1, "Price is required"),
  default_quantity: z.string().min(1, "Default quantity is required"),
  tax_rate: z.string().min(1, "Tax rate is required"),
  is_active: z.enum(["true", "false"]),
});

type ProductFormValues = z.infer<typeof productSchema>;

export function ProductForm({
  product,
  onSuccess,
}: {
  product?: Product;
  onSuccess?: (createdOrUpdated: Product) => void;
}) {
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const { data: categories = [] } = useProductCategories();

  console.log("Categories for product form:", categories);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      product_code: "",
      category: "",
      category_id: "",
      name: "",
      price: "",
      default_quantity: "",
      tax_rate: "",
      is_active: "true",
    },
  });

  useEffect(() => {
    if (!product) return;

    form.reset({
      product_code: product.product_code || "",
      category: product.category || "",
      category_id: product.category_id ? String(product.category_id) : "",
      name: product.name,
      price: product.price,
      default_quantity: product.default_quantity,
      tax_rate: product.tax_rate,
      is_active: String(product.is_active) as "true" | "false",
    });
  }, [product, form]);

  const activeValue = useWatch({ control: form.control, name: "is_active" });
  const selectedCategoryId = useWatch({ control: form.control, name: "category_id" });

  async function onSubmit(values: ProductFormValues) {
    const payload = {
      product_code: values.product_code || "",
      category: values.category || "",
      category_id: values.category_id ? Number(values.category_id) : undefined,
      name: values.name,
      price: values.price,
      default_quantity: values.default_quantity,
      tax_rate: values.tax_rate,
      is_active: values.is_active === "true",
    };

    try {
      const saved = product
        ? await updateMutation.mutateAsync({ id: product.id, payload })
        : await createMutation.mutateAsync(payload);

      toast.success(product ? "Product updated" : "Product created");
      onSuccess?.(saved);
    } catch (error) {
      const message = getApiError(error);
      toast.error(message);
    }
  }

  const categoryOptions = categories.map((category) => ({
    value: String(category.id),
    label: category.name,
  }));

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="product_code">Product Code</Label>
        <Input id="product_code" placeholder="Leave blank to auto-generate" {...form.register("product_code")} />
        {form.formState.errors.product_code ? (
          <p className="text-sm text-red-500">{form.formState.errors.product_code.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Combobox
          options={categoryOptions}
          value={selectedCategoryId}
          placeholder="Select category"
          searchPlaceholder="Search categories..."
          onChange={(value) => {
            const selected = categories.find((category) => String(category.id) === value);
            form.setValue("category_id", value, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
            form.setValue("category", selected?.name ?? "", { shouldDirty: true });
          }}
        />
        {form.formState.errors.category_id ? (
          <p className="text-sm text-red-500">{form.formState.errors.category_id.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...form.register("name")} />
        {form.formState.errors.name ? (
          <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Price</Label>
        <Input id="price" type="number" step="0.01" {...form.register("price")} />
        {form.formState.errors.price ? (
          <p className="text-sm text-red-500">{form.formState.errors.price.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="default_quantity">Default Quantity</Label>
        <Input id="default_quantity" type="number" step="0.01" {...form.register("default_quantity")} />
        {form.formState.errors.default_quantity ? (
          <p className="text-sm text-red-500">{form.formState.errors.default_quantity.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tax_rate">Tax Rate</Label>
        <Input id="tax_rate" type="number" step="0.01" {...form.register("tax_rate")} />
        {form.formState.errors.tax_rate ? (
          <p className="text-sm text-red-500">{form.formState.errors.tax_rate.message}</p>
        ) : null}
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Active Status</Label>
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
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end md:col-span-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : product ? "Save Changes" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}