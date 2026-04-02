"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

function readRequiredField(formData: FormData, field: string): string {
  const value = formData.get(field);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }

  return value;
}

export async function signInAction(formData: FormData): Promise<void> {
  const email = readRequiredField(formData, "email");
  const password = readRequiredField(formData, "password");
  const supabase = createSupabaseServerClient({ canSetCookies: true });

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/");
}

export async function signUpAction(formData: FormData): Promise<void> {
  const email = readRequiredField(formData, "email");
  const password = readRequiredField(formData, "password");
  const supabase = createSupabaseServerClient({ canSetCookies: true });

  const { error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/sign-in");
}
