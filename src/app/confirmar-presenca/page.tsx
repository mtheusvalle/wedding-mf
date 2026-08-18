import { prisma } from "@/lib/db";
import RSVPForm from "@/components/RSVPForm";
import type { Metadata } from "next";

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const config = await prisma.weddingConfig.findUnique({
    where: { id: "global" },
  });
  const bride = config?.brideName || "Maria";
  const groom = config?.groomName || "João";
  return {
    title: `Confirmar Presença | Casamento de ${bride} & ${groom}`,
    description: "Por favor, confirme sua presença em nosso casamento.",
  };
}

interface PageProps {
  searchParams: Promise<{ convite?: string }>;
}

export default async function RSVPPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const code = resolvedSearchParams.convite;

  let guest = null;
  if (code) {
    guest = await prisma.guest.findUnique({
      where: { code: code.trim().toLowerCase() },
    });
  }

  const dbConfig = await prisma.weddingConfig.findUnique({
    where: { id: "global" },
  });

  const finalConfig = dbConfig || {
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
    timeline: "[]",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return (
    <main style={{ backgroundColor: "var(--color-bg-alt)", minHeight: "100vh", padding: "4rem 1rem" }}>
      <div className="container">
        <RSVPForm
          initialGuest={
            guest
              ? {
                  id: guest.id,
                  name: guest.name,
                  phone: guest.phone,
                  code: guest.code,
                  allowedAdditionalGuests: guest.allowedAdditionalGuests,
                  confirmedAdditionalGuests: guest.confirmedAdditionalGuests,
                  confirmedNames: guest.confirmedNames,
                  status: guest.status,
                  notes: guest.notes,
                }
              : null
          }
          weddingConfig={{
            brideName: finalConfig.brideName,
            groomName: finalConfig.groomName,
            weddingDate: finalConfig.weddingDate.toISOString(),
            ceremonyPlace: finalConfig.ceremonyPlace,
            ceremonyAddress: finalConfig.ceremonyAddress,
            ceremonyMapsUrl: finalConfig.ceremonyMapsUrl,
            partyPlace: finalConfig.partyPlace,
            partyAddress: finalConfig.partyAddress,
            partyMapsUrl: finalConfig.partyMapsUrl,
            storyImage: finalConfig.storyImage,
          }}
        />
      </div>
    </main>
  );
}
