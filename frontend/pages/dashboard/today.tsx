import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient.ts";

type Task = {
  id: string;
  type: string;
  status: string;
  application_id: string;
  due_at: string;
};

export default function TodayDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchTasks() {
    setLoading(true);
    setError(null);

    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { data, error: fetchError } = await supabase
        .from("tasks")
        .select("*")
        .gte("due_at", todayStart.toISOString())
        .lte("due_at", todayEnd.toISOString())
        .neq("status", "completed");

      if (fetchError) throw fetchError;

      setTasks(data || []);
      
    } catch (err: any) {
      console.error(err);
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  async function markComplete(id: string) {
    try {
      const { error: updateError } = await supabase
        .from("tasks")
        .update({ status: "completed" })
        .eq("id", id);

      if (updateError) throw updateError;

      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
      
    } catch (err: any) {
      console.error(err);
      alert("Failed to update task");
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <main style={{ padding: "1.5rem" }}>
      <h1>Today&apos;s Tasks</h1>
      {tasks.length === 0 && <p>No tasks due today 🎉</p>}

      {tasks.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #000" }}>
              <th style={{ padding: "12px" }}>Type</th>
              <th style={{ padding: "12px" }}>Application</th>
              <th style={{ padding: "12px" }}>Due At</th>
              <th style={{ padding: "12px" }}>Status</th>
              <th style={{ padding: "12px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id} style={{ borderBottom: "1px solid #ccc" }}>
                <td style={{ padding: "12px" }}>{t.type}</td>
                <td style={{ padding: "12px", fontFamily: "monospace" }}>
                  {t.application_id}
                </td>
                <td style={{ padding: "12px" }}>
                  {new Date(t.due_at).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style={{ padding: "12px" }}>
                    {t.status}
                </td>
                <td style={{ padding: "12px" }}>
                  {t.status !== "completed" && (
                    <button onClick={() => markComplete(t.id)}
                      style={{
                        backgroundColor: "#16a34a",
                        color: "white",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                    }}>
                      Mark Complete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
