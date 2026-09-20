import { Prisma } from "@prisma/client";
import type { z } from "zod";

import type { ActionState } from "@/lib/action-state";

export function formString(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function validationFailure(error: z.ZodError): ActionState {
  return {
    ok: false,
    message: error.issues.map((issue) => issue.message).join(" / "),
  };
}

export function prismaActionFailure(
  error: unknown,
  {
    fallback,
    foreignKey,
    duplicate,
    notFound,
    logLabel,
  }: {
    fallback: string;
    foreignKey?: string;
    duplicate?: string;
    notFound?: string;
    logLabel: string;
  },
): ActionState {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002" && duplicate) {
      return { ok: false, message: duplicate };
    }
    if (error.code === "P2003" && foreignKey) {
      return { ok: false, message: foreignKey };
    }
    if (error.code === "P2025" && notFound) {
      return { ok: false, message: notFound };
    }
  }

  console.error(logLabel, error);
  return { ok: false, message: fallback };
}
