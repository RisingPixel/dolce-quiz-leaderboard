import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Entry = {
  id: string;
  name: string;
  score: number;
  created_at: string;
};

const STORAGE_KEY = "ladq_admin_pw";

async function fetchAll(): Promise<Entry[]> {
  const { data, error } = await supabase
    .from("leaderboard_entries")
    .select("id, name, score, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return data ?? [];
}

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin · La Dolce Quiz" }],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [password, setPassword] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) setPassword(stored);
  }, []);

  if (!password) return <LoginForm onAuth={(pw) => {
    sessionStorage.setItem(STORAGE_KEY, pw);
    setPassword(pw);
  }} />;

  return <AdminTable password={password} onLogout={() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setPassword(null);
  }} />;
}

function randomName() {
  return `Test_${Math.floor(Math.random() * 1000)}`;
}

const SCORE_PRESETS = [100, 500, 1_000, 5_000, 10_000];

function TestScorePanel({ queryClient }: { queryClient: QueryClient }) {
  const [name, setName] = useState(randomName());
  const [score, setScore] = useState(500);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setStatus(null);
    setLoading(true);
    try {
      const res = await fetch("/api/public/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, score }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ ok: false, msg: json.error ?? `Errore ${res.status}` });
        return;
      }
      setStatus({ ok: true, msg: `Inviato! ID: ${json.id}` });
      setName(randomName());
      await queryClient.invalidateQueries({ queryKey: ["leaderboard-all"] });
    } catch {
      setStatus({ ok: false, msg: "Errore di rete" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mb-8 rounded-xl border border-[var(--gold)]/15 bg-[var(--teal-deep)]/40 p-5">
      <h2 className="font-display text-xl text-[var(--gold)] mb-4">Test Punteggio</h2>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--cream)]/60 uppercase tracking-wider">Nome</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            className="w-40"
            placeholder="Nome"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--cream)]/60 uppercase tracking-wider">Punteggio</label>
          <Input
            type="number"
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            min={0}
            max={1_000_000}
            className="w-32"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {SCORE_PRESETS.map((p) => (
            <Button
              key={p}
              variant="secondary"
              size="sm"
              onClick={() => setScore(p)}
              className={score === p ? "ring-1 ring-[var(--gold)]" : ""}
            >
              {p.toLocaleString("it-IT")}
            </Button>
          ))}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setName(randomName());
            setScore(Math.floor(Math.random() * 10_000) + 1);
            setStatus(null);
          }}
        >
          Casuale
        </Button>
        <Button
          disabled={loading || !name.trim()}
          onClick={submit}
          size="sm"
        >
          {loading ? "Invio…" : "Invia"}
        </Button>
      </div>
      {status && (
        <p className={`mt-3 text-sm ${status.ok ? "text-green-400" : "text-[var(--destructive)]"}`}>
          {status.msg}
        </p>
      )}
    </section>
  );
}

function LoginForm({ onAuth }: { onAuth: (pw: string) => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/public/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (!res.ok) {
        setError("Password errata");
        return;
      }
      onAuth(pw);
    } catch {
      setError("Errore di rete");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-2xl border border-[var(--gold)]/20 bg-[var(--teal-deep)]/60 p-8">
        <h1 className="font-display text-4xl text-center text-[var(--cream)]">Admin</h1>
        <p className="text-center text-sm text-[var(--cream)]/70">La Dolce Quiz · Backoffice</p>
        <Input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Password"
          autoFocus
        />
        {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
        <Button type="submit" disabled={loading || !pw} className="w-full">
          {loading ? "Verifica…" : "Entra"}
        </Button>
      </form>
    </main>
  );
}

function AdminTable({ password, onLogout }: { password: string; onLogout: () => void }) {
  const qc = useQueryClient();
  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["leaderboard-all"],
    queryFn: fetchAll,
  });
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Eliminare questa voce?")) return;
    setDeleting(id);
    try {
      const res = await fetch("/api/public/admin/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, id }),
      });
      if (res.status === 401) {
        alert("Sessione scaduta. Effettua di nuovo l'accesso.");
        onLogout();
        return;
      }
      if (!res.ok) {
        alert("Errore durante l'eliminazione");
        return;
      }
      await qc.invalidateQueries({ queryKey: ["leaderboard-all"] });
    } finally {
      setDeleting(null);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-5xl mx-auto">
      <TestScorePanel queryClient={qc} />

      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl text-[var(--cream)]">La Dolce Quiz · Admin</h1>
          <p className="text-sm text-[var(--cream)]/60">{data.length} voci</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => refetch()}>Aggiorna</Button>
          <Button variant="outline" onClick={onLogout}>Esci</Button>
        </div>
      </header>

      <div className="rounded-xl border border-[var(--gold)]/15 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[var(--teal-deep)]/60 text-[var(--gold)]/80 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Punteggio</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-[var(--cream)]/60">Caricamento…</td></tr>
            )}
            {isError && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-[var(--destructive)]">Errore nel caricamento dei dati. Riprova.</td></tr>
            )}
            {!isLoading && !isError && data.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-[var(--cream)]/60">Nessuna voce</td></tr>
            )}
            {data.map((e) => (
              <tr key={e.id} className="border-t border-[var(--gold)]/10">
                <td className="px-4 py-3 text-[var(--cream)]">{e.name}</td>
                <td className="px-4 py-3 font-display text-xl text-[var(--gold)]">{e.score.toLocaleString("it-IT")}</td>
                <td className="px-4 py-3 text-sm text-[var(--cream)]/70">
                  {new Date(e.created_at).toLocaleString("it-IT")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleting === e.id}
                    onClick={() => handleDelete(e.id)}
                  >
                    {deleting === e.id ? "…" : "Elimina"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
