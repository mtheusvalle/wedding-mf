import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { message: "Senha é obrigatória." },
        { status: 400 }
      );
    }

    const token = await createSession(password);

    if (!token) {
      return NextResponse.json(
        { message: "Senha incorreta." },
        { status: 401 }
      );
    }

    // Set cookie on response
    const cookieStore = await cookies();
    cookieStore.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60, // 1 day in seconds
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.json({ success: true, message: "Login realizado com sucesso!" });
  } catch (error) {
    console.error("Error logging in:", error);
    return NextResponse.json(
      { message: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}
