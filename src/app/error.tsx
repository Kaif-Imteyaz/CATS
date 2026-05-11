"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-cream">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-terracotta/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-terracotta" />
        </div>
        <h1 className="text-xl font-bold text-deep mb-2" style={{ fontFamily: "var(--font-poppins)" }}>
          Something went wrong
        </h1>
        <p className="text-sm text-deep/50 mb-6">
          {error.message || "An unexpected error occurred."}
        </p>
        <Button onClick={reset} className="bg-primary text-white rounded-full px-8">
          Try again
        </Button>
      </div>
    </div>
  );
}
