"use client";

import { useState } from "react";
import styles from "@/app/page.module.css";

interface Gift {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  active: boolean;
}

interface GiftListProps {
  initialGifts: Gift[];
}

export default function GiftList({ initialGifts }: GiftListProps) {
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  
  // Form states
  const [buyerName, setBuyerName] = useState("");
  const [message, setMessage] = useState(""); // Message/note to the couple
  
  // Split gift states
  const [paymentType, setPaymentType] = useState<"FULL" | "PARTIAL">("FULL");
  const [customAmount, setCustomAmount] = useState(""); // Represented in BRL string, e.g. "50.00"

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = (gift: Gift) => {
    setSelectedGift(gift);
    setError(null);
    setBuyerName("");
    setMessage("");
    setPaymentType("FULL");
    setCustomAmount("");
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    if (loading) return; // Block close while processing
    setSelectedGift(null);
    document.body.style.overflow = "unset";
  };

  const formatPrice = (priceCents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(priceCents / 100);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGift) return;

    if (!buyerName.trim()) {
      setError("Por favor, informe seu nome completo.");
      return;
    }

    // Determine final amount in cents
    let finalAmountCents = selectedGift.price;
    if (paymentType === "PARTIAL") {
      const parsedAmount = parseFloat(customAmount.replace(",", "."));
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setError("Por favor, insira um valor válido de contribuição.");
        return;
      }
      finalAmountCents = Math.round(parsedAmount * 100);
    }

    if (finalAmountCents <= 0) {
      setError("O valor da contribuição deve ser maior que zero.");
      return;
    }

    if (finalAmountCents > selectedGift.price) {
      setError(`O valor de contribuição não pode exceder o valor total do presente (${formatPrice(selectedGift.price)}).`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/gifts/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          giftId: selectedGift.id,
          buyerName,
          amount: finalAmountCents,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao salvar intenção de presente.");
      }

      if (data.transactionId) {
        // Redirect to Pix instructions page
        window.location.href = `/obrigado?id=${data.transactionId}`;
      } else {
        throw new Error("Transação não pôde ser inicializada.");
      }
    } catch (err: any) {
      console.error("Error creating payment transaction:", err);
      setError(err.message || "Não foi possível conectar ao servidor. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div>
      <div className={styles.giftsGrid}>
        {initialGifts.map((gift) => (
          <div key={gift.id} className={styles.giftCard}>
            <img
              src={gift.image}
              alt={gift.name}
              className={styles.giftImg}
              loading="lazy"
            />
            <div className={gift.active ? styles.giftBody : `${styles.giftBody} ${styles.giftBodyInactive}`}>
              <h3 className={styles.giftName}>{gift.name}</h3>
              <p className={styles.giftDesc}>{gift.description}</p>
              <div className={styles.giftPrice}>{formatPrice(gift.price)}</div>
              <button
                className="btn btn-primary btn-block"
                onClick={() => openModal(gift)}
              >
                Presentear
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedGift && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <button className="modal-close" onClick={closeModal} disabled={loading}>
              &times;
            </button>
            
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", marginBottom: "1rem", color: "var(--color-primary-dark)" }}>
              Presentear Noivos
            </h3>

            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "1rem" }}>
              <img
                src={selectedGift.image}
                alt={selectedGift.name}
                style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "4px" }}
              />
              <div style={{ textAlign: "left" }}>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "600" }}>{selectedGift.name}</h4>
                <p style={{ fontSize: "1.2rem", fontWeight: "600", color: "var(--color-primary)", marginTop: "0.25rem" }}>
                  {formatPrice(selectedGift.price)}
                </p>
              </div>
            </div>

            <form onSubmit={handleCheckout}>
              {/* Split Gift / Partial payment Selector */}
              <div className="form-group">
                <label className="form-label">Como deseja presentear? *</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="payment-type"
                      checked={paymentType === "FULL"}
                      onChange={() => setPaymentType("FULL")}
                      disabled={loading}
                      style={{ width: "16px", height: "16px", accentColor: "var(--color-primary)" }}
                    />
                    <span>Pagar o valor integral: <strong>{formatPrice(selectedGift.price)}</strong></span>
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="payment-type"
                      checked={paymentType === "PARTIAL"}
                      onChange={() => setPaymentType("PARTIAL")}
                      disabled={loading}
                      style={{ width: "16px", height: "16px", accentColor: "var(--color-primary)" }}
                    />
                    <span>Contribuir com outro valor (cota parcial)</span>
                  </label>
                </div>
              </div>

              {/* Conditional custom amount input */}
              {paymentType === "PARTIAL" && (
                <div className="form-group" style={{ animation: "fadeIn 0.3s forwards" }}>
                  <label className="form-label" htmlFor="custom-amount">Qual valor deseja presentear? (R$)*</label>
                  <input
                    type="number"
                    id="custom-amount"
                    className="form-control"
                    placeholder="Ex: 100.00"
                    min="1"
                    max={selectedGift.price / 100}
                    step="0.01"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem", display: "block" }}>
                    Escolha qualquer valor entre R$ 1,00 e o valor total do presente.
                  </span>
                </div>
              )}

              <div style={{ borderTop: "1px solid var(--color-border)", margin: "1rem 0", paddingTop: "1rem" }} />

              <div className="form-group">
                <label className="form-label" htmlFor="buyer-name">Seu Nome Completo *</label>
                <input
                  type="text"
                  id="buyer-name"
                  className="form-control"
                  placeholder="Ex: João da Silva"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="buyer-message">Recado para os noivos (Opcional)</label>
                <textarea
                  id="buyer-message"
                  className="form-control"
                  placeholder="Escreva uma mensagem carinhosa para os noivos..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={loading}
                  rows={3}
                  style={{ resize: "none", fontFamily: "inherit" }}
                />
              </div>

              {error && (
                <div style={{ color: "var(--color-danger)", fontSize: "0.85rem", marginBottom: "1rem", textAlign: "left" }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
              >
                {loading ? "Processando..." : "Confirmar Presente & Ver Pix"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
