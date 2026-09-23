import { createFileRoute, ClientOnly, useNavigate } from "@tanstack/react-router";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { ChevronDown, ChevronLeft, RefreshCw, Activity, AlertTriangle } from "lucide-react";
import { getEarthquakes } from "@/lib/earthquakes.functions";
import {
  MAG_OPTIONS,
  PERIOD_OPTIONS,
  fmtMag,
  magTier,
  relativeTime,
  type MinMag,
  type Period,
  type Quake,
} from "@/lib/quakes";

const QuakeMap = lazy(() => import("@/components/QuakeMap"));

const searchSchema = z.object({
  mag: z.enum(["all", "5", "6", "7"]).catch("5"),
  period: z.enum(["24h", "48h", "7d"]).catch("24h"),
});

const quakesQuery = (minMag: MinMag, period: Period) =>
  queryOptions({
    queryKey: ["quakes", minMag, period],
    queryFn: () => getEarthquakes({ data: { minMag, period } }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

export const Route = createFileRoute("/")({
  validateSearch: (s: { mag?: MinMag; period?: Period }) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Quakewatch — Live Earthquake Map" },
      { name: "description", content: "Track recent earthquakes worldwide on a live map with magnitude and time filters, powered by USGS data." },
      { property: "og:title", content: "Quakewatch — Live Earthquake Map" },
      { property: "og:description", content: "Recent earthquakes worldwide, filtered by magnitude and time, from USGS data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const tierClass = {
  low: "bg-mag-low text-mag-foreground",
  mid: "bg-mag-mid text-mag-foreground",
  high: "bg-mag-high text-mag-foreground",
  severe: "bg-mag-severe text-mag-foreground",
};

function MagBadge({ mag, big }: { mag: number | null; big?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-md font-mono font-semibold tabular-nums ${tierClass[magTier(mag)]} ${big ? "h-10 w-14 text-lg" : "h-7 w-11 text-sm"}`}
    >
      {fmtMag(mag)}
    </span>
  );
}

function Seg<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg bg-muted p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${value === o.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Index() {
  const { mag, period } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const qc = useQueryClient();
  const q = useQuery(quakesQuery(mag, period));
  const [open, setOpen] = useState(true);
  const [focus, setFocus] = useState<{ id: string; n: number } | null>(null);
  const [, tick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 15 * 60_000);
    return () => clearInterval(t);
  }, []);

  const quakes = q.data?.quakes ?? [];
  const strongest = useMemo(
    () => quakes.reduce<Quake | null>((b, x) => ((x.mag ?? -9) > (b?.mag ?? -9) ? x : b), null),
    [quakes],
  );

  const refresh = () => qc.refetchQueries({ queryKey: ["quakes", mag, period] });
  const fly = (id: string) => {
    setFocus((f) => ({ id, n: (f?.n ?? 0) + 1 }));
    if (window.matchMedia("(max-width: 767px)").matches) setOpen(false);
  };

  return (
    <div className="dark fixed inset-0 overflow-hidden bg-background text-foreground">
      <ClientOnly fallback={<div className="absolute inset-0 bg-muted" />}>
        <Suspense fallback={<div className="absolute inset-0 bg-muted" />}>
          <QuakeMap quakes={quakes} focus={focus} />
        </Suspense>
      </ClientOnly>

      {/* Header */}
      <header className="absolute inset-x-3 top-3 z-[1000] flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/90 px-3 py-2 shadow-panel backdrop-blur-md">
        <div className="mr-auto flex items-center gap-2">
          <Activity className="h-5 w-5 text-quake-hour" />
          <h1 className="font-display text-base font-semibold tracking-tight">Quakewatch</h1>
        </div>
        <Seg options={MAG_OPTIONS} value={mag} onChange={(v) => navigate({ search: (p) => ({ ...p, mag: v }) })} />
        <Seg options={PERIOD_OPTIONS} value={period} onChange={(v) => navigate({ search: (p) => ({ ...p, period: v }) })} />
        <div className="flex items-center gap-2">
          <ClientOnly fallback={null}>
            {q.data && (
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Updated {new Date(q.data.fetchedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
          </ClientOnly>
          <button
            onClick={refresh}
            disabled={q.isFetching}
            aria-label="Refresh"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground transition-colors hover:bg-accent disabled:opacity-70"
          >
            <RefreshCw className={`h-4 w-4 ${q.isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* Panel */}
      <aside
        className={`absolute z-[1000] flex flex-col border border-border bg-card/95 shadow-panel backdrop-blur-md transition-transform duration-300
          inset-x-0 bottom-0 h-[65vh] rounded-t-2xl
          md:inset-x-auto md:bottom-3 md:left-3 md:top-[4.5rem] md:h-auto md:w-96 md:rounded-xl
          ${open ? "translate-y-0 md:translate-x-0" : "translate-y-[calc(100%-3.5rem)] md:translate-y-0 md:-translate-x-[calc(100%+0.75rem)]"}`}
      >
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex h-14 shrink-0 items-center justify-between px-4 text-left"
        >
          <div>
            <div className="text-sm font-semibold">
              {q.isLoading ? "Loading…" : `${quakes.length.toLocaleString()} earthquakes`}
            </div>
            <div className="text-xs text-muted-foreground">
              {MAG_OPTIONS.find((o) => o.value === mag)?.label} · {PERIOD_OPTIONS.find((o) => o.value === period)?.label}
            </div>
          </div>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform md:hidden ${open ? "" : "rotate-180"}`} />
        </button>

        {!open && (
          <button
            onClick={() => setOpen(true)}
            aria-label="Open list"
            className="absolute -right-10 top-2 hidden h-9 w-9 items-center justify-center rounded-lg border border-border bg-card md:flex"
          >
            <ChevronLeft className="h-4 w-4 rotate-180" />
          </button>
        )}
        {open && (
          <button
            onClick={() => setOpen(false)}
            aria-label="Collapse list"
            className="absolute right-3 top-3.5 hidden h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent md:flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {q.data?.capped && (
          <div className="mx-3 mb-2 flex gap-2 rounded-lg border border-quake-day/40 bg-quake-day/10 p-2 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 text-quake-day" />
            Showing the 2,000 most recent quakes. Raise the minimum magnitude or shorten the period to see everything.
          </div>
        )}
        {q.isError && (
          <div className="mx-3 mb-2 rounded-lg bg-destructive/15 p-2 text-xs text-destructive">
            Couldn't load earthquakes. Try refreshing.
          </div>
        )}

        {strongest && (
          <button
            onClick={() => fly(strongest.id)}
            className="mx-3 mb-2 flex items-center gap-3 rounded-lg bg-muted p-3 text-left hover:bg-accent"
          >
            <MagBadge mag={strongest.mag} big />
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Strongest</div>
              <div className="text-sm font-medium leading-snug">{strongest.place}</div>
              <ClientOnly fallback={null}>
                <div className="text-xs text-muted-foreground">{relativeTime(strongest.time)} · {strongest.depth.toFixed(0)} km deep</div>
              </ClientOnly>
            </div>
          </button>
        )}

        <ul className="min-h-0 flex-1 overflow-y-auto border-t border-border">
          {quakes.map((x) => (
            <li key={x.id}>
              <button
                onClick={() => fly(x.id)}
                className="flex w-full items-start gap-3 border-b border-border/60 px-4 py-2.5 text-left transition-colors hover:bg-accent"
              >
                <MagBadge mag={x.mag} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm leading-snug break-words">{x.place}</div>
                  <ClientOnly fallback={null}>
                    <div className="text-xs text-muted-foreground">{relativeTime(x.time)} · {x.depth.toFixed(1)} km</div>
                  </ClientOnly>
                </div>
              </button>
            </li>
          ))}
          {!q.isLoading && quakes.length === 0 && !q.isError && (
            <li className="p-6 text-center text-sm text-muted-foreground">No earthquakes match these filters.</li>
          )}
        </ul>
      </aside>

      {/* Legend */}
      <div className="absolute bottom-6 right-14 z-[900] hidden gap-3 rounded-lg border border-border bg-card/90 px-3 py-1.5 text-xs backdrop-blur md:flex">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-quake-hour" />Past hour</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-quake-day" />Past day</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-quake-old" />Older</span>
      </div>
    </div>
  );
}
