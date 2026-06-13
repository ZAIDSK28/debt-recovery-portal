// src/pages/error-page.tsx
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = "Something went wrong";
  let description = "The application encountered an unexpected error.";

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText || "Error"}`;
    description =
      typeof error.data === "string"
        ? error.data
        : "The page could not be loaded.";
  } else if (error instanceof Error) {
    description = error.message || description;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4 py-10">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-gray-900">
          {title}
        </h1>
        <p className="mt-2 text-sm text-gray-500">{description}</p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => navigate(-1)} className="h-9 gap-1.5 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button onClick={() => window.location.reload()} className="h-9 gap-1.5 text-sm">
            <RefreshCw className="h-4 w-4" />
            Reload
          </Button>
        </div>
      </div>
    </div>
  );
}