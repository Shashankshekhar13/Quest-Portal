import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (userData?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: cycles, error } = await supabase.from("cycles").select("*").order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cycles });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (userData?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { name, phase, opens_at, closes_at } = body;

  const { data: cycle, error } = await supabase
    .from("cycles")
    .insert([{ name, phase, opens_at, closes_at, is_active: false }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log action
  await supabase.from("audit_logs").insert([{ user_id: user.id, action: "create_cycle", table_name: "cycles", record_id: cycle.id, new_value: cycle }]);

  return NextResponse.json({ cycle });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (userData?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { id, is_active } = body;

  if (!id) return NextResponse.json({ error: "Missing cycle id" }, { status: 400 });

  if (is_active) {
    // Deactivate all others first (server-side enforcement)
    await supabase.from("cycles").update({ is_active: false }).neq("id", id);
  }

  const { data: cycle, error } = await supabase
    .from("cycles")
    .update({ is_active })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log action
  await supabase.from("audit_logs").insert([{ user_id: user.id, action: "update_cycle_status", table_name: "cycles", record_id: cycle.id, new_value: { is_active } }]);

  return NextResponse.json({ cycle });
}
