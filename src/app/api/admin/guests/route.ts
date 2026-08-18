import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export const revalidate = 0;

// GET: List all guests
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const guests = await prisma.guest.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(guests);
  } catch (error) {
    console.error("Error fetching guests:", error);
    return NextResponse.json({ message: "Erro ao buscar convidados." }, { status: 500 });
  }
}

// POST: Create a new guest
export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, phone, code, allowedAdditionalGuests } = body;

    if (!name || !phone || !code) {
      return NextResponse.json(
        { message: "Nome, telefone e código do convite são obrigatórios." },
        { status: 400 }
      );
    }

    // Check if code is unique
    const normalizedCode = code.trim().toLowerCase();
    const existing = await prisma.guest.findUnique({
      where: { code: normalizedCode },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Já existe um convidado com este código de convite." },
        { status: 400 }
      );
    }

    const guest = await prisma.guest.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        code: normalizedCode,
        allowedAdditionalGuests: parseInt(allowedAdditionalGuests || "0", 10),
        status: "PENDING",
      },
    });

    return NextResponse.json(guest);
  } catch (error) {
    console.error("Error creating guest:", error);
    return NextResponse.json({ message: "Erro ao criar convidado." }, { status: 500 });
  }
}

// PUT: Update an existing guest
export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      id,
      name,
      phone,
      code,
      allowedAdditionalGuests,
      confirmedAdditionalGuests,
      confirmedNames,
      status,
      notes,
    } = body;

    if (!id || !name || !phone || !code) {
      return NextResponse.json(
        { message: "Dados incompletos para atualização." },
        { status: 400 }
      );
    }

    const normalizedCode = code.trim().toLowerCase();

    // Check if code is already used by another guest
    const duplicate = await prisma.guest.findFirst({
      where: {
        code: normalizedCode,
        NOT: { id },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { message: "Já existe outro convidado com este código de convite." },
        { status: 400 }
      );
    }

    const updated = await prisma.guest.update({
      where: { id },
      data: {
        name: name.trim(),
        phone: phone.trim(),
        code: normalizedCode,
        allowedAdditionalGuests: parseInt(allowedAdditionalGuests || "0", 10),
        confirmedAdditionalGuests: parseInt(confirmedAdditionalGuests || "0", 10),
        confirmedNames: confirmedNames ? confirmedNames.trim() : null,
        status,
        notes: notes ? notes.trim() : null,
        confirmedAt: status !== "PENDING" ? new Date() : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating guest:", error);
    return NextResponse.json({ message: "Erro ao atualizar convidado." }, { status: 500 });
  }
}

// DELETE: Delete a guest
export async function DELETE(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "ID do convidado é obrigatório." }, { status: 400 });
    }

    await prisma.guest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Convidado excluído com sucesso." });
  } catch (error) {
    console.error("Error deleting guest:", error);
    return NextResponse.json({ message: "Erro ao excluir convidado." }, { status: 500 });
  }
}
