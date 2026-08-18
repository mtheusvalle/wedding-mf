"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro de login.");
      }

      // Success, refresh the page to trigger Server Component check
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Não foi possível realizar o login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "var(--color-bg-alt)",
        padding: "1.5rem",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "400px",
          textAlign: "center",
          padding: "3rem 2rem",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔐</div>
        <h2
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "2rem",
            color: "var(--color-primary-dark)",
            marginBottom: "0.5rem",
          }}
        >
          Área do Casal
        </h2>
        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--color-text-muted)",
            marginBottom: "2rem",
          }}
        >
          Digite a senha administrativa para acessar o painel de controle.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: "left" }}>
            <label className="form-label" htmlFor="admin-password">
              Senha de Acesso
            </label>
            <input
              type="password"
              id="admin-password"
              className="form-control"
              placeholder="Digite a senha..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              style={{ textAlign: "center", letterSpacing: "0.15em" }}
            />
          </div>

          {error && (
            <div
              style={{
                color: "var(--color-danger)",
                fontSize: "0.85rem",
                marginBottom: "1rem",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar no Painel"}
          </button>
        </form>

        <div style={{ marginTop: "2rem" }}>
          <a
            href="/"
            style={{
              fontSize: "0.8rem",
              color: "var(--color-text-muted)",
              textDecoration: "underline",
            }}
          >
            Voltar para o site principal
          </a>
        </div>
      </div>
    </div>
  );
}
