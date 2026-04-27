import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { cn, getApiError } from "@/lib/utils";

export default function VerifyOtpPage() {
  const { pendingOtpUsername, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [cooldown, setCooldown] = useState(60);
  const [shake, setShake] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (cooldown <= 0) return;

    const id = window.setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => window.clearInterval(id);
  }, [cooldown]);

  const otp = useMemo(() => digits.join(""), [digits]);

  if (!pendingOtpUsername) {
    return <Navigate to="/login" replace />;
  }

  function updateDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);

    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    event.preventDefault();

    const next = ["", "", "", "", "", ""];
    pasted.split("").forEach((char, index) => {
      next[index] = char;
    });

    setDigits(next);
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  }

  async function handleVerify() {
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit OTP.");
      return;
    }

    setIsSubmitting(true);

    try {
      const verifiedUser = await verifyOtp(otp);

      toast.success("Verification successful");

      window.setTimeout(() => {
        if (verifiedUser.role === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/dra", { replace: true });
        }
      }, 0);
    } catch (error) {
      setShake(true);
      window.setTimeout(() => setShake(false), 400);
      toast.error(getApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    try {
      await resendOtp();
      setCooldown(60);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      toast.success("OTP resent");
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(186,230,253,0.95),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#f0f9ff_100%)] px-4 py-10">
      <Card className={cn("w-full max-w-md shadow-[0_20px_50px_rgba(14,165,233,0.14)] transition", shake && "animate-pulse")}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Verify OTP</CardTitle>
          <p className="text-sm text-slate-500">
            Enter the six-digit code sent to your registered email.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                value={digit}
                onChange={(event) => updateDigit(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : undefined}
                maxLength={1}
                className="h-14 w-12 rounded-xl border border-slate-200 bg-white text-center text-xl font-bold text-slate-900 outline-none ring-0 focus:border-sky-300 focus:ring-2 focus:ring-sky-200"
                aria-label={`OTP digit ${index + 1}`}
              />
            ))}
          </div>

          <Button className="w-full" onClick={handleVerify} disabled={isSubmitting}>
            {isSubmitting ? "Verifying..." : "Verify OTP"}
          </Button>

          <div className="text-center text-sm text-slate-500">
            {cooldown > 0 ? (
              <span>Resend available in {cooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="font-semibold text-sky-700 transition hover:text-sky-800"
              >
                Resend OTP
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}