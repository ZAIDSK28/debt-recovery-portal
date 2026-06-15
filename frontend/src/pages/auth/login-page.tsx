// src/pages/auth/login-page.tsx
import { useState } from "react";
import { Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/lib/toast"; // ← centralised toast (was: "sonner")
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
    defaultValues: { username: "", password: "" },
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

  const isSubmitting = form.formState.isSubmitting;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#F6F7FC] via-white to-[#EAEBF8] px-4 py-10">
      {/* Subtle brand radial */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(111,114,190,0.07),transparent_45%)]" />

      <Card className="relative w-full max-w-md shadow-xl shadow-[rgba(111,114,190,0.12)]">
        <CardHeader className="items-center pb-2 text-center">
          <div className="mb-5 rounded-[14px] bg-[#6F72BE] p-3.5 text-white shadow-md shadow-[#6F72BE]/25">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <CardTitle className="text-[22px] font-extrabold tracking-tight text-[#1E1E30]">
            Debt Recovery Portal
          </CardTitle>
          <p className="text-[12px] font-medium text-[#9898B4]">
            Sign in to access your operations workspace
          </p>
        </CardHeader>

        <CardContent className="pt-4">
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                placeholder="e.g., john.doe"
                className="h-9 text-sm"
                {...form.register("username")}
              />
              {form.formState.errors.username && (
                <p className="text-[11px] text-red-500">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="h-9 pr-10 text-sm"
                  placeholder="••••••••"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9898B4] transition-colors hover:text-[#6B6B8A]"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-[11px] text-red-500">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="mt-1 h-9 w-full gap-2 text-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}