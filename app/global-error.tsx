"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error("[Global error boundary]", error);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", backgroundColor: "#f4f4f5" }}>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}>
          <div style={{ maxWidth: "360px", width: "100%", textAlign: "center" }}>

            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <AlertTriangle style={{ width: "24px", height: "24px", color: "#dc2626" }} />
            </div>

            <h1 style={{ fontSize: "20px", fontWeight: "700", margin: "0 0 8px" }}>
              Error crítico
            </h1>
            <p style={{ fontSize: "14px", color: "#71717a", margin: "0 0 24px" }}>
              La aplicación encontró un error grave. Por favor recargá la página.
            </p>

            <button
              onClick={reset}
              style={{
                backgroundColor: "#0f172a",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <RefreshCw style={{ width: "16px", height: "16px" }} />
              Recargar
            </button>

          </div>
        </div>
      </body>
    </html>
  );
}
