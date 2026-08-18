import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { message: "Código do convite não fornecido." },
      { status: 400 }
    );
  }

  try {
    const guest = await prisma.guest.findUnique({
      where: { code: code.trim().toLowerCase() },
    });

    if (!guest) {
      return NextResponse.json(
        { message: "Convite não encontrado. Verifique o código digitado." },
        { status: 404 }
      );
    }

    return NextResponse.json(guest);
  } catch (error) {
    console.error("Error searching guest:", error);
    return NextResponse.json(
      { message: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}
