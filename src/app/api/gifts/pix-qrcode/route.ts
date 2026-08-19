import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generatePixPayload } from "@/lib/pix";
import QRCode from "qrcode";

export const revalidate = 0;

// GET: Generate a dynamic Pix QR Code image (PNG) for a given transaction ID
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get("transactionId");

  if (!transactionId) {
    return new NextResponse("ID da transação não fornecido", { status: 400 });
  }

  try {
    // 1. Fetch transaction details
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { gift: true },
    });

    if (!transaction) {
      return new NextResponse("Transação não localizada", { status: 404 });
    }

    // 2. Fetch wedding configs for the Pix Key and names
    const config = await prisma.weddingConfig.findUnique({
      where: { id: "global" },
    });

    if (!config || !config.pixKey) {
      return new NextResponse("Configuração Pix ausente no painel dos noivos", { status: 400 });
    }

    // Convert transaction amount from cents to BRL float (double decimals)
    const amountBRL = transaction.amount / 100;

    // Use names in uppercase for merchant name (standard EMV QRCPS requirement)
    const bride = config.brideName || "Noiva";
    const groom = config.groomName || "Noivo";
    const merchantName = `${bride} e ${groom}`;

    // 3. Generate the Pix Payload String
    const pixCode = generatePixPayload({
      key: config.pixKey,
      amount: amountBRL,
      merchantName: merchantName,
      txId: transaction.id.replace(/-/g, "").substring(0, 20), // Max 25 chars, alphanumeric
    });

    // 4. Generate the QR Code as PNG Buffer
    const qrCodeBuffer = await QRCode.toBuffer(pixCode, {
      type: "png",
      width: 400,
      margin: 1,
    });

    return new NextResponse(new Uint8Array(qrCodeBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error generating dynamic Pix QR Code:", error);
    return new NextResponse("Erro ao gerar QR Code do Pix", { status: 500 });
  }
}
