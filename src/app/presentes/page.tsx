import { prisma } from "@/lib/db";
import Header from "@/components/Header";
import GiftList from "@/components/GiftList";
import type { Metadata } from "next";
import styles from "../page.module.css";

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const config = await prisma.weddingConfig.findUnique({
    where: { id: "global" },
  });
  const bride = config?.brideName || "Maria";
  const groom = config?.groomName || "João";
  return {
    title: `Lista de Presentes | Casamento de ${bride} & ${groom}`,
    description: "Confira nossa lista de presentes de casamento e contribua com cotas simbólicas de lua de mel.",
  };
}

export default async function PresentesPage() {
  // 1. Fetch wedding config for header/footer names
  let config = await prisma.weddingConfig.findUnique({
    where: { id: "global" },
  });

  if (!config) {
    config = {
      id: "global",
      brideName: "Maria",
      groomName: "João",
      weddingDate: new Date("2027-05-15T16:00:00Z"),
      ceremonyPlace: "Paróquia Nossa Senhora do Brasil",
      ceremonyAddress: "Praça Nossa Sra. do Brasil, 01 - Jardim América, São Paulo - SP",
      ceremonyMapsUrl: "https://maps.google.com/?q=Paróquia+Nossa+Senhora+do+Brasil",
      partyPlace: "Espaço Quintal",
      partyAddress: "Av. Angélica, 2435 - Consolação, São Paulo - SP",
      partyMapsUrl: "https://maps.google.com/?q=Espaço+Quintal+Av+Angélica",
      storyTitle: "Como tudo começou...",
      storyText: "Nos conhecemos na faculdade em 2018. O que começou com uma amizade sincera nas aulas de engenharia logo se transformou em algo maior. Sete anos depois, estamos prontos para dar o passo mais importante das nossas vidas!",
      storyImage: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800",
      heroImage: "https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=1200",
      pixKey: "seu-pix@email.com",
      pixQrCode: "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&q=80&w=400",
      timeline: "[]",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // 2. Fetch ALL active gifts from database
  const gifts = await prisma.gift.findMany({
    where: { active: true },
    orderBy: { price: "asc" },
  });

  const brideAndGroom = `${config.brideName} & ${config.groomName}`;

  return (
    <div className={styles.main}>
      {/* Header */}
      <Header names={brideAndGroom} />

      {/* Gifts Banner Header */}
      <section 
        className={styles.hero} 
        style={{ 
          height: "40vh", 
          minHeight: "300px",
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          textAlign: "center"
        }}
      >
        <div
          className={styles.heroBg}
          style={{ 
            backgroundImage: `url(${config.heroImage})`,
            filter: "brightness(0.65)"
          }}
        />
        <div className={styles.heroContent} style={{ padding: "0 1rem" }}>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "2.75rem", color: "var(--color-white)", marginBottom: "0.5rem" }}>
            Lista de Presentes
          </h1>
          <p style={{ fontStyle: "italic", color: "var(--color-white)", opacity: 0.9, fontSize: "1.1rem" }}>
            Queridos convidados, sua presença é nosso melhor presente. Caso queira nos presentear, confira nossa lista abaixo!
          </p>
        </div>
      </section>

      {/* Gifts List Section */}
      <section className="section" style={{ backgroundColor: "var(--color-bg-alt)", minHeight: "60vh" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <p style={{ color: "var(--color-text-muted)", maxWidth: "700px", margin: "0 auto 3rem", fontSize: "0.95rem" }}>
            Selecione uma das opções simbólicas de cotas abaixo para nos ajudar com o enxoval e despesas de nossa lua de mel. 
            A transferência é feita de forma simples e segura via Pix.
          </p>

          {/* Render all gifts */}
          <GiftList initialGifts={gifts} />
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerLogo}>{brideAndGroom}</div>
          <p>
            Feito com <span className={styles.footerHeart}>❤️</span> para celebrar este grande dia.
          </p>
          <p style={{ fontSize: "0.75rem", marginTop: "1rem", opacity: "0.6" }}>
            © {new Date().getFullYear()} {config.brideName} & {config.groomName}. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
