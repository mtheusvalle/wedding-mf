import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export const revalidate = 0;

// GET: List all gallery images for admin management
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const images = await prisma.galleryImage.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(images);
  } catch (error) {
    console.error("Error fetching gallery images:", error);
    return NextResponse.json({ message: "Erro ao buscar imagens da galeria." }, { status: 500 });
  }
}

// POST: Add a new image to the gallery
export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { url, caption } = body;

    if (!url) {
      return NextResponse.json({ message: "URL da imagem é obrigatória." }, { status: 400 });
    }

    const image = await prisma.galleryImage.create({
      data: {
        url: url.trim(),
        caption: caption?.trim() || null,
        active: true,
      },
    });

    return NextResponse.json(image);
  } catch (error) {
    console.error("Error creating gallery image:", error);
    return NextResponse.json({ message: "Erro ao adicionar imagem." }, { status: 500 });
  }
}

// PUT: Update an existing gallery image (caption or active status)
export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, caption, active } = body;

    if (!id) {
      return NextResponse.json({ message: "ID da imagem é obrigatório." }, { status: 400 });
    }

    const updated = await prisma.galleryImage.update({
      where: { id },
      data: {
        caption: caption !== undefined ? caption.trim() : undefined,
        active: active !== undefined ? active : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating gallery image:", error);
    return NextResponse.json({ message: "Erro ao atualizar imagem." }, { status: 500 });
  }
}

// DELETE: Remove an image from the gallery database
export async function DELETE(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "ID da imagem é obrigatório." }, { status: 400 });
    }

    await prisma.galleryImage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Imagem excluída com sucesso." });
  } catch (error) {
    console.error("Error deleting gallery image:", error);
    return NextResponse.json({ message: "Erro ao excluir imagem da galeria." }, { status: 500 });
  }
}
