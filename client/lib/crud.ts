import { supabase } from "@/lib/supabase";

export type NewArticleInput = {
  title: string;
  excerpt: string;
  category?: string;
  isPremium?: boolean;
  coverImage?: string | null;
  contentBlocks?: any[];
};

export type UpdateArticleInput = NewArticleInput & { id: string };

export type NewCourseInput = {
  title: string;
  description?: string | null;
  price?: number;
  modules?: Array<{
    title: string;
    description?: string | null;
    videoUrl?: string | null;
  }>;
};

export type UpdateCourseInput = NewCourseInput & { id: string };

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export async function createArticle(userId: string, input: NewArticleInput) {
  const payload = {
    author_id: userId,
    title: input.title,
    slug: slugify(input.title),
    excerpt: input.excerpt,
    category: input.category ?? null,
    content: JSON.stringify(input.contentBlocks ?? []),
    cover_url: input.coverImage ?? null,
    premium: !!input.isPremium,
    status: "pending_review" as const,
  };
  const { data, error } = await supabase
    .from("articles")
    .insert(payload)
    .select("id")
    .single();
  return { id: data?.id as string | undefined, error };
}

export async function updateArticle(input: UpdateArticleInput) {
  const payload = {
    title: input.title,
    excerpt: input.excerpt,
    category: input.category ?? null,
    content: JSON.stringify(input.contentBlocks ?? []),
    cover_url: input.coverImage ?? null,
    premium: !!input.isPremium,
  };
  const { error } = await supabase
    .from("articles")
    .update(payload)
    .eq("id", input.id);
  return { error };
}

export async function deleteArticle(id: string) {
  const { error } = await supabase.from("articles").delete().eq("id", id);
  return { error };
}

export async function createCourse(userId: string, input: NewCourseInput) {
  const coursePayload = {
    author_id: userId,
    title: input.title,
    description: input.description ?? null,
    price: Number(input.price ?? 0),
    status: "pending_review" as const,
  };
  const { data: inserted, error } = await supabase
    .from("courses")
    .insert(coursePayload)
    .select("id")
    .single();
  if (error || !inserted?.id) return { id: undefined, error };
  const courseId = inserted.id as string;

  const mods = input.modules ?? [];
  for (let i = 0; i < mods.length; i++) {
    const m = mods[i];
    const { data: modRow, error: modErr } = await supabase
      .from("course_modules")
      .insert({
        course_id: courseId,
        position: i + 1,
        title: m.title,
        description: m.description ?? null,
      })
      .select("id")
      .single();
    if (modErr) return { id: courseId, error: modErr };
    if (modRow?.id && m.videoUrl) {
      await supabase.from("course_lessons").insert({
        module_id: modRow.id,
        position: 1,
        title: m.title || "Lesson 1",
        content: null,
        video_url: m.videoUrl,
      });
    }
  }
  return { id: courseId, error: null };
}

export async function updateCourse(input: UpdateCourseInput) {
  const payload = {
    title: input.title,
    description: input.description ?? null,
    price: Number(input.price ?? 0),
  };
  const { error } = await supabase
    .from("courses")
    .update(payload)
    .eq("id", input.id);
  return { error };
}

export async function deleteCourse(id: string) {
  const { error } = await supabase.from("courses").delete().eq("id", id);
  return { error };
}