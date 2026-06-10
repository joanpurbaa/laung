"use server";

import { revalidatePath } from "next/cache";
import { auth } from "../auth";
import { db } from "../prisma";
import { catchLogSchema } from "../validators/catch";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

type CatchLogItem = {
  id: string;
  fishType: string;
  weight: number;
  location: string;
  caughtAt: Date;
};

export async function addCatchLogAction(
  formData: unknown,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Kamu belum login" };
  }

  const parsed = catchLogSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Input tidak valid",
    };
  }

  const log = await db.catchLog.create({
    data: {
      userId: session.user.id,
      fishType: parsed.data.fishType,
      weight: parsed.data.weight,
      location: parsed.data.location,
    },
  });

  revalidatePath("/history");
  return { success: true, data: { id: log.id } };
}

export async function getCatchLogsAction(): Promise<
  ActionResult<CatchLogItem[]>
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Kamu belum login" };
  }

  const logs = await db.catchLog.findMany({
    where: { userId: session.user.id },
    orderBy: { caughtAt: "desc" },
  });

  return { success: true, data: logs };
}

export async function deleteCatchLogAction(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Kamu belum login" };
  }

  const log = await db.catchLog.findUnique({ where: { id } });
  if (!log || log.userId !== session.user.id) {
    return { success: false, error: "Data tidak ditemukan" };
  }

  await db.catchLog.delete({ where: { id } });
  revalidatePath("/history");
  return { success: true, data: undefined };
}
