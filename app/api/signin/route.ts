import { NextResponse } from "next/server";
import { users } from "@/lib/users";
import { createToken } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json();

  const { email, password } = body;

  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = createToken({ email });

  const response = NextResponse.json({ success: true });

  response.cookies.set("token", token, {
    httpOnly: true,
    path: "/",
  });

  return response;
}
