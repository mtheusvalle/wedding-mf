"use client";

import { useState } from "react";

interface PixClientProps {
  pixKey: string;
}

export default function PixClient({ pixKey }: PixClientProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(pixKey);
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
            fontSize: "0.95rem",
            color: "var(--color-text-main)",
            wordBreak: "break-all",
            textAlign: "left",
            flexGrow: 1,
          }}
        >
          {pixKey}
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
        Copie a chave acima e faça a transferência no aplicativo do seu banco de preferência.
      </p>
    </div>
  );
}
