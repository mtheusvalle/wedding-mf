import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { writeFile, mkdir, readdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

export const revalidate = 0;

// GET: List all uploaded files in public/uploads/
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    
    try {
      const files = await readdir(uploadsDir);
      // Filter out system files or subdirectories, keep images
      const imageExtensions = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"];
      const imageUrls = files
        .filter((file) => imageExtensions.includes(path.extname(file).toLowerCase()))
        .map((file) => `/uploads/${file}`);
        
      return NextResponse.json(imageUrls);
    } catch (e: any) {
      // If folder does not exist yet
      if (e.code === "ENOENT") {
        return NextResponse.json([]);
      }
      throw e;
    }
  } catch (error) {
    console.error("Error listing uploads:", error);
    return NextResponse.json({ message: "Erro ao listar imagens." }, { status: 500 });
  }
}

// POST: Save and compress an uploaded image file to public/uploads/
export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ message: "Nenhum arquivo enviado." }, { status: 400 });
    }

    // Read bytes of file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Make filename unique and convert to webp format for max compression
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const originalExt = path.extname(file.name) || ".jpg";
    
    // Clean name: alphanumeric only, lowercase
    const cleanName = file.name
      .replace(originalExt, "")
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase()
      .substring(0, 30);
      
    // Output filename will be compressed WebP
    const filename = `${timestamp}-${cleanName}-${randomStr}.webp`;

    // Process image using sharp (resize to max 1920x1920, auto-rotate, convert to optimized WebP)
    let processedBuffer: Buffer;
    try {
      processedBuffer = await sharp(buffer)
        .rotate() // Automatically fixes orientation tags from mobile cameras!
        .resize({
          width: 1920,
          height: 1920,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 80 }) // 80% quality is the industry sweet spot for web
        .toBuffer();
    } catch (sharpError) {
      console.warn("Failed to compress image with sharp, saving original:", sharpError);
      processedBuffer = buffer;
    }

    // Target folder is public/uploads
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Write file to target destination
    const filePath = path.join(uploadsDir, filename);
    await writeFile(filePath, processedBuffer);

    const relativeUrl = `/uploads/${filename}`;
    console.log(`File uploaded and compressed successfully to: ${filePath}`);

    return NextResponse.json({ url: relativeUrl, name: filename });
  } catch (error) {
    console.error("Error writing upload file:", error);
    return NextResponse.json(
      { message: "Erro ao salvar arquivo de imagem no servidor." },
      { status: 500 }
    );
  }
}
