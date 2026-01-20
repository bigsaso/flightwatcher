"use client";

import { useEffect, useState } from "react";

// Importing components (TODO: Make other components from here into their own components)
import WatchResultsDrawer from "@/components/dashboard/watch-results-drawer";
import SearchFlightsDrawer from "@/components/dashboard/search-flights-drawer";
import CreateRuleDrawer from "@/components/dashboard/create-rule-drawer";
import RulesTable from "@/components/dashboard/rules-table";
import WatchlistTable from "@/components/dashboard/watchlist-table";
import SearchResultsTable from "@/components/dashboard/search-results-table";
import Globe from "@/components/globe/globe";

import type { Watch } from "@/types/watch";
import type { Rule } from "@/types/rule"
import type { FlightOffer } from "@/types/flight-offer";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export default function Home() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingRules, setLoadingRules] = useState(false);

  const [openSearchDrawer, setOpenSearchDrawer] = useState(false);
  const [searchResults, setSearchResults] = useState<FlightOffer[]>([]);
  const [searching, setSearching] = useState(false);

  // --- rule form ---
  const [openCreateDrawer, setOpenCreateDrawer] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [airlines, setAirlines] = useState("");
  const [nonStop, setNonStop] = useState<number | null>(null);
  const [maxStops, setMaxStops] = useState(1);

  // --- Watchlist ---
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loadingWatches, setLoadingWatches] = useState(false);
  const [highlightWatchId, setHighlightWatchId] = useState<number | null>(null);

  // --- runs ---
  const [runningWatchId, setRunningWatchId] = useState<number | null>(null);
  const [openResultsDrawer, setOpenResultsDrawer] = useState(false);
  const [resultsWatchId, setResultsWatchId] = useState<number | null>(null);

  // --- search form ---
  const [openDepart, setOpenDepart] = useState(false);
  const [openReturn, setOpenReturn] = useState(false);
  const [returnCalendarDate, setReturnCalendarDate] = useState<Date | undefined>(undefined);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [depart, setDepart] = useState<Date | undefined>(undefined);
  const [returnDate, setReturnDate] = useState<Date | undefined>(undefined);
  const [flexDays, setFlexDays] = useState(0);
  const [adults, setAdults] = useState<number>(1);

  async function loadRules() {
    setLoadingRules(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/rules/`);
      if (!res.ok) throw new Error(await res.text());
      setRules(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingRules(false);
    }
  }

  async function toggleRule(rule: Rule) {
    await fetch(`${API_BASE}/rules/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: rule.enabled ? 0 : 1 }),
    });
    loadRules();
  }

  async function deleteRule(id: number) {
    if (!confirm(`Delete rule ${id}?`)) return;
    await fetch(`${API_BASE}/rules/${id}`, { method: "DELETE" });
    loadRules();
  }

  async function createRule() {
    // --- simple validation ---
    if (ruleName.trim() === "") {
      alert("Rule name is required");
      return;
    }
    const payload = {
      rule_name: ruleName.trim(),
      included_airline_codes: airlines.trim() || null,
      non_stop: nonStop,
      max_allowed_stops: nonStop === 1? 0 : maxStops,
    }
    await fetch(`${API_BASE}/rules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setRuleName("");
    setAirlines("");
    setNonStop(null);
    setMaxStops(1);
    loadRules();
    setOpenCreateDrawer(false);
  }

  async function loadWatches() {
    setLoadingWatches(true);
    try {
      const res = await fetch(`${API_BASE}/watches`);
      if (!res.ok) throw new Error(await res.text());
      setWatches(await res.json());
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingWatches(false);
    }
  }

  async function toggleWatch(watch: Watch) {
    await fetch(`${API_BASE}/watches/${watch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: watch.enabled ? 0 : 1 }),
    });
    loadWatches();
  }

  async function deleteWatch(id: number) {
    if (!confirm(`Delete watch ${id}?`)) return;
    await fetch(`${API_BASE}/watches/${id}`, { method: "DELETE" });
    loadWatches();
  }

  async function watchFlight(offer: FlightOffer) {
    const rule = rules.find((r) => r.rule_name === offer.rule_name);
    const rule_id = rule ? rule.id : null;
    const payload = {
      rule_id: rule_id,
      origin,
      destination,
      depart_date: formatDate(depart),
      return_date: formatDate(returnDate),
      flex_days: flexDays,
      adults,
      travel_class: "ECONOMY", // for now
      currency: offer.currency,
    };

    const res = await fetch(`${API_BASE}/watches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      alert(await res.text());
      return;
    }

    const data = await res.json();

    // Mark this watch for highlighting
    setHighlightWatchId(data);

    // Reload watches
    await loadWatches();

    // Auto-clear highlight after a short delay
    setTimeout(() => setHighlightWatchId(null), 2000);
  }

  async function runWatch(watchId: number) {
    try {
      setRunningWatchId(watchId);

      const res = await fetch(`${API_BASE}/watches/${watchId}/run`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const result = await res.json();
      console.log("Watch run result:", result);

      // optional: reload results table here later
    } catch (e: any) {
      alert(e.message);
    } finally {
      setRunningWatchId(null);
    }
  }

  function formatDate(date?: Date | null): string | null {
    if (!date) return null;
    return date.toISOString().slice(0, 10);
  }

  function formatDateTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  function formatDuration(duration?: string) {
    if (!duration) return ""
    return duration
      .replace("PT", "")
      .replace("H", "h ")
      .replace("M", "m")
  }

  function formatStops(stops: string[] = []) {
    return stops.length === 0
      ? "Direct"
      : `via ${stops.join(", ")}`;
  }

  async function searchFlights() {
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(`${API_BASE}/flights/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination,
          depart: formatDate(depart),
          return_date: formatDate(returnDate),
          flex_days: flexDays,
          adults,
          currency: "CAD",
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSearchResults(data.offers || []);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSearching(false);
      setOpenSearchDrawer(false);
    }
  }

  useEffect(() => {
    loadRules();
    loadWatches();
  }, []);

  useEffect(() => {
    if (nonStop === 1) {
      setMaxStops(0);
    }
  }, [nonStop]);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Flights Watcher Admin</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* CREATE RULE */}
      <CreateRuleDrawer
        open={openCreateDrawer}
        onOpenChange={setOpenCreateDrawer}
        ruleName={ruleName}
        setRuleName={setRuleName}
        airlines={airlines}
        setAirlines={setAirlines}
        nonStop={nonStop}
        setNonStop={setNonStop}
        maxStops={maxStops}
        setMaxStops={setMaxStops}
        onCreate={createRule}
      />

      {/* RULES TABLE */}
      <RulesTable
        rules={rules}
        onToggle={toggleRule}
        onDelete={deleteRule}
      />

      {/* WATCHLIST TABLE */}
      <WatchlistTable
        watches={watches}
        highlightWatchId={highlightWatchId}
        runningWatchId={runningWatchId}
        onShowResults={(id) => {
          setResultsWatchId(id);
          setOpenResultsDrawer(true);
        }}
        onRun={runWatch}
        onToggle={toggleWatch}
        onDelete={deleteWatch}
      />
      <WatchResultsDrawer
        open={openResultsDrawer}
        onOpenChange={setOpenResultsDrawer}
        watchId={resultsWatchId}
        apiBase={API_BASE}
      />

      {/* SEARCH DRAWER */}
      <h2 style={{ marginTop: 40 }}>Search Flights</h2>
      <SearchFlightsDrawer
        open={openSearchDrawer}
        onOpenChange={setOpenSearchDrawer}
        origin={origin}
        setOrigin={setOrigin}
        destination={destination}
        setDestination={setDestination}
        depart={depart}
        setDepart={setDepart}
        returnDate={returnDate}
        setReturnDate={setReturnDate}
        flexDays={flexDays}
        setFlexDays={setFlexDays}
        adults={adults}
        setAdults={setAdults}
        onSearch={searchFlights}
        searching={searching}
      />

      {/* RESULTS */}
      <SearchResultsTable
        results={searchResults}
        onWatch={watchFlight}
        formatDateTime={formatDateTime}
        formatDuration={formatDuration}
        formatStops={formatStops}
      />

      {/* GLOBE */}
      {!openSearchDrawer && origin && destination && (
        <Globe origin={origin} destination={destination} />
      )}

    </main>
  );
}
