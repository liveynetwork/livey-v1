import { supabase } from "../lib/supabase";

export async function getCurrentLiveyUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user;
}

export async function signOutLiveyUser() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }

  window.dispatchEvent(new Event("livey:auth-changed"));
}