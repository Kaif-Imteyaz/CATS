"use client";
import { useEffect } from "react";

export default function GlobalError({
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
    <html>
      <body style={{ margin: 0, fontFamily: "sans-serif", background: "#F7F5F1" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ textAlign: "center", maxWidth: "320px" }}>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#23322D", marginBottom: "8px" }}>
              Application error
            </h1>
            <p style={{ fontSize: "14px", color: "#6B7C76", marginBottom: "24px" }}>
              {error.message || "A critical error occurred."}
            </p>
            <button
              onClick={reset}
              style={{
                background: "#2F7E6D", color: "#fff", border: "none",
                borderRadius: "99px", padding: "12px 32px", fontSize: "14px",
                cursor: "pointer", fontWeight: 600,
              }}
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
