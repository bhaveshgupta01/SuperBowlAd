import { supabase } from "./supabase";

export async function signUp(email: string, password: string, businessData: { name: string; type: string; location: string }) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error("User creation failed");

  // Create business profile
  const { error: businessError } = await supabase.from("businesses").insert({
    user_id: authData.user.id,
    name: businessData.name,
    type: businessData.type,
    location: businessData.location,
    instagram_handle: "",
    whatsapp_number: "",
  });

  if (businessError) throw businessError;

  return authData.user;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: sessionData } = await supabase.auth.getSession();
  return sessionData?.session?.user || null;
}

export async function getBusinessProfile(userId: string) {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateBusinessProfile(businessId: string, updates: { instagram_handle?: string; whatsapp_number?: string }) {
  const { data, error } = await supabase
    .from("businesses")
    .update(updates)
    .eq("id", businessId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
