"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";

export async function logoutAdminAction() {
  await signOut({ redirect: false });
  redirect("/login");
}
