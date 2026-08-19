import { createClient } from "@supabase/supabase-js";
import type { TestimonialData } from "./testimonial-grid-demo";

export type { TestimonialData };

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SupabaseTestimonial {
  id: string;
  name: string;
  profession: string;
  rating: number;
  quote: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export async function getTestimonials(): Promise<TestimonialData[]> {
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching testimonials:", error);
    return [];
  }

  return (data as SupabaseTestimonial[]).map((t) => ({
    id: t.id,
    name: t.name,
    profession: t.profession,
    rating: t.rating,
    quote: t.quote,
    avatarUrl: t.avatar_url ?? undefined,
  }));
}

export async function createTestimonial(
  testimonial: Omit<SupabaseTestimonial, "id" | "created_at" | "updated_at">
): Promise<TestimonialData | null> {
  const { data, error } = await supabase
    .from("testimonials")
    .insert(testimonial)
    .select()
    .single();

  if (error) {
    console.error("Error creating testimonial:", error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    profession: data.profession,
    rating: data.rating,
    quote: data.quote,
    avatarUrl: data.avatar_url ?? undefined,
  };
}

export async function updateTestimonial(
  id: string,
  updates: Partial<Omit<SupabaseTestimonial, "id" | "created_at" | "updated_at">>
): Promise<TestimonialData | null> {
  const { data, error } = await supabase
    .from("testimonials")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating testimonial:", error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    profession: data.profession,
    rating: data.rating,
    quote: data.quote,
    avatarUrl: data.avatar_url ?? undefined,
  };
}

export async function deleteTestimonial(id: string): Promise<boolean> {
  const { error } = await supabase.from("testimonials").delete().eq("id", id);

  if (error) {
    console.error("Error deleting testimonial:", error);
    return false;
  }

  return true;
}

export async function uploadTestimonialAvatar(
  file: File,
  testimonialId: string
): Promise<string | null> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${testimonialId}.${fileExt}`;
  const filePath = `testimonials/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("testimonial-avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error("Error uploading avatar:", uploadError);
    return null;
  }

  const { data } = supabase.storage
    .from("testimonial-avatars")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function deleteTestimonialAvatar(
  testimonialId: string
): Promise<boolean> {
  const { error } = await supabase.storage
    .from("testimonial-avatars")
    .remove([`testimonials/${testimonialId}`]);

  if (error) {
    console.error("Error deleting avatar:", error);
    return false;
  }

  return true;
}