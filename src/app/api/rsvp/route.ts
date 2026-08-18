import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { guestId, status, confirmedAdditionalGuests, confirmedNames, notes } = body;

    if (!guestId) {
      return NextResponse.json(
        { message: "ID do convidado é obrigatório." },
        { status: 400 }
      );
    }

    if (status !== "CONFIRMED" && status !== "DECLINED") {
      return NextResponse.json(
        { message: "Status inválido. Escolha Confirmado ou Recusado." },
        { status: 400 }
      );
    }

    // Fetch the guest record to validate restrictions
    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
    });

    if (!guest) {
      return NextResponse.json(
        { message: "Convidado não encontrado." },
        { status: 404 }
      );
    }

    // Server-side validation for additional guests count
    let additionalGuestsCount = 0;
    let names = null;

    if (status === "CONFIRMED") {
      additionalGuestsCount = parseInt(confirmedAdditionalGuests || "0", 10);
      if (isNaN(additionalGuestsCount) || additionalGuestsCount < 0) {
        return NextResponse.json(
          { message: "Quantidade de acompanhantes inválida." },
          { status: 400 }
        );
      }

      names = confirmedNames ? confirmedNames.trim() : null;
    }

    const updateData: any = {
      status,
      confirmedAdditionalGuests: additionalGuestsCount,
      confirmedNames: names,
      confirmedAt: new Date(),
    };

    if (notes && notes.trim() !== "") {
      updateData.notes = notes.trim();
    }

    // Update guest confirmation in database
    await prisma.guest.update({
      where: { id: guestId },
      data: updateData,
    });

    const successMessage =
      status === "CONFIRMED"
        ? "Presença confirmada! Será uma alegria celebrar esse momento com você. ❤️"
        : "Presença atualizada. Lamentamos que não possa comparecer, mas agradecemos por nos avisar! ❤️";

    return NextResponse.json({ message: successMessage });
  } catch (error) {
    console.error("Error submitting RSVP:", error);
    return NextResponse.json(
      { message: "Erro interno no servidor ao salvar a confirmação." },
      { status: 500 }
    );
  }
}
