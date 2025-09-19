import { useEffect, useState } from "react";
import { API, getJSON, sendJSON } from "./lib/api";

// ---- types ----
type Project = { id: number; name: string; client?: string; isActive: boolean };
type TimeEntry = {
  id: number;
  userId: number;
  projectId: number;
  date: string;
  durationMinutes: number;
  note?: string;
};

// ---- small helpers (local, no imports) ----
function formatDateDisplay(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}
function todayLocalISODate(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export default function App() {
  const [date, setDate] = useState<string>(todayLocalISODate());
  const [projectId, setProjectId] = useState<number>(1);
  const [minutes, setMinutes] = useState<number>(60);
  const [note, setNote] = useState<string>("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- edit mode states ---
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editMinutes, setEditMinutes] = useState<number>(60);
  const [editNote, setEditNote] = useState<string>("");

  // load projects once
  useEffect(() => {
    getJSON<Project[]>("/projects").then(setProjects).catch(console.error);
  }, []);

  // robust day loader with debug logs
  async function loadDay(d: string) {
    const url = `/time-entries?userId=1&date=${encodeURIComponent(d)}`;
    console.log("GET", API + url);
    const data = await getJSON<TimeEntry[]>(url);
    console.log("RESP", data);
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

  async function onDelete(id: number) {
    const sure = confirm("Delete this entry?");
    if (!sure) return;
    await fetch(`${API}/time-entries/${id}`, { method: "DELETE" });
    await loadDay(date);
  }

  function startEdit(entry: TimeEntry) {
    setEditingId(entry.id);
    setEditMinutes(entry.durationMinutes);
    setEditNote(entry.note ?? "");
  }

  async function saveEdit(id: number) {
    await fetch(`${API}/time-entries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationMinutes: editMinutes, note: editNote }),
    });
    setEditingId(null);
    await loadDay(date);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  return (
    <div className="min-h-screen bg-base-200 p-6" data-theme="light">
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
        {/* ---- FORM ---- */}
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

        {/* ---- DAILY LIST ---- */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="text-xl font-semibold mb-2">
              Entries — {formatDateDisplay(date)}
            </h2>

            {/* DEBUG PANEL */}
            <p className="text-xs opacity-60 mb-2">
              Debug API: {API} • Date: {date} • Count: {entries.length}
            </p>
            <button
              type="button"
              className="btn btn-sm mb-2"
              onClick={async () => {
                const all = await getJSON<TimeEntry[]>(
                  `/time-entries?userId=1`
                );
                console.log("ALL (first 5):", all.slice(0, 5));
                setEntries(all); // show all for quick check
              }}>
              Debug: load all
            </button>

            {entries.length === 0 ? (
              <p className="opacity-70">No entries for this day yet.</p>
            ) : (
              <ul className="space-y-2">
                {entries.map((e) => (
                  <li
                    key={e.id}
                    className="p-3 rounded border grid sm:grid-cols-12 gap-3 items-center">
                    {/* Bal blokk: projekt + note */}
                    <div className="sm:col-span-7">
                      <div className="font-medium">
                        {projects.find((p) => p.id === e.projectId)?.name ??
                          `Project #${e.projectId}`}
                      </div>
                      <div className="text-sm opacity-70 mt-1">
                        {editingId === e.id ? (
                          <input
                            className="input input-bordered w-full"
                            value={editNote}
                            onChange={(ev) => setEditNote(ev.target.value)}
                            placeholder="Note"
                          />
                        ) : (
                          e.note || "—"
                        )}
                      </div>
                    </div>

                    {/* Közép: percek */}
                    <div className="sm:col-span-3">
                      {editingId === e.id ? (
                        <input
                          type="number"
                          min={1}
                          step={15}
                          className="input input-bordered w-full"
                          value={editMinutes}
                          onChange={(ev) =>
                            setEditMinutes(Number(ev.target.value))
                          }
                          placeholder="Minutes"
                        />
                      ) : (
                        <span className="font-semibold">
                          {e.durationMinutes} min
                        </span>
                      )}
                    </div>

                    {/* Jobb blokk: akciók */}
                    <div className="sm:col-span-2 flex items-center justify-end gap-2">
                      {editingId === e.id ? (
                        <>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => saveEdit(e.id)}>
                            Save
                          </button>
                          <button className="btn btn-sm" onClick={cancelEdit}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn-sm"
                            onClick={() => startEdit(e)}>
                            Edit
                          </button>
                          <button
                            className="btn btn-error btn-sm"
                            onClick={() => onDelete(e.id)}>
                            Delete
                          </button>
                        </>
                      )}
                    </div>
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
