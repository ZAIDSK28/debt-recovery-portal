import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { router } from "@/router";

export default function App() {
  return (
    <>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
            Loading application...
          </div>
        }
      >
        <RouterProvider router={router} />
      </Suspense>
      <Toaster position="top-right" richColors />
    </>
  );
}