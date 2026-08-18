import type { Metadata } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600", "700"],
});

import { prisma } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const config = await prisma.weddingConfig.findUnique({
    where: { id: "global" },
  });

  const bride = config?.brideName || "Maria";
  const groom = config?.groomName || "João";
  const title = `Casamento de ${bride} & ${groom}`;

  return {
    title,
    description: `Acompanhe todos os detalhes do nosso grande dia, confirme sua presença e confira nossa lista de presentes de ${bride} & ${groom}.`,
    openGraph: {
      title,
      description: `Você está convidado para celebrar esse momento conosco! Acesse para ver a programação, confirmar sua presença e ver a lista de presentes de ${bride} & ${groom}.`,
      url: "https://nosso-casamento.vercel.app",
      siteName: `${bride} & ${groom}`,
      images: [
        {
          url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200",
          width: 1200,
          height: 630,
          alt: `Casamento de ${bride} & ${groom}`,
        },
      ],
      locale: "pt-BR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: `Você está convidado para celebrar esse momento conosco! Acesse para ver a programação, confirmar sua presença e ver a lista de presentes de ${bride} & ${groom}.`,
      images: ["https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200"],
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${montserrat.variable}`}>
      <body className={montserrat.className}>{children}</body>
    </html>
  );
}
