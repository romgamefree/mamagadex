import { supabase } from "./supabase";

export const getReadList = async (query: { page?: number } = {}) => {
  const { data, error, count } = await supabase
    .from("read_list")
    .select("*, series(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((query.page || 1) * 10 - 10, (query.page || 1) * 10 - 1);

  if (error) throw error;
  return { data, total: count };
};

export const syncReadList = async (body: { source: string; ids: string[] }) => {
  const { data, error } = await supabase
    .from("read_list")
    .upsert(
      body.ids.map((id) => ({
        series_id: id,
        source: body.source,
      })),
    )
    .select();

  if (error) throw error;
  return data;
};

export const changePassword = async (body: {
  current_password: string;
  password: string;
  password_confirmation: string;
}) => {
  // This is handled by auth.ts using Supabase Auth
  throw new Error("Use auth.changePassword() instead");
};

export const changeName = async (body: { name: string }) => {
  const { data, error } = await supabase
    .from("users")
    .update({ name: body.name })
    .eq("id", (await supabase.auth.getUser()).data.user?.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const changeAvatar = async (file: File) => {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("User not found");

  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(fileName);

  const { data, error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id)
    .select()
    .single();

  if (updateError) throw updateError;
  return data;
};
