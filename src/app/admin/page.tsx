import { prisma } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import AdminLogin from "@/components/AdminLogin";
import AdminDashboard from "@/components/AdminDashboard";
import type { Metadata } from "next";

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const config = await prisma.weddingConfig.findUnique({
    where: { id: "global" },
  });
  const bride = config?.brideName || "Maria";
  const groom = config?.groomName || "João";
  return {
    title: `Painel de Controle | Casamento de ${bride} & ${groom}`,
    description: "Gerenciamento de convidados, RSVP, presentes e finanças do casamento.",
  };
}

export default async function AdminPage() {
  // 1. Check if the user is authenticated on the server
  const isAuth = await isAuthenticated();

  if (!isAuth) {
    return <AdminLogin />;
  }

  // 2. Pre-fetch and serialize all required data for the Dashboard
  const rawGuests = await prisma.guest.findMany({
    orderBy: { name: "asc" },
  });

  const guests = rawGuests.map((g) => ({
    id: g.id,
    name: g.name,
    phone: g.phone,
    code: g.code,
    allowedAdditionalGuests: g.allowedAdditionalGuests,
    confirmedAdditionalGuests: g.confirmedAdditionalGuests,
    confirmedNames: g.confirmedNames,
    status: g.status,
    notes: g.notes,
    confirmedAt: g.confirmedAt ? g.confirmedAt.toISOString() : null,
    createdAt: g.createdAt.toISOString(),
  }));

  const rawGifts = await prisma.gift.findMany({
    orderBy: { price: "asc" },
  });

  const gifts = rawGifts.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    image: g.image,
    price: g.price,
    active: g.active,
  }));

  const rawTransactions = await prisma.transaction.findMany({
    include: {
      gift: true,
      guest: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const transactions = rawTransactions.map((t) => ({
    id: t.id,
    giftId: t.giftId,
    gift: {
      id: t.gift.id,
      name: t.gift.name,
      description: t.gift.description,
      image: t.gift.image,
      price: t.gift.price,
      active: t.gift.active,
    },
    guestId: t.guestId,
    guest: t.guest
      ? {
          id: t.guest.id,
          name: t.guest.name,
          phone: t.guest.phone,
          code: t.guest.code,
          allowedAdditionalGuests: t.guest.allowedAdditionalGuests,
          confirmedAdditionalGuests: t.guest.confirmedAdditionalGuests,
          confirmedNames: t.guest.confirmedNames,
          status: t.guest.status,
          notes: t.guest.notes,
          confirmedAt: t.guest.confirmedAt ? t.guest.confirmedAt.toISOString() : null,
          createdAt: t.guest.createdAt.toISOString(),
        }
      : null,
    buyerName: t.buyerName,
    buyerPhone: t.buyerPhone,
    buyerEmail: t.buyerEmail,
    message: t.message,
    amount: t.amount,
    status: t.status,
    gateway: t.gateway,
    transactionId: t.transactionId,
    createdAt: t.createdAt.toISOString(),
  }));

  const rawGallery = await prisma.galleryImage.findMany({
    orderBy: { createdAt: "desc" },
  });

  const gallery = rawGallery.map((img) => ({
    id: img.id,
    url: img.url,
    caption: img.caption,
    active: img.active,
    createdAt: img.createdAt.toISOString(),
  }));

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

  const config = {
    brideName: finalConfig.brideName,
    groomName: finalConfig.groomName,
    weddingDate: finalConfig.weddingDate.toISOString(),
    ceremonyPlace: finalConfig.ceremonyPlace,
    ceremonyAddress: finalConfig.ceremonyAddress,
    ceremonyMapsUrl: finalConfig.ceremonyMapsUrl,
    partyPlace: finalConfig.partyPlace,
    partyAddress: finalConfig.partyAddress,
    partyMapsUrl: finalConfig.partyMapsUrl,
    storyTitle: finalConfig.storyTitle,
    storyText: finalConfig.storyText,
    storyImage: finalConfig.storyImage,
    heroImage: finalConfig.heroImage,
    pixKey: finalConfig.pixKey,
    pixQrCode: finalConfig.pixQrCode,
    timeline: finalConfig.timeline,
  };

  return (
    <AdminDashboard
      initialGuests={guests}
      initialGifts={gifts}
      initialTransactions={transactions}
      initialConfig={config}
      initialGallery={gallery}
    />
  );
}
