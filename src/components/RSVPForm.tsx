"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/page.module.css";
import Link from "next/link";

interface Guest {
  id: string;
  name: string;
  phone: string;
  code: string;
  allowedAdditionalGuests: number;
  confirmedAdditionalGuests: number;
  confirmedNames: string | null;
  status: string;
  notes: string | null;
}

interface WeddingConfig {
  brideName: string;
  groomName: string;
  weddingDate: string;
  ceremonyPlace: string;
  ceremonyAddress: string;
  ceremonyMapsUrl: string;
  partyPlace: string;
  partyAddress: string;
  partyMapsUrl: string;
  storyImage: string;
}

interface RSVPFormProps {
  initialGuest: Guest | null;
  weddingConfig: WeddingConfig;
}

export default function RSVPForm({ initialGuest, weddingConfig }: RSVPFormProps) {
  const router = useRouter();
  
  const [guest, setGuest] = useState<Guest | null>(initialGuest);
  const [searchCode, setSearchCode] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  // Form states
  const [status, setStatus] = useState<string>("");
  const [additionalCount, setAdditionalCount] = useState<number | string>(0);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [redirectTimer, setRedirectTimer] = useState<number | null>(null);

  // Initialize form state when guest changes (e.g. on mount if loaded by URL token)
  useEffect(() => {
    if (guest) {
      if (guest.status !== "PENDING") {
        router.push("/");
        return;
      }
      setStatus("CONFIRMED");
      setAdditionalCount(guest.confirmedAdditionalGuests || 0);
      setNotes("");
    }
  }, [guest, router]);

  // Handle countdown timer for redirecting
  useEffect(() => {
    if (redirectTimer !== null) {
      if (redirectTimer === 0) {
        router.push("/");
      } else {
        const timeout = setTimeout(() => {
          setRedirectTimer(redirectTimer - 1);
        }, 1000);
        return () => clearTimeout(timeout);
      }
    }
  }, [redirectTimer, router]);

  // Search guest by code
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    setSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(`/api/rsvp/search?code=${encodeURIComponent(searchCode.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Código não encontrado.");
      }

      if (data.status !== "PENDING") {
        router.push("/");
        return;
      }

      setGuest(data);
    } catch (err: any) {
      setSearchError(err.message || "Erro ao buscar convite.");
    } finally {
      setSearching(false);
    }
  };

  // Submit RSVP response
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guest) return;

    setSubmitting(true);
    setSearchError(null);

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guestId: guest.id,
          status,
          confirmedAdditionalGuests: status === "CONFIRMED" ? (parseInt(additionalCount.toString(), 10) || 0) : 0,
          confirmedNames: "",
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao enviar resposta.");
      }

      setSuccessMsg(data.message);
      setRedirectTimer(4); // Start countdown to redirect
    } catch (err: any) {
      setSearchError(err.message || "Erro ao salvar confirmação.");
      setSubmitting(false);
    }
  };



  const brideAndGroom = `${weddingConfig.brideName} & ${weddingConfig.groomName}`;
  const weddingDateFormatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(weddingConfig.weddingDate));
  
  const weddingTimeFormatted = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(weddingConfig.weddingDate));

  // SUCCESS STATE WITH REDIRECT
  if (successMsg) {
    return (
      <div className={styles.card} style={{ maxWidth: "500px", margin: "2rem auto", textAlign: "center", padding: "3rem 2rem" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>❤️</div>
        <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", marginBottom: "1rem", color: "var(--color-primary-dark)" }}>
          Obrigado!
        </h3>
        <p style={{ fontSize: "1.1rem", color: "var(--color-text-main)", marginBottom: "2rem" }}>
          {successMsg}
        </p>
        <div style={{ padding: "0.75rem", backgroundColor: "var(--color-bg-alt)", borderRadius: "4px", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          Redirecionando para o site em <strong>{redirectTimer}</strong> segundos...
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      
      {/* Wedding Information Box */}
      <div className={styles.card} style={{ padding: "2.5rem", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", color: "var(--color-primary-dark)", marginBottom: "1rem" }}>
          {brideAndGroom}
        </h2>
        <p style={{ fontStyle: "italic", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
          Convidam para a celebração de seu casamento
        </p>

        <div style={{ borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)", padding: "1.5rem 0", margin: "1.5rem 0" }}>
          <p style={{ fontWeight: 500, color: "var(--color-text-main)", textTransform: "capitalize" }}>
            📅 {weddingDateFormatted}
          </p>
          <p style={{ fontWeight: 500, color: "var(--color-text-main)", marginTop: "0.5rem" }}>
            ⏰ às {weddingTimeFormatted}h
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", textAlign: "left", marginBottom: "1.5rem" }}>
          <div>
            <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-accent-dark)" }}>
              ⛪ Cerimônia
            </h4>
            <p style={{ fontSize: "0.9rem", fontWeight: 500, marginTop: "0.25rem" }}>{weddingConfig.ceremonyPlace}</p>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>{weddingConfig.ceremonyAddress}</p>
            <a
              href={weddingConfig.ceremonyMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm"
              style={{ marginTop: "0.75rem", display: "inline-flex", padding: "0.4rem 1rem" }}
            >
              Google Maps
            </a>
          </div>

          <div>
            <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-accent-dark)" }}>
              🥂 Recepção & Festa
            </h4>
            <p style={{ fontSize: "0.9rem", fontWeight: 500, marginTop: "0.25rem" }}>{weddingConfig.partyPlace}</p>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>{weddingConfig.partyAddress}</p>
            <a
              href={weddingConfig.partyMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm"
              style={{ marginTop: "0.75rem", display: "inline-flex", padding: "0.4rem 1rem" }}
            >
              Google Maps
            </a>
          </div>
        </div>
      </div>

      {/* RSVP Form Box */}
      <div className={styles.card} style={{ padding: "2.5rem" }}>
        
        {/* STATE 1: SEARCH GUEST */}
        {!guest ? (
          <div>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", marginBottom: "1rem", color: "var(--color-primary-dark)", textAlign: "center" }}>
              Confirmar Presença
            </h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem", textAlign: "center" }}>
              Por favor, digite o código de acesso recebido no seu convite para prosseguir.
            </p>

            <form onSubmit={handleSearch}>
              <div className="form-group">
                <label className="form-label" htmlFor="invite-code">Código do Convite</label>
                <input
                  type="text"
                  id="invite-code"
                  className="form-control"
                  placeholder="Ex: joao123"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  disabled={searching}
                  required
                  style={{ textTransform: "lowercase", textAlign: "center", fontSize: "1.2rem", letterSpacing: "0.1em" }}
                />
              </div>

              {searchError && (
                <div style={{ color: "var(--color-danger)", fontSize: "0.85rem", marginBottom: "1rem", textAlign: "center" }}>
                  ⚠️ {searchError}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={searching}
              >
                {searching ? "Buscando..." : "Buscar Convite"}
              </button>
            </form>
          </div>
        ) : (
          
          /* STATE 2: RSVP FORM */
          <div>
            <h3 style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.6rem",
              marginBottom: "1.5rem",
              textAlign: "center",
              color: "var(--color-primary-dark)"
            }}>
              Olá, {guest.name}!
            </h3>

            {/* Elegant Digital Invitation Card */}
            <div style={{
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-bg)",
              padding: "2.5rem 1.5rem",
              borderRadius: "8px",
              textAlign: "center",
              marginBottom: "2.5rem",
              boxShadow: "var(--shadow-sm)",
            }}>
              <p style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: "0.95rem",
                color: "var(--color-text-muted)",
                lineHeight: "1.6",
                marginBottom: "0.25rem"
              }}>
                “Por isso deixará o homem o seu pai e a sua mãe, e se unirá à sua mulher, e serão uma só carne.”
              </p>
              <p style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--color-primary-dark)",
                marginBottom: "1.5rem"
              }}>
                Gênesis 2:24
              </p>

              <div style={{
                width: "40px",
                height: "1px",
                backgroundColor: "var(--color-border)",
                margin: "0 auto 1.5rem auto"
              }} />

              <p style={{
                fontSize: "0.85rem",
                color: "var(--color-text-muted)",
                lineHeight: "1.6",
                marginBottom: "1.5rem"
              }}>
                Com a bênção de Deus e de nossos pais,<br />
                convidamos você para celebrar conosco o início de uma nova história.
              </p>

              <h4 style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.8rem",
                letterSpacing: "0.15em",
                color: "var(--color-primary)",
                margin: "1.5rem 0",
                fontWeight: "500"
              }}>
                {weddingConfig.brideName.toUpperCase()} & {weddingConfig.groomName.toUpperCase()}
              </h4>

              <p style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.1rem",
                color: "var(--color-text-main)",
                marginBottom: "0.25rem",
                fontWeight: "500"
              }}>
                {new Intl.DateTimeFormat("pt-BR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "America/Sao_Paulo",
                }).format(new Date(weddingConfig.weddingDate))}
              </p>
              <p style={{
                fontSize: "0.9rem",
                color: "var(--color-text-muted)",
                marginBottom: "1.5rem"
              }}>
                Às {weddingTimeFormatted}h
              </p>

              <div style={{
                width: "40px",
                height: "1px",
                backgroundColor: "var(--color-border)",
                margin: "0 auto 1.5rem auto"
              }} />

              <p style={{
                fontSize: "0.85rem",
                fontStyle: "italic",
                color: "var(--color-text-muted)",
                lineHeight: "1.6"
              }}>
                Será um dia muito especial, preparado com amor,<br />
                e a sua presença tornará esse momento ainda mais inesquecível.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Sua resposta</label>
                <div className="rsvp-options">
                  <div className="rsvp-option">
                    <input
                      type="radio"
                      id="status-confirm"
                      name="rsvp-status"
                      checked={status === "CONFIRMED"}
                      onChange={() => setStatus("CONFIRMED")}
                      disabled={submitting}
                    />
                    <label htmlFor="status-confirm" className="rsvp-option-label">
                      Vou comparecer
                    </label>
                  </div>

                  <div className="rsvp-option">
                    <input
                      type="radio"
                      id="status-decline"
                      name="rsvp-status"
                      checked={status === "DECLINED"}
                      onChange={() => setStatus("DECLINED")}
                      disabled={submitting}
                    />
                    <label htmlFor="status-decline" className="rsvp-option-label">
                      Não poderei ir
                    </label>
                  </div>
                </div>
              </div>

              {/* Conditional Companions Fields */}
              {status === "CONFIRMED" && (
                <div className="form-group">
                  <label className="form-label" htmlFor="additional-count">
                    Quantos acompanhantes trará com você?
                  </label>
                  <input
                    type="number"
                    id="additional-count"
                    className="form-control"
                    min={0}
                    value={additionalCount}
                    onChange={(e) => {
                      const valStr = e.target.value;
                      if (valStr === "") {
                        setAdditionalCount("");
                      } else {
                        const val = parseInt(valStr, 10);
                        setAdditionalCount(isNaN(val) ? 0 : Math.max(0, val));
                      }
                    }}
                    disabled={submitting}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="rsvp-notes">Observações ou Recado aos noivos</label>
                <textarea
                  id="rsvp-notes"
                  className="form-control"
                  rows={3}
                  placeholder="Deixe uma mensagem ou informe restrições alimentares (opcional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={submitting}
                  style={{ resize: "vertical", fontFamily: "var(--font-sans)" }}
                />
              </div>

              {searchError && (
                <div style={{ color: "var(--color-danger)", fontSize: "0.85rem", marginBottom: "1rem", textAlign: "left" }}>
                  ⚠️ {searchError}
                </div>
              )}

              <div style={{ display: "flex", gap: "1rem" }}>
                {!initialGuest && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setGuest(null);
                      setSearchError(null);
                    }}
                    disabled={submitting}
                    style={{ flex: 1 }}
                  >
                    Voltar
                  </button>
                )}
                
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ flex: 2 }}
                >
                  {submitting ? "Enviando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: "1rem" }}>
        <Link href="/" style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", textDecoration: "underline" }}>
          Voltar para o site principal
        </Link>
      </div>
    </div>
  );
}
