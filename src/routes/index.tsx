import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PROMO_VIDEO_SRC =
  "https://github.com/RisingPixel/dolce-quiz-leaderboard/releases/download/1.0/rppromo.mp4";
const LEADERBOARD_MS = 20_000;
const VIDEO_MS = 10_000;
const VIDEO_STALL_TIMEOUT_MS = 3_000;

type DisplayMode = "leaderboard" | "video";

type Entry = {
  id: string;
  name: string;
  score: number;
  created_at: string;
};

async function fetchTop20(): Promise<Entry[]> {
  const { data, error } = await supabase
    .from("leaderboard_entries")
    .select("id, name, score, created_at")
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  const seen = new Set<string>();
  const deduped: Entry[] = [];
  for (const e of data ?? []) {
    const key = e.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(e);
    if (deduped.length >= 20) break;
  }
  return deduped;
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    video: search.video === true || search.video === "true",
  }),
  head: () => ({
    meta: [
      { title: "La Dolce Quiz — Classifica Evento" },
      { name: "description", content: "Classifica live de La Dolce Quiz." },
    ],
    links: [
      { rel: "preload", as: "video", href: PROMO_VIDEO_SRC, type: "video/mp4" },
    ],
  }),
  component: Leaderboard,
});


function Leaderboard() {
  const { video: videoEnabled } = Route.useSearch();
  const { data = [], dataUpdatedAt } = useQuery({
    queryKey: ["leaderboard-top20"],
    queryFn: fetchTop20,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const listRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [mode, setMode] = useState<DisplayMode>("leaderboard");
  const videoReadyRef = useRef(false);

  // Force preload as soon as the page mounts
  useEffect(() => {
    if (!videoEnabled) return;
    const video = videoRef.current;
    if (!video) return;
    try {
      video.load();
    } catch (e) {
      console.error("[promo] preload failed:", e);
    }
    const onReady = () => {
      videoReadyRef.current = true;
    };
    video.addEventListener("canplaythrough", onReady);
    video.addEventListener("canplay", onReady);
    if (video.readyState >= 3) videoReadyRef.current = true;
    return () => {
      video.removeEventListener("canplaythrough", onReady);
      video.removeEventListener("canplay", onReady);
    };
  }, [videoEnabled]);

  // Check whether the video has enough buffered data from currentTime to play
  // for `seconds` without re-buffering.
  const hasEnoughBuffered = (video: HTMLVideoElement, seconds: number) => {
    const needed = Math.min(seconds, (video.duration || seconds) - video.currentTime);
    for (let i = 0; i < video.buffered.length; i++) {
      const start = video.buffered.start(i);
      const end = video.buffered.end(i);
      if (start <= video.currentTime + 0.1 && end >= video.currentTime + needed - 0.1) {
        return true;
      }
    }
    return false;
  };

  // Mode timer: leaderboard → video (only if buffered enough), video → leaderboard.
  useEffect(() => {
    if (!videoEnabled) {
      if (mode !== "leaderboard") setMode("leaderboard");
      return;
    }
    let cancelled = false;
    const cleanups: Array<() => void> = [];
    const duration = mode === "leaderboard" ? LEADERBOARD_MS : VIDEO_MS;

    const timer = setTimeout(() => {
      if (cancelled) return;

      if (mode === "leaderboard") {
        const video = videoRef.current;
        const videoSeconds = VIDEO_MS / 1000;
        const ready =
          !!video &&
          (video.readyState >= 4 || hasEnoughBuffered(video, videoSeconds));
        if (ready) {
          setMode("video");
          return;
        }
        // Not ready — wait for it to buffer enough, then switch.
        if (!video) return;
        const onProgress = () => {
          if (cancelled) return;
          if (video.readyState >= 4 || hasEnoughBuffered(video, videoSeconds)) {
            cleanups.forEach((fn) => fn());
            if (!cancelled) setMode("video");
          }
        };
        video.addEventListener("progress", onProgress);
        video.addEventListener("canplaythrough", onProgress);
        cleanups.push(() => {
          video.removeEventListener("progress", onProgress);
          video.removeEventListener("canplaythrough", onProgress);
        });
        return;
      }

      // mode === "video" → back to leaderboard
      setMode("leaderboard");
    }, duration);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      cleanups.forEach((fn) => fn());
    };
  }, [mode]);

  // Play / pause + stall watchdog while in video mode.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (mode !== "video") {
      video.pause();
      return;
    }

    video.play().catch((e) => console.error("[promo] autoplay blocked:", e));

    // If playback stalls for more than VIDEO_STALL_TIMEOUT_MS, bail back to leaderboard.
    let stallTimer: ReturnType<typeof setTimeout> | null = null;
    const clearStall = () => {
      if (stallTimer) {
        clearTimeout(stallTimer);
        stallTimer = null;
      }
    };
    const armStall = () => {
      clearStall();
      stallTimer = setTimeout(() => {
        console.warn("[promo] video stalled >3s, falling back to leaderboard");
        setMode("leaderboard");
      }, VIDEO_STALL_TIMEOUT_MS);
    };
    const onWaiting = () => armStall();
    const onStalled = () => armStall();
    const onPlaying = () => clearStall();
    const onTimeUpdate = () => clearStall();

    video.addEventListener("waiting", onWaiting);
    video.addEventListener("stalled", onStalled);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      clearStall();
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("stalled", onStalled);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [mode]);



  useEffect(() => {
    const measure = () => {
      if (!listRef.current || !innerRef.current) return;
      const overflow = innerRef.current.scrollHeight - listRef.current.clientHeight;
      setScrollDistance(overflow > 0 ? -overflow : 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (listRef.current) ro.observe(listRef.current);
    if (innerRef.current) ro.observe(innerRef.current);
    return () => ro.disconnect();
  }, [data]);

  const updated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("it-IT")
    : "—";

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Video panel — always mounted to preserve playback position */}
      <div
        className={[
          "absolute inset-0 bg-black transition-opacity duration-700",
          mode === "video" ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
          style={{ pointerEvents: "none" }}
        >
          <source src={PROMO_VIDEO_SRC} type="video/mp4" />
        </video>
      </div>

      {/* Leaderboard panel */}
      <main
        className={[
          "absolute inset-0 px-12 py-6 flex flex-col gap-4 transition-opacity duration-700",
          mode === "leaderboard" ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
      <header className="text-center">
        <h1
          className="font-display text-6xl xl:text-7xl tracking-wide text-[var(--cream)]"
          style={{ textShadow: "0 2px 30px oklch(0.18 0.04 190 / 0.7)" }}
        >
          La Dolce <span className="italic text-[var(--gold)]">Quiz</span>
        </h1>
        <p className="font-display text-2xl xl:text-3xl text-[var(--cream)]/80 italic mt-1">
          Classifica Evento
        </p>
        <div className="mx-auto mt-4 h-px w-72 bg-gradient-to-r from-transparent via-[var(--gold)]/60 to-transparent" />
      </header>

      <section className="flex-1 mx-auto w-full max-w-5xl flex flex-col">
        <div className="grid grid-cols-[120px_1fr_220px] px-8 pb-2 text-lg font-semibold uppercase tracking-[0.2em] text-[var(--gold)]/80">
          <div>Pos.</div>
          <div>Nome</div>
          <div className="text-right">Punteggio</div>
        </div>

        <div
          ref={listRef}
          className="overflow-hidden rounded-2xl border border-[var(--gold)]/15 bg-[var(--teal-deep)]/40 backdrop-blur-sm"
          style={{ maxHeight: "min(70vh, 720px)", height: "min(70vh, 720px)" }}
        >
          <div
            ref={innerRef}
            className={scrollDistance < 0 ? "auto-scroll" : ""}
            style={
              { ["--scroll-distance" as string]: `${scrollDistance}px` } as React.CSSProperties
            }
          >
            {data.length === 0 && (
              <div className="py-24 text-center text-2xl text-[var(--cream)]/60 italic font-display">
                In attesa dei primi punteggi…
              </div>
            )}
            {data.map((e, i) => {
              const pos = i + 1;
              const isTop1 = pos === 1;
              const isTop3 = pos <= 3;
              return (
                <div
                  key={e.id}
                  className={[
                    "grid grid-cols-[120px_1fr_220px] items-center px-8 py-3 text-2xl xl:text-3xl",
                    "border-b border-[var(--gold)]/10 last:border-b-0",
                    isTop1
                      ? "bg-[var(--accent)]/15 text-[var(--cream)]"
                      : isTop3
                      ? "bg-[var(--gold)]/8 text-[var(--cream)]"
                      : "text-[var(--cream)]/90",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "font-display",
                      isTop1
                        ? "text-[var(--accent)] text-4xl"
                        : isTop3
                        ? "text-[var(--gold)] text-3xl"
                        : "text-[var(--cream)]/60",
                    ].join(" ")}
                  >
                    {pos.toString().padStart(2, "0")}
                  </div>
                  <div className="truncate font-medium">{e.name}</div>
                  <div className="text-right font-display tabular-nums tracking-wider">
                    {e.score.toLocaleString("it-IT")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-[var(--cream)]/50">
          Ultimo aggiornamento: {updated} · si aggiorna ogni 5 secondi
        </p>
      </section>

      <div className="fixed bottom-6 right-6 flex flex-col items-center gap-2 rounded-2xl bg-white p-3 shadow-[0_8px_40px_oklch(0.1_0.04_185/0.5)]">
        <img src="/qr.png" alt="QR code per giocare" width={144} height={144} />
        <p className="font-display text-base font-semibold tracking-widest uppercase text-[var(--teal-deep)]">
          Scan to play
        </p>
      </div>
      </main>
    </div>
  );
}
