import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import sharp from "sharp";

export const revalidate = 0;

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const bucketName = "wedding";

// GET: List all uploaded files in Supabase Storage bucket
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const listRes = await fetch(`${supabaseUrl}/storage/v1/object/list/${bucketName}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        limit: 100,
        sortBy: {
          column: "created_at",
          order: "desc",
        },
      }),
    });

    if (!listRes.ok) {
      // If bucket doesn't exist yet, return empty list
      return NextResponse.json([]);
    }

    const files = await listRes.json();
    if (!Array.isArray(files)) {
      return NextResponse.json([]);
    }

    const imageExtensions = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"];
    const imageUrls = files
      .filter((file: any) => {
        const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
        return imageExtensions.includes(ext);
      })
      .map((file: any) => `${supabaseUrl}/storage/v1/object/public/${bucketName}/${file.name}`);

    return NextResponse.json(imageUrls);
  } catch (error) {
    console.error("Error listing uploads from Supabase:", error);
    return NextResponse.json({ message: "Erro ao listar imagens." }, { status: 500 });
  }
}

// POST: Save and compress an uploaded image file to Supabase Storage
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
    const originalExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase() || ".jpg";
    
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

    // 1. Try to create the bucket in case it doesn't exist yet (ignores error if it exists)
    try {
      await fetch(`${supabaseUrl}/storage/v1/bucket`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${serviceRoleKey}`,
          "apikey": serviceRoleKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: bucketName,
          name: bucketName,
          public: true,
          file_size_limit: 52428800, // 50MB
          allowed_mime_types: ["image/png", "image/jpeg", "image/webp"],
        }),
      });
    } catch (bucketError) {
      console.warn("Could not create bucket programmatically:", bucketError);
    }

    // 2. Upload the file to Supabase Storage
    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/${bucketName}/${filename}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey,
        "Content-Type": "image/webp",
      },
      body: new Uint8Array(processedBuffer),
    });

    if (!uploadRes.ok) {
      const uploadErrorText = await uploadRes.text();
      throw new Error(`Failed to upload to Supabase Storage: ${uploadErrorText}`);
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filename}`;
    console.log(`File uploaded and compressed successfully to Supabase Storage: ${publicUrl}`);

    return NextResponse.json({ url: publicUrl, name: filename });
  } catch (error) {
    console.error("Error writing upload file:", error);
    return NextResponse.json(
      { message: "Erro ao salvar arquivo de imagem no storage." },
      { status: 500 }
    );
  }
}
