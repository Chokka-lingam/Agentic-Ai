import { NextResponse } from "next/server";
import { users } from "@/lib/users";

export async function POST(req: Request) {
  const body = await req.json();

  const { name, email, password } = body;

  const existingUser = users.find((u) => u.email === email);

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (existingUser) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 });
  }

  users.push({ name, email, password });

  return NextResponse.json({
    message: "User created successfully",
  });
}
