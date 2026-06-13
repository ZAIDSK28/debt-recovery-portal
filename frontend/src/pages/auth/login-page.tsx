import { useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { getApiError } from "@/lib/utils";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      const result = await login(values);

      if (result.status === "otp") {
        toast.success("OTP sent to your registered email.");
        navigate("/verify", { replace: true });
        return;
      }

      navigate(result.user.role === "admin" ? "/admin" : "/dra", { replace: true });
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* Subtle radial gradient background - neutral with purple undertone */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100/50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(111,114,190,0.08),transparent_40%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(111,114,190,0.05),transparent_50%)]" />

      <Card className="relative w-full max-w-md border border-gray-200/80 bg-white/90 shadow-xl shadow-gray-200/30 backdrop-blur-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-5 rounded-2xl bg-[#6F72BE] p-3.5 text-white shadow-md shadow-[#6F72BE]/20">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <CardTitle className="font-heading text-2xl font-extrabold tracking-tight text-gray-900">
            Debt Recovery Portal
          </CardTitle>
          <p className="text-sm font-medium text-gray-500">
            Sign in to access your operations workspace
          </p>
        </CardHeader>

        <CardContent>
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold text-gray-700">
                Username
              </Label>
              <Input
                id="username"
                autoComplete="username"
                placeholder="e.g., john.doe"
                {...form.register("username")}
              />
              {form.formState.errors.username && (
                <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="pr-10"
                  placeholder="••••••••"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}