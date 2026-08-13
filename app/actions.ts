"use server";

import { supabase } from "@/lib/db/client";

export async function createProject(formData: FormData) {
  const url = formData.get("source") as string;
  if (!url) throw new Error("URL is required");

  // Create project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: "00000000-0000-0000-0000-000000000000", // dummy for single user prototype
      source_url: url,
      status: "pending",
    })
    .select()
    .single();

  if (projectError || !project) {
    throw new Error(projectError?.message || "Failed to create project");
  }

  // Create ingest job
  const { error: jobError } = await supabase
    .from("jobs")
    .insert({
      project_id: project.id,
      type: "ingest",
      status: "queued"
    });

  if (jobError) {
    throw new Error(jobError.message);
  }

  return project.id;
}

export async function saveDecision(candidateId: string, decision: "used" | "not_useful", start?: number, end?: number) {
  const { error } = await supabase
    .from("moment_decisions")
    .insert({
      candidate_moment_id: candidateId,
      decision,
      actual_start_seconds: start,
      actual_end_seconds: end
    });

  if (error) {
    throw new Error(error.message);
  }
}

