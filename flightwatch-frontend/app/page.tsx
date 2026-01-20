"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button"
import { PanelTopOpen, Play, PlusIcon, PowerIcon, TrashIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Importing components (TODO: Make other components from here into their own components)
import WatchResultsDrawer from "@/components/dashboard/watch-results-drawer";
import SearchFlightsDrawer from "@/components/dashboard/search-flights-drawer";
import CreateRuleDrawer from "@/components/dashboard/create-rule-drawer";
import RulesTable from "@/components/dashboard/rules-table";
import Globe from "@/components/globe/globe";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

type Rule = {
  id: number;
  rule_name: string;
  included_airline_codes: string | null;
  non_stop: number | null;
  max_allowed_stops: number;
  enabled: number;
};

type Watch = {
  id: number;
  rule_id: number;
  rule_name: string;
  origin: string;
  destination: string;
  depart_date: string;
  return_date?: string | null;
  flex_days: number;
  adults: number;
  travel_class: string;
  currency: string;
  enabled: number;
};

type ItineraryTiming = {
  depart_time: string;
  arrive_time: string;
  duration?: string;
};

type FlightOffer = {
  rule_name: string;
  total_price: number;
  base_price: number;
  currency: string;
  carrier: string;
  outbound_flight_numbers: string[];
  inbound_flight_numbers?: string[] | null;
  fare_brand: string;
  num_stops: number;
  total_duration: string;
  stop_airports_outbound: string[];
  stop_airports_inbound?: string[] | null;
  outbound: ItineraryTiming;
  inbound?: ItineraryTiming | null;
  checked_bags: number;
  cabin_bags: number;
  seats_left: number;
};

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
      <Table border={1} cellPadding={8} style={{ marginTop: 12 }}>
        <TableHeader>
          <TableRow>
            <TableHead >Rule</TableHead >
            <TableHead >Route</TableHead >
            <TableHead >Dates</TableHead >
            <TableHead >Adults</TableHead >
            <TableHead >Flex</TableHead >
            <TableHead> Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {watches.map((w) => (
            <TableRow
              key={w.id}
              className={w.id === highlightWatchId
                ? "bg-yellow-100 animate-pulse"
                : ""
              }
            >
              <TableCell >{w.rule_name}</TableCell >
              <TableCell >{w.origin} → {w.destination}</TableCell >
              <TableCell >{w.depart_date} {
                w.return_date
                ? `→ ${w.return_date}`
                : <span className="text-muted-foreground italic">
                    (One-way)
                  </span>
              }
              </TableCell >
              <TableCell >{w.adults}</TableCell >
              <TableCell >{w.flex_days}</TableCell >
              <TableCell >
                {w.enabled ? (
                  <span className="text-green-600 font-medium">Enabled</span>
                ) : (
                  <span className="text-red-600 font-medium">Disabled</span>
                )}
              </TableCell >
              <TableCell >
                <Button
                  variant="outline" onClick={() => {
                    setResultsWatchId(w.id);
                    setOpenResultsDrawer(true);
                  }}
                >
                  <PanelTopOpen /> Results
                </Button>
                {" "}
                <Button
                  variant="outline" onClick={() => runWatch(w.id)}
                  disabled={!w.enabled || runningWatchId === w.id}
                >
                  <Play />{runningWatchId === w.id ? "Running…" : "Run"}
                </Button>
                {" "}
                <Button variant='outline' onClick={() => toggleWatch(w)}>
                  <PowerIcon />{w.enabled ? "Disable" : "Enable"}
                </Button>
                {" "}
                <Button variant='outline' onClick={() => deleteWatch(w.id)}>
                  <TrashIcon />Delete
                </Button>
              </TableCell >
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
      {searchResults.length > 0 && (
        <>
          <h3>Results</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>Outbound</TableHead>
                <TableHead>Inbound</TableHead>
                <TableHead>Bags</TableHead>
                <TableHead>Seats Left</TableHead>
                <TableHead>Price</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchResults.map((o, i) => (
                <TableRow key={i}>
                  <TableCell>{o.rule_name}</TableCell>
                  <TableCell>{o.carrier} - {o.fare_brand}</TableCell>
                  {/* OUTBOUND (always shown) */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span>
                        🛫
                        {formatDateTime(o.outbound.depart_time)}
                        {" → "}
                        {formatDateTime(o.outbound.arrive_time)}
                      </span>
                      {o.outbound.duration && (
                        <span className="text-sm text-muted-foreground">
                          {formatDuration(o.outbound.duration)}
                          {" · "}
                          {o.outbound_flight_numbers + " " + formatStops(o.stop_airports_outbound)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  {/* INBOUND (conditionally shown) */}
                  <TableCell>
                    {o.inbound ? (
                      <div className="flex flex-col">
                        <span>
                          🛬
                          {formatDateTime(o.inbound.depart_time)}
                          {" → "}
                          {formatDateTime(o.inbound.arrive_time)}
                        </span>
                        {o.inbound.duration && (
                          <span className="text-sm text-muted-foreground">
                            {formatDuration(o.inbound.duration)}
                            {" · "}
                            {o.stop_airports_inbound
                              ? o.inbound_flight_numbers + " " + formatStops(o.stop_airports_inbound)
                              : o.inbound_flight_numbers + " " + "Direct"}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">
                        One-way
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span>
                      🧳 {o.checked_bags} / 🎒 {o.cabin_bags}
                    </span>
                  </TableCell>
                  <TableCell>
                    {o.seats_left > 0 ? (
                      <span>💺 {o.seats_left}</span>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {o.currency} {o.total_price}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => watchFlight(o)}
                    >
                      <PlusIcon /> Watch
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {/* GLOBE */}
      {!openSearchDrawer && origin && destination && (
        <Globe origin={origin} destination={destination} />
      )}

    </main>
  );
}
