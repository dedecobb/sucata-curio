import { supabase } from "./supabase";

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) throw error;
}

export async function sendPasswordReset(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
  return data;
}

export async function updateUserPassword(password) {
  const { data, error } = await supabase.auth.updateUser({ password });

  if (error) throw error;
  return data;
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, nome, role, ativo, criado_em, atualizado_em")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}
