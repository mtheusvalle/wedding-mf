import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_PRISMA_URL;

if (!connectionString) {
  console.error("Nenhuma URL de conexão encontrada (DATABASE_URL, POSTGRES_URL_NON_POOLING ou POSTGRES_PRISMA_URL). Seed abortado.");
  process.exit(1);
}

// Decode prisma+postgres connection string to direct postgres URL if necessary
function getDirectDatabaseUrl(urlStr: string): string {
  if (urlStr.startsWith("prisma+postgres://")) {
    try {
      const url = new URL(urlStr);
      const apiKey = url.searchParams.get("api_key");
      if (apiKey) {
        const decoded = Buffer.from(apiKey, "base64").toString("utf-8");
        const parsed = JSON.parse(decoded);
        if (parsed.databaseUrl) {
          console.log("Decoded local Prisma Postgres connection URL:", parsed.databaseUrl.split("@")[1]);
          return parsed.databaseUrl;
        }
      }
    } catch (e) {
      console.warn("Failed to decode prisma+postgres api_key:", e);
    }
  }
  return urlStr;
}

const directUrl = getDirectDatabaseUrl(connectionString);
const pool = new pg.Pool({ connectionString: directUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Verificando estado do banco de dados para o seed...");

  // Verificar se a configuração já existe no banco
  const configCount = await prisma.weddingConfig.count();
  if (configCount > 0) {
    console.log("O banco de dados já possui configurações cadastradas. Pulando carga inicial para preservar seus dados.");
    return;
  }

  console.log("Banco de dados vazio. Inicializando carga de sementes padrão...");

  // 2. Set up default Wedding Configuration
  const weddingDate = new Date("2027-05-15T16:00:00Z"); // May 15, 2027 at 16:00 UTC
  
  await prisma.weddingConfig.create({
    data: {
      id: "global",
      brideName: "Maria Silva",
      groomName: "João Santos",
      weddingDate,
      ceremonyPlace: "Paróquia Nossa Senhora do Brasil",
      ceremonyAddress: "Praça Nossa Sra. do Brasil, 01 - Jardim América, São Paulo - SP",
      ceremonyMapsUrl: "https://maps.google.com/?q=Paróquia+Nossa+Senhora+do+Brasil",
      partyPlace: "Espaço Quintal",
      partyAddress: "Av. Angélica, 2435 - Consolação, São Paulo - SP",
      partyMapsUrl: "https://maps.google.com/?q=Espaço+Quintal+Av+Angélica",
      storyTitle: "Como tudo começou...",
      storyText: "Nos conhecemos na faculdade em 2018. O que começou com uma amizade sincera nas aulas de engenharia logo se transformou em algo maior. Entre risadas, estudos de última hora e planos para o futuro, percebemos que não queríamos mais andar separados. Sete anos depois, estamos prontos para dar o passo mais importante das nossas vidas!",
      storyImage: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800", // Romantic placeholder image
      heroImage: "https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=1200", // Main top background image
      pixKey: "chave-pix-noivos@email.com",
      pixQrCode: "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&q=80&w=400",
      timeline: JSON.stringify([
        { time: "16:00", title: "Cerimônia", description: "Celebração religiosa na paróquia." },
        { time: "17:30", title: "Recepção & Coquetel", description: "Chegada dos convidados ao Espaço Quintal." },
        { time: "19:00", title: "Jantar", description: "Serviço de buffet completo." },
        { time: "21:00", title: "Abertura da Pista", description: "Comemoração e festa até tarde!" }
      ])
    }
  });
  console.log("Wedding configuration seeded.");

  // 3. Set up typical wedding gifts
  const gifts = [
    {
      name: "Jantar Romântico na Lua de Mel",
      description: "Um jantar especial para celebrarmos a nossa primeira noite oficial de casados no destino da lua de mel.",
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400",
      price: 25000 // R$ 250,00
    },
    {
      name: "Diária de Hotel na Praia",
      description: "Contribuição para uma diária relaxante de frente para o mar.",
      image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&q=80&w=400",
      price: 50000 // R$ 500,00
    },
    {
      name: "Passeio de Barco ao Pôr do Sol",
      description: "Passeio inesquecível de catamarã para contemplarmos o pôr do sol na praia.",
      image: "https://images.unsplash.com/photo-1505080856163-267598c30c2c?auto=format&fit=crop&q=80&w=400",
      price: 35000 // R$ 350,00
    },
    {
      name: "Jogo de Panelas Antiaderentes",
      description: "Conjunto completo de panelas de cerâmica premium para a nossa cozinha.",
      image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=400",
      price: 45000 // R$ 450,00
    },
    {
      name: "Cafeteira Nespresso com Espumador",
      description: "Para nos ajudar a acordar felizes e dispostos em todas as manhãs.",
      image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400",
      price: 30000 // R$ 300,00
    },
    {
      name: "Aspirador Robô Inteligente",
      description: "Para manter a casa limpa enquanto passamos mais tempo curtindo um ao outro.",
      image: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&q=80&w=400",
      price: 60000 // R$ 600,00
    },
    {
      name: "Kit de Taças de Cristal",
      description: "Para brindarmos os momentos importantes e recebermos visitas especiais.",
      image: "https://images.unsplash.com/photo-1574926053821-79c5e338a933?auto=format&fit=crop&q=80&w=400",
      price: 18000 // R$ 180,00
    },
    {
      name: "Piquenique Romântico no Parque",
      description: "Uma tarde descontraída com cesta cheia de delícias e um bom vinho.",
      image: "https://images.unsplash.com/photo-1464226184884-fa280b87c3a9?auto=format&fit=crop&q=80&w=400",
      price: 15000 // R$ 150,00
    }
  ];

  for (const gift of gifts) {
    await prisma.gift.create({ data: gift });
  }
  console.log("Sample gifts seeded.");

  // 4. Set up some sample guests
  const guests = [
    {
      name: "João da Silva",
      phone: "11999999999",
      code: "joao123",
      allowedAdditionalGuests: 1,
      status: "PENDING"
    },
    {
      name: "Maria de Souza",
      phone: "11988888888",
      code: "maria456",
      allowedAdditionalGuests: 2,
      status: "PENDING"
    },
    {
      name: "Família Barbosa",
      phone: "11977777777",
      code: "barbosa77",
      allowedAdditionalGuests: 4,
      status: "PENDING"
    },
    {
      name: "Pedro Oliveira",
      phone: "11966666666",
      code: "pedro789",
      allowedAdditionalGuests: 0,
      status: "PENDING"
    },
    {
      name: "Ana Santos",
      phone: "11955555555",
      code: "ana321",
      allowedAdditionalGuests: 3,
      status: "PENDING"
    }
  ];

  for (const guest of guests) {
    await prisma.guest.create({ data: guest });
  }
  console.log("Sample guests seeded.");

  // 5. Set up default gallery images
  const galleryImages = [
    { url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800", caption: "Caminhando juntos" },
    { url: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&q=80&w=800", caption: "De mãos dadas" },
    { url: "https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=800", caption: "Pôr do sol" },
    { url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80&w=800", caption: "Abraço" },
    { url: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800", caption: "Sorrisos" },
    { url: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&q=80&w=800", caption: "Detalhes" }
  ];

  for (const img of galleryImages) {
    await prisma.galleryImage.create({ data: img });
  }
  console.log("Gallery images seeded.");

  console.log("Seeding complete successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
