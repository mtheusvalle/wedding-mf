"use client";

import { useState } from "react";

interface PixClientProps {
  pixCode: string;
}

export default function PixClient({ pixCode }: PixClientProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ marginTop: "1rem", textAlign: "center" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          backgroundColor: "var(--color-bg-alt)",
          border: "1px solid var(--color-border)",
          borderRadius: "6px",
          padding: "0.75rem 1rem",
          gap: "0.75rem",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "0.85rem", // Slightly smaller monospace to fit the longer Pix code nicely
            color: "var(--color-text-main)",
            wordBreak: "break-all",
            textAlign: "left",
            flexGrow: 1,
            maxHeight: "80px",
            overflowY: "auto",
            paddingRight: "0.5rem"
          }}
        >
          {pixCode}
        </span>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={handleCopy}
          style={{
            whiteSpace: "nowrap",
            padding: "0.4rem 1rem",
            fontSize: "0.75rem",
            textTransform: "none",
            flexShrink: 0,
          }}
        >
          {copied ? "✓ Copiado" : "Copiar"}
        </button>
      </div>
      <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontStyle: "italic" }}>
        Copie o código "Copia e Cola" acima e faça o pagamento no aplicativo do seu banco de preferência.
      </p>
    </div>
  );
}
