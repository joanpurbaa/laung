"use server";

import { auth } from "../auth";
import { db } from "../prisma";
import { revalidatePath } from "next/cache";

export async function addFamilyContactAction(name: string, phone: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Belum login" };

  try {
    await db.familyContact.create({
      data: {
        userId: session.user.id,
        name,
        phone,
      },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menyimpan kontak" };
  }
}

export async function deleteFamilyContactAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    await db.familyContact.delete({
      where: { id },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menghapus kontak" };
  }
}

export async function getFamilyContactsAction() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return await db.familyContact.findMany({
    where: { userId: session.user.id },
  });
}
