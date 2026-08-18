import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      brideName,
      groomName,
      weddingDate,
      ceremonyPlace,
      ceremonyAddress,
      ceremonyMapsUrl,
      partyPlace,
      partyAddress,
      partyMapsUrl,
      storyTitle,
      storyText,
      storyImage,
      heroImage,
      pixKey,
      pixQrCode,
      timeline,
    } = body;

    if (!brideName || !groomName || !weddingDate) {
      return NextResponse.json(
        { message: "Nomes dos noivos e data do casamento são obrigatórios." },
        { status: 400 }
      );
    }

    // Parse and validate timeline if provided as array or string
    let timelineStr = timeline;
    if (Array.isArray(timeline)) {
      timelineStr = JSON.stringify(timeline);
    }

    const config = await prisma.weddingConfig.upsert({
      where: { id: "global" },
      update: {
        brideName: brideName.trim(),
        groomName: groomName.trim(),
        weddingDate: new Date(weddingDate),
        ceremonyPlace: ceremonyPlace?.trim() || "",
        ceremonyAddress: ceremonyAddress?.trim() || "",
        ceremonyMapsUrl: ceremonyMapsUrl?.trim() || "",
        partyPlace: partyPlace?.trim() || "",
        partyAddress: partyAddress?.trim() || "",
        partyMapsUrl: partyMapsUrl?.trim() || "",
        storyTitle: storyTitle?.trim() || "",
        storyText: storyText?.trim() || "",
        storyImage: storyImage?.trim() || "",
        heroImage: heroImage?.trim() || "",
        pixKey: pixKey?.trim() || "seu-pix@email.com",
        pixQrCode: pixQrCode?.trim() || "",
        timeline: timelineStr || "[]",
      },
      create: {
        id: "global",
        brideName: brideName.trim(),
        groomName: groomName.trim(),
        weddingDate: new Date(weddingDate),
        ceremonyPlace: ceremonyPlace?.trim() || "",
        ceremonyAddress: ceremonyAddress?.trim() || "",
        ceremonyMapsUrl: ceremonyMapsUrl?.trim() || "",
        partyPlace: partyPlace?.trim() || "",
        partyAddress: partyAddress?.trim() || "",
        partyMapsUrl: partyMapsUrl?.trim() || "",
        storyTitle: storyTitle?.trim() || "",
        storyText: storyText?.trim() || "",
        storyImage: storyImage?.trim() || "",
        heroImage: heroImage?.trim() || "",
        pixKey: pixKey?.trim() || "seu-pix@email.com",
        pixQrCode: pixQrCode?.trim() || "",
        timeline: timelineStr || "[]",
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error saving wedding config:", error);
    return NextResponse.json({ message: "Erro ao salvar as configurações." }, { status: 500 });
  }
}
