import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import * as xlsx from "xlsx";

export const revalidate = 0;

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "Nenhum arquivo enviado." },
        { status: 400 }
      );
    }

    // 1. Read the uploaded file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 2. Parse the workbook using SheetJS
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet) as any[];

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { message: "A planilha está vazia ou não pôde ser lida." },
        { status: 400 }
      );
    }

    let importedCount = 0;
    let skippedCount = 0;

    // 3. Process each row sequentially to handle unique constraint lookups correctly
    for (const row of rows) {
      // Find the name column (it could be in uppercase or lowercase, let's normalize check)
      const rawName = row.NOME || row.Nome || row.nome;
      if (!rawName) {
        skippedCount++;
        continue;
      }

      // Concatenate NOME and SOBRENOMES if present
      const rawLastName = row.SOBRENOMES || row.Sobrenomes || row.sobrenomes || "";
      const fullName = [rawName, rawLastName].filter(Boolean).join(" ").trim();

      if (!fullName) {
        skippedCount++;
        continue;
      }

      // Check if guest with the exact same name already exists to avoid duplicates
      const existingGuest = await prisma.guest.findFirst({
        where: { name: fullName },
      });

      if (existingGuest) {
        skippedCount++;
        continue;
      }

      // Normalize phone number
      const rawPhone = row.CELULAR || row.Celular || row.celular || "";
      const phone = rawPhone && String(rawPhone).trim() !== "-" ? String(rawPhone).trim() : "";

      // Parse status
      let status = "PENDING";
      const rawConfirm = String(row.CONFIRMADO || row.Confirmado || row.confirmado || "").toUpperCase().trim();
      if (
        rawConfirm === "CONFIRMADO" ||
        rawConfirm === "CONFIRMED" ||
        rawConfirm === "OK" ||
        rawConfirm === "SIM" ||
        rawConfirm === "YES"
      ) {
        status = "CONFIRMED";
      } else if (
        rawConfirm === "RECUSADO" ||
        rawConfirm === "DECLINED" ||
        rawConfirm === "NÃO" ||
        rawConfirm === "NO"
      ) {
        status = "DECLINED";
      }

      // Generate unique invitation code based on name
      const baseCode = fullName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-") // Keep only alphanumeric and dashes
        .replace(/-+/g, "-") // Prevent double dashes
        .replace(/^-|-$/g, "") // Trim dashes
        .substring(0, 15);

      let code = baseCode || "convidado";
      let suffix = 0;
      let isUnique = false;

      while (!isUnique) {
        const testCode = suffix === 0 ? code : `${code}-${suffix}`;
        const match = await prisma.guest.findUnique({
          where: { code: testCode },
        });
        if (!match) {
          code = testCode;
          isUnique = true;
        } else {
          suffix = Math.floor(100 + Math.random() * 900);
        }
      }

      // Create a descriptive notes string summarizing other Excel columns
      const notesParts = [];
      const group = row.GRUPO || row.Grupo || row.grupo;
      const mesa = row.MESA || row.Mesa || row.mesa;
      const sexo = row.SEXO || row.Sexo || row.sexo;
      const email = row["E-MAIL"] || row.Email || row.email;
      const postal = row["CÓDPOSTAL"] || row.CodPostal || row.codpostal;

      if (group) notesParts.push(`Grupo: ${group}`);
      if (mesa) notesParts.push(`Mesa: ${mesa}`);
      if (sexo) notesParts.push(`Sexo: ${sexo}`);
      if (email) notesParts.push(`E-mail: ${email}`);
      if (postal) notesParts.push(`Postal: ${postal}`);

      const notes = notesParts.join(" | ");

      // Create the guest record
      await prisma.guest.create({
        data: {
          name: fullName,
          phone,
          code,
          status,
          notes: notes || null,
        },
      });

      importedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `${importedCount} convidados importados com sucesso. ${skippedCount} linhas ignoradas (nomes em branco ou duplicados).`,
      imported: importedCount,
      skipped: skippedCount,
    });
  } catch (error) {
    console.error("Error importing guests:", error);
    return NextResponse.json(
      { message: "Erro ao processar a importação da planilha." },
      { status: 500 }
    );
  }
}
