"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { signIn, signOut } from "~/lib/auth";
import { db } from "~/lib/prisma";
import { registerSchema, loginSchema } from "~/lib/validators/auth";
import { usernameBaseFrom } from "~/lib/username";
import { AuthError } from "next-auth";

type ActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

async function buildUniqueUsername(
  name: string,
  email: string,
): Promise<string> {
  const base =
    usernameBaseFrom(name, email) ||
    ("USER" + randomBytes(4).toString("hex").toUpperCase());

  for (let i = 1; i <= 20; i++) {
    const candidate = i === 1 ? base : `${base}_${i}`;
    const exists = await db.user.findFirst({
      where: { username: { equals: candidate, mode: "insensitive" } },
      select: { id: true },
    });
    if (!exists) return candidate;
  }

  return `USER${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function registerAction(formData: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Input tidak valid",
    };
  }

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "Email sudah terdaftar" };
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const username = await buildUniqueUsername(name, email);

  await db.user.create({
    data: {
      name,
      username,
      email,
      password: hashedPassword,
      isVerified: true,
    },
  });

  return { success: true, message: "Registrasi berhasil, silakan login" };
}

export async function loginAction(formData: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Input tidak valid",
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return { success: true, message: "Login berhasil" };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Email atau password salah" };
        default:
          return { success: false, error: "Terjadi kesalahan saat login" };
      }
    }
    throw error;
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
