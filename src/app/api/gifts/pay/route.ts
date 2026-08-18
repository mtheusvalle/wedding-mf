import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { giftId, buyerName, amount, message } = body;

    if (!giftId || !buyerName || amount === undefined) {
      return NextResponse.json(
        { message: "ID do presente, nome do comprador e valor da contribuição são obrigatórios." },
        { status: 400 }
      );
    }

    const contributionCents = parseInt(amount, 10);
    if (isNaN(contributionCents) || contributionCents <= 0) {
      return NextResponse.json(
        { message: "Valor de contribuição inválido." },
        { status: 400 }
      );
    }

    // 1. Fetch the gift from database to guarantee authentic details
    const gift = await prisma.gift.findUnique({
      where: { id: giftId },
    });

    if (!gift) {
      return NextResponse.json(
        { message: "Presente não localizado." },
        { status: 404 }
      );
    }

    // 2. Validate that the contribution amount does not exceed the total gift price
    if (contributionCents > gift.price) {
      return NextResponse.json(
        { message: `O valor da contribuição não pode exceder o valor total do presente (${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(gift.price / 100)}).` },
        { status: 400 }
      );
    }

    // 3. Create a PENDING transaction with manual message
    const transaction = await prisma.transaction.create({
      data: {
        giftId: gift.id,
        buyerName: buyerName.trim(),
        message: message ? message.trim() : null,
        amount: contributionCents,
        status: "PENDING",
        gateway: "PIX",
      },
    });

    console.log(`Manual Pix transaction created: ${transaction.id} with message from ${buyerName}`);

    return NextResponse.json({ success: true, transactionId: transaction.id });
  } catch (error) {
    console.error("Error creating payment transaction:", error);
    return NextResponse.json(
      { message: "Erro interno no servidor ao processar o presente." },
      { status: 500 }
    );
  }
}
