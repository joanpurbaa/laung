"use server";

import bcrypt from "bcryptjs";
import { signIn, signOut } from "~/lib/auth";
import { db } from "~/lib/prisma";
import { registerSchema, loginSchema } from "~/lib/validators/auth";
import { AuthError } from "next-auth";

type ActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

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

  await db.user.create({
    data: {
      name,
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
