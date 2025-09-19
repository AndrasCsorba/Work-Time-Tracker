import { useEffect, useState } from "react";
import { getJSON, sendJSON } from "./lib/api";
import type { Project, TimeEntry } from "./types";

export default function App() {
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [projectId, setProjectId] = useState<number>(1);
  const [minutes, setMinutes] = useState<number>(60);
  const [note, setNote] = useState<string>("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJSON<Project[]>("/projects").then(setProjects).catch(console.error);
  }, []);

  async function loadDay(d: string) {
    const q = new URLSearchParams({ userId: "1", date_gte: d, date_lte: d });
    const data = await getJSON<TimeEntry[]>(`/time-entries?${q.toString()}`);
    setEntries(data);
  }
  useEffect(() => {
    loadDay(date);
  }, [date]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await sendJSON<TimeEntry>("/time-entries", "POST", {
        userId: 1,
        projectId,
        date,
        durationMinutes: minutes,
        note,
      });
      setNote("");
      setMinutes(60);
      await loadDay(date);
    } catch (err: any) {
      setError(err.message ?? "Error while saving");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-base-200 p-6" data-theme="light">
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body space-y-3">
            <h1 className="text-2xl font-bold">Work Time — Entry</h1>
            <form onSubmit={onSave} className="space-y-3">
              <input
                type="date"
                className="input input-bordered w-full"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <select
                className="select select-bordered w-full"
                value={projectId}
                onChange={(e) => setProjectId(Number(e.target.value))}>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="input input-bordered w-full"
                min={1}
                step={15}
                placeholder="Minutes"
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button className="btn btn-primary w-full" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              {error && (
                <div className="alert alert-error">
                  <span>{error}</span>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Daily list */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="text-xl font-semibold mb-2">Entries — {date}</h2>
            {entries.length === 0 ? (
              <p className="opacity-70">No entries for this day yet.</p>
            ) : (
              <ul className="space-y-2">
                {entries.map((e) => (
                  <li
                    key={e.id}
                    className="p-3 rounded border flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {projects.find((p) => p.id === e.projectId)?.name ??
                          `Project #${e.projectId}`}
                      </div>
                      <div className="text-sm opacity-70">{e.note || "—"}</div>
                    </div>
                    <div className="font-semibold">{e.durationMinutes} min</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
