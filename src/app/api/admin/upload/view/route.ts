import { type NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";

export const revalidate = 0;

// GET: Securely proxy private Vercel Blobs to make them viewable by guests on the site
export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("pathname");
  if (!pathname) {
    return NextResponse.json({ error: "Missing pathname" }, { status: 400 });
  }

  try {
    const result = await get(pathname, { access: "private" });
    if (!result) {
      return new NextResponse("Not found", { status: 404 });
    }
    
    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType || "image/webp",
        "X-Content-Type-Options": "nosniff",
        // Cache the image in the visitor's browser for 1 year to minimize function executions
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    console.error("Error serving private blob:", e);
    return new NextResponse("Not found", { status: 404 });
  }
}
