import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("admin_session");
    return NextResponse.json({ success: true, message: "Sessão encerrada." });
  } catch (error) {
    console.error("Error logging out:", error);
    return NextResponse.json(
      { message: "Erro ao encerrar sessão." },
      { status: 500 }
    );
  }
}
