import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { Loader } from "lucide-react";
import { router } from "@/router";

function AppLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Loader className="h-8 w-8 animate-spin text-[#6F72BE]" />
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
        closeButton
        richColors={false}
        toastOptions={{
          className: "!rounded-xl !shadow-md !font-sans",
          descriptionClassName: "!text-sm",
        }}
      />
    </>
  );
}