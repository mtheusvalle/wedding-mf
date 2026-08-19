import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import PixClient from "./PixClient";
import { generatePixPayload } from "@/lib/pix";
import type { Metadata } from "next";

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const config = await prisma.weddingConfig.findUnique({
    where: { id: "global" },
  });
  const bride = config?.brideName || "Maria";
  const groom = config?.groomName || "João";
  return {
    title: `Quase Lá! | Casamento de ${bride} & ${groom}`,
    description: "Instruções de pagamento Pix para o seu presente de casamento.",
  };
}

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function ThankYouPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const id = resolvedSearchParams.id;

  if (!id) {
    return notFound();
  }

  // 1. Fetch transaction and gift details
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { gift: true },
  });

  if (!transaction) {
    return notFound();
  }

  // 2. Fetch Pix configs
  let config = await prisma.weddingConfig.findUnique({
    where: { id: "global" },
  });

  if (!config) {
    config = {
      id: "global",
      brideName: "Maria",
      groomName: "João",
      weddingDate: new Date("2027-05-15T16:00:00Z"),
      ceremonyPlace: "",
      ceremonyAddress: "",
      ceremonyMapsUrl: "",
      partyPlace: "",
      partyAddress: "",
      partyMapsUrl: "",
      storyTitle: "",
      storyText: "",
      storyImage: "",
      heroImage: "",
      pixKey: "seu-pix@email.com",
      pixQrCode: "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&q=80&w=400",
      timeline: "[]",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Generate the dynamic Pix Copia e Cola Code
  const pixKey = config.pixKey || "seu-pix@email.com";
  const amountBRL = transaction.amount / 100;
  const bride = config.brideName || "Noiva";
  const groom = config.groomName || "Noivo";
  const merchantName = `${bride} e ${groom}`;
  
  const pixCode = generatePixPayload({
    key: pixKey,
    amount: amountBRL,
    merchantName: merchantName,
    txId: transaction.id.replace(/-/g, "").substring(0, 20),
  });

  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(transaction.amount / 100);

  const isPending = transaction.status === "PENDING";

  return (
    <main
      style={{
        backgroundColor: "var(--color-bg-alt)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div className="container" style={{ maxWidth: "550px", textAlign: "center" }}>
        <div className="card" style={{ padding: "3rem 2.25rem" }}>
          
          {isPending ? (
            /* --- STATE 1: PENDING PIX --- */
            <div>
              <div style={{ fontSize: "4.5rem", marginBottom: "1rem" }}>⏳💝</div>
              
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", color: "var(--color-primary-dark)", marginBottom: "1rem" }}>
                Quase lá!
              </h2>
              
              <p style={{ fontSize: "1.05rem", color: "var(--color-text-main)", marginBottom: "1.5rem" }}>
                Olá, <strong>{transaction.buyerName}</strong>! Para confirmar sua contribuição de <strong>{formattedAmount}</strong> para o presente <strong>{transaction.gift.name}</strong>, faça a transferência Pix:
              </p>

              {/* Dynamic QR Code generated from our API */}
              <div style={{ marginBottom: "1.5rem" }}>
                <img
                  src={`/api/gifts/pix-qrcode?transactionId=${transaction.id}`}
                  alt="QRCode Pix"
                  style={{
                    width: "220px",
                    height: "220px",
                    objectFit: "contain",
                    margin: "0 auto",
                    display: "block",
                    border: "1px solid var(--color-border)",
                    padding: "0.5rem",
                    borderRadius: "6px",
                    backgroundColor: "var(--color-white)"
                  }}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.5rem", display: "block" }}>
                  Abra o app do seu banco e escaneie o código acima
                </span>
              </div>

              {/* Dynamic Pix Copy and paste key component */}
              <PixClient pixCode={pixCode} />

              <div
                style={{
                  textAlign: "left",
                  fontSize: "0.85rem",
                  color: "var(--color-text-muted)",
                  backgroundColor: "var(--color-bg-alt)",
                  borderRadius: "6px",
                  padding: "1rem 1.25rem",
                  margin: "1.5rem 0",
                  border: "1px solid var(--color-border)",
                }}
              >
                <h4 style={{ fontWeight: 600, color: "var(--color-text-main)", marginBottom: "0.5rem" }}>Instruções:</h4>
                <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <li>Copie a chave Pix acima ou escaneie o QR Code.</li>
                  <li>Insira o valor exato de <strong>{formattedAmount}</strong>.</li>
                  <li>Realize a transferência bancária.</li>
                  <li>Não é necessário enviar comprovante. O casal confirmará manualmente o recebimento no painel!</li>
                </ul>
              </div>

              <Link href="/" className="btn btn-primary btn-block">
                Concluí o Pix, Voltar ao Site
              </Link>
            </div>
          ) : (
            /* --- STATE 2: PAID SUCCESS --- */
            <div>
              <div style={{ fontSize: "5rem", marginBottom: "1.5rem" }}>🎁❤️</div>
              
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", color: "var(--color-primary-dark)", marginBottom: "1rem" }}>
                Muito Obrigado!
              </h2>
              
              <p style={{ fontSize: "1.1rem", color: "var(--color-text-main)", marginBottom: "1.5rem" }}>
                Olá, <strong>{transaction.buyerName}</strong>! Confirmamos com sucesso o recebimento da sua contribuição de <strong>{formattedAmount}</strong> para <strong>{transaction.gift.name}</strong>.
              </p>

              <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginBottom: "2rem", fontStyle: "italic" }}>
                "Sua generosidade enche nossos corações de alegria e nos ajuda a construir nossa história!"
              </p>

              <Link href="/" className="btn btn-primary btn-block">
                Voltar ao Site Principal
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
