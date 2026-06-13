import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { router } from "@/router";

function AppLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="relative h-16 w-16">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
        {/* Spinning accent ring */}
        <div className="absolute inset-0 rounded-full border-4 border-t-[#6F72BE] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
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
            "!rounded-xl !border !border-gray-200 !bg-white !text-gray-800 !shadow-md",
          descriptionClassName: "!text-gray-500",
        }}
      />
    </>
  );
}