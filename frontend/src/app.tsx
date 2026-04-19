import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { router } from "@/router";

function AppLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(186,230,253,0.8),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#f0f9ff_100%)] px-6">
      <div className="w-full max-w-md rounded-[20px] border border-sky-100 bg-white/90 p-8 text-center shadow-[0_16px_40px_rgba(14,165,233,0.12)] backdrop-blur">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#7dd3fc,#38bdf8,#0ea5e9)] text-lg font-bold text-white shadow-[0_10px_30px_rgba(56,189,248,0.22)]">
          DR
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Loading application</h2>
        <p className="mt-2 text-sm text-slate-500">Preparing your workspace…</p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-[linear-gradient(90deg,#7dd3fc,#0ea5e9)]" />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Suspense fallback={<AppLoader />}>
        <RouterProvider router={router} />
      </Suspense>

      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          className:
            "!rounded-2xl !border !border-slate-200 !bg-white !text-slate-800 !shadow-[0_16px_36px_rgba(15,23,42,0.12)]",
          descriptionClassName: "!text-slate-500",
        }}
      />
    </>
  );
}