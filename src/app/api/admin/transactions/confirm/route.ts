import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { transactionId, status } = body;

    if (!transactionId) {
      return NextResponse.json(
        { message: "ID da transação é obrigatório." },
        { status: 400 }
      );
    }

    if (status !== "PAID" && status !== "PENDING" && status !== "CANCELLED") {
      return NextResponse.json(
        { message: "Status inválido." },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json(
        { message: "Transação não encontrada." },
        { status: 404 }
      );
    }

    // Update the transaction status manually
    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status,
        transactionId: status === "PAID" ? `pix_manual_${Date.now()}` : null,
        updatedAt: new Date(),
      },
    });

    console.log(`Transaction ${transactionId} manual status update: ${status}`);

    return NextResponse.json({
      success: true,
      message: `Status da transação atualizado para ${status === "PAID" ? "Confirmado" : status} com sucesso.`,
      transaction: updated,
    });
  } catch (error) {
    console.error("Error confirming manual transaction:", error);
    return NextResponse.json(
      { message: "Erro interno no servidor ao atualizar a transação." },
      { status: 500 }
    );
  }
}
