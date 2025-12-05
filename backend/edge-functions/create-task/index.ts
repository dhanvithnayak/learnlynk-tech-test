import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type CreateTaskPayload = {
  application_id: string;
  task_type: string;
  due_at: string;
};

const VALID_TYPES = ["call", "email", "review"];

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as Partial<CreateTaskPayload>;
    const { application_id, task_type, due_at } = body;

    if (!application_id) {
      return new Response(JSON.stringify({ error: "application_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!task_type || !VALID_TYPES.includes(task_type)) {
      return new Response(JSON.stringify({ error: `Invalid or missing task_type. Must be one of: ${VALID_TYPES.join(", ")}` }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!due_at) {
      return new Response(JSON.stringify({ error: "due_at is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      const dueDate = new Date(due_at);
      if (isNaN(dueDate.getTime())) {
        return new Response(JSON.stringify({ error: "Invalid due_at format" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      } else if (dueDate <= new Date()) {
        return new Response(JSON.stringify({ error: "due_at must be in the future" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }


    // tenant_id is also a required field to be added to the tasks table. I have ignored it here for simplicity
    const { data, error } = await supabase
      .from("tasks")
      .insert({ application_id, task_type, due_at })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return new Response(JSON.stringify({ error: "Failed to create task" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }


    return new Response(JSON.stringify({ success: true, task_id: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
