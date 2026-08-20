import { prisma } from "@/lib/db";
import Header from "@/components/Header";
import Countdown from "@/components/Countdown";
import Gallery from "@/components/Gallery";
import GiftList from "@/components/GiftList";
import Link from "next/link";
import styles from "./page.module.css";

// Prevent SSR caching so updates in Admin are reflected instantly
export const revalidate = 0;

export default async function Home() {
  // 1. Fetch wedding config from database
  let config = await prisma.weddingConfig.findUnique({
    where: { id: "global" },
  });

  // Fallback defaults if database config is empty
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
      timeline: JSON.stringify([
        { time: "16:00", title: "Cerimônia", description: "Celebração religiosa na paróquia." },
        { time: "17:30", title: "Recepção & Coquetel", description: "Chegada dos convidados ao local da festa." },
        { time: "19:00", title: "Jantar", description: "Serviço de buffet completo." },
        { time: "21:00", title: "Abertura da Pista", description: "Comemoração e festa até tarde!" },
      ]),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // 2. Fetch active gifts from database (limit to 8 for landing page)
  const gifts = await prisma.gift.findMany({
    where: { active: true },
    orderBy: { price: "asc" },
    take: 8,
  });

  // 3. Fetch active gallery images from database
  const galleryImages = await prisma.galleryImage.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });

  // Parse timeline
  let timelineItems = [];
  try {
    timelineItems = JSON.parse(config.timeline);
  } catch (e) {
    console.error("Failed to parse timeline JSON:", e);
  }

  const brideAndGroom = `${config.brideName} & ${config.groomName}`;
  const weddingDateFormatted = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(config.weddingDate));

  const weddingTimeFormatted = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(config.weddingDate));

  return (
    <div className={styles.main}>
      {/* Dynamic Header */}
      <Header names={`${config.brideName} & ${config.groomName}`} />

      {/* Hero Section */}
      <section id="noivos" className={styles.hero}>
        <div
          className={styles.heroBg}
          style={{ backgroundImage: `url(${config.heroImage})` }}
        />
        <div className={styles.heroContent}>
          <h1 className={styles.heroNames}>{brideAndGroom}</h1>
          <p className={styles.heroSub}>Salvem a Data</p>
          <div className={styles.heroDate}>
            {weddingDateFormatted} às {weddingTimeFormatted}h
          </div>

          {/* Countdown timer client component */}
          <Countdown weddingDate={config.weddingDate.toISOString()} />
        </div>
      </section>

      {/* Story Section */}
      <section id="nossa-historia" className="section" style={{ backgroundColor: "var(--color-bg-alt)" }}>
        <div className={`${styles.storyFlex} container`}>
          <div className={styles.storyContent}>
            <div className="section-title" style={{ textAlign: "left", marginBottom: "2rem" }}>
              <h2>{config.storyTitle}</h2>
              <p>Nossa jornada de amor e parceria</p>
            </div>
            <p className={styles.storyText}>{config.storyText}</p>
            <p className={styles.storyText} style={{ fontStyle: "italic", marginTop: "1rem" }}>
              "E de repente, toda canção de amor passou a ser sobre você."
            </p>
          </div>
          <div className={styles.storyFrame}>
            <img
              src={config.storyImage}
              alt="Foto do Casal"
              className={styles.storyImg}
            />
          </div>
        </div>
      </section>

      {/* Photos Gallery */}
      <section id="galeria" className="section">
        <div className="container">
          <div className="section-title">
            <h2>Galeria de Fotos</h2>
            <p>Momentos felizes eternizados</p>
          </div>

          {/* Photos Grid & Lightbox client component */}
          <Gallery images={galleryImages.map(img => ({
            id: img.id,
            url: img.url,
            caption: img.caption
          }))} />
        </div>
      </section>

      {/* Locations Section */}
      <section id="locais" className="section" style={{ backgroundColor: "var(--color-bg-alt)" }}>
        <div className="container">
          <div className="section-title">
            <h2>Onde e Quando</h2>
            <p>Detalhes importantes para o nosso grande dia</p>
          </div>

          <div className={styles.infoGrid}>
            {/* Ceremony Card */}
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>⛪</div>
              <h3 className={styles.infoTitle}>A Cerimônia</h3>
              <ul className={styles.infoDetails}>
                <li>
                  <strong>Local</strong>
                  {config.ceremonyPlace}
                </li>
                <li>
                  <strong>Horário</strong>
                  {weddingTimeFormatted}h
                </li>
                <li>
                  <strong>Endereço</strong>
                  {config.ceremonyAddress}
                </li>
              </ul>
              <a
                href={config.ceremonyMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                Como Chegar (Maps)
              </a>
            </div>

            {/* Reception/Party Card */}
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>🥂</div>
              <h3 className={styles.infoTitle}>A Recepção</h3>
              <ul className={styles.infoDetails}>
                <li>
                  <strong>Local</strong>
                  {config.partyPlace}
                </li>
                <li>
                  <strong>Horário</strong>
                  Imediatamente após a cerimônia
                </li>
                <li>
                  <strong>Endereço</strong>
                  {config.partyAddress}
                </li>
              </ul>
              <a
                href={config.partyMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                Como Chegar (Maps)
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section id="programacao" className="section">
        <div className="container">
          <div className="section-title">
            <h2>Programação</h2>
            <p>O cronograma do nosso dia dos sonhos</p>
          </div>

          <div className={styles.timeline}>
            {timelineItems.map((item: any, index: number) => (
              <div
                key={index}
                className={`${styles.timelineItem} ${index % 2 === 0 ? styles.timelineLeft : styles.timelineRight
                  }`}
              >
                <div className={styles.timelineContent}>
                  <span className={styles.timelineTime}>{item.time}</span>
                  <h4 className={styles.timelineTitle}>{item.title}</h4>
                  <p className={styles.timelineDesc}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gifts List Section */}
      <section id="lista-presentes" className="section" style={{ backgroundColor: "var(--color-bg-alt)" }}>
        <div className="container">
          <div className="section-title">
            <h2>Lista de Presentes</h2>
            <p>Sua presença é o maior presente, mas se quiser nos agradar...</p>
          </div>

          <p className={styles.giftsIntro}>
            Escolhemos alguns presentes simbólicos de cotas de lua de mel e contribuições para o nosso enxoval.
            Você pode presentear-nos com facilidade e segurança via Pix.
          </p>

          {/* Gifts Grid with Modal / Checkout client component */}
          <GiftList initialGifts={gifts} />

          <div style={{ textAlign: "center", marginTop: "3rem" }}>
            <Link href="/presentes" className="btn btn-primary" style={{ padding: "0.85rem 2.5rem", fontSize: "0.95rem" }}>
              Ver Lista Completa
            </Link>
          </div>
        </div>
      </section>

      {/* RSVP call to action */}
      <section className="section" style={{ background: "linear-gradient(to right, var(--color-primary), var(--color-primary-dark))", color: "var(--color-white)", textAlign: "center" }}>
        <div className="container">
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2.5rem", marginBottom: "1rem", color: "var(--color-white)" }}>
            Você vai celebrar com a gente?
          </h2>
          <p style={{ fontSize: "1.1rem", fontStyle: "italic", marginBottom: "2rem", opacity: "0.9" }}>
            Por favor, confirme sua presença até 30 dias antes do casamento para que possamos planejar tudo com carinho.
          </p>
          <Link href="/confirmar-presenca" className="btn btn-confirm-menu" style={{ padding: "1rem 3rem", fontSize: "1rem" }}>
            Confirmar Presença
          </Link>
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
            © {new Date().getFullYear()} Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
