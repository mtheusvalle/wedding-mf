import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export const revalidate = 0;

// GET: Retrieve all gifts and transactions for admin management
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const gifts = await prisma.gift.findMany({
      orderBy: { price: "asc" },
    });

    const transactions = await prisma.transaction.findMany({
      include: {
        gift: true,
        guest: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ gifts, transactions });
  } catch (error) {
    console.error("Error fetching gifts data:", error);
    return NextResponse.json({ message: "Erro ao buscar presentes e transações." }, { status: 500 });
  }
}

// POST: Add a new gift to the registry
export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, image, price } = body;

    if (!name || !description || !image || price === undefined) {
      return NextResponse.json(
        { message: "Nome, descrição, imagem e preço são obrigatórios." },
        { status: 400 }
      );
    }

    const gift = await prisma.gift.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        image: image.trim(),
        price: parseInt(price, 10),
        active: true,
      },
    });

    return NextResponse.json(gift);
  } catch (error) {
    console.error("Error creating gift:", error);
    return NextResponse.json({ message: "Erro ao criar presente." }, { status: 500 });
  }
}

// PUT: Update an existing gift in the registry
export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, description, image, price, active } = body;

    if (!id || !name || !description || !image || price === undefined) {
      return NextResponse.json(
        { message: "Dados incompletos para atualização." },
        { status: 400 }
      );
    }

    const updated = await prisma.gift.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description.trim(),
        image: image.trim(),
        price: parseInt(price, 10),
        active: active ?? true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating gift:", error);
    return NextResponse.json({ message: "Erro ao atualizar presente." }, { status: 500 });
  }
}

// DELETE: Delete a gift from the registry
export async function DELETE(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "ID do presente é obrigatório." }, { status: 400 });
    }

    await prisma.gift.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Presente excluído com sucesso." });
  } catch (error) {
    console.error("Error deleting gift:", error);
    return NextResponse.json({ message: "Erro ao excluir presente." }, { status: 500 });
  }
}
