"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button"
import { ChevronDownIcon, Minus, Plus, PlusIcon, PowerIcon, RefreshCwIcon, SearchIcon, TrashIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

type Rule = {
  id: number;
  rule_name: string;
  included_airline_codes: string | null;
  non_stop: number | null;
  max_allowed_stops: number;
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
  fare_brand: string;
  num_stops: number;
  // stop_airports: string[];
  total_duration: string;
  stop_airports_outbound: string[];
  stop_airports_inbound?: string[] | null;
  outbound: ItineraryTiming;
  inbound?: ItineraryTiming | null;
  checked_bags: number;
  cabin_bags: number;
  seats_left: number;
};

type StepperProps = {
  value: number;
  label: string;
  min: number;
  onChange: (next: number) => void;
};

function Stepper({ value, label, min, onChange }: StepperProps) {
  return (
    <div className="flex items-center justify-center space-x-4">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0 rounded-full"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
      >
        <Minus />
        <span className="sr-only">Decrease</span>
      </Button>

      <div className="flex flex-col items-center min-w-[80px]">
        <div className="text-3xl font-bold tracking-tight">
          {value}
        </div>
        <div className="text-muted-foreground text-xs uppercase">
          {label}
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0 rounded-full"
        onClick={() => onChange(value + 1)}
      >
        <Plus />
        <span className="sr-only">Increase</span>
      </Button>
    </div>
  );
}

export default function Home() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingRules, setLoadingRules] = useState(false);

  const [searchResults, setSearchResults] = useState<FlightOffer[]>([]);
  const [searching, setSearching] = useState(false);

  // --- rule form ---
  const [ruleName, setRuleName] = useState("");
  const [airlines, setAirlines] = useState("");
  const [nonStop, setNonStop] = useState<number | null>(null);
  const [maxStops, setMaxStops] = useState(1);

  // --- search form ---
  const [openDepart, setOpenDepart] = useState(false);
  const [openReturn, setOpenReturn] = useState(false);
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
    }
  }

  useEffect(() => {
    loadRules();
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

      {/* REFRESH RULES */}
      <Button variant='outline' onClick={loadRules} disabled={loadingRules}>
        <RefreshCwIcon/>Refresh
      </Button>

      {/* CREATE RULE */}
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline">
            <PlusIcon /> New Rule
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Create a new rule</DrawerTitle>
              <DrawerDescription>
                Create rules to monitor flights with specific criteria.
              </DrawerDescription>
            </DrawerHeader>
            <form>
              <FieldGroup>
                <FieldSet>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="checkout-7j9-rule-name-43j">Rule Name</FieldLabel>
                      <Input id="checkout-7j9-rule-name-43j" placeholder="Rule name" value={ruleName} onChange={(e) => setRuleName(e.target.value)} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="checkout-7j9-airlines-43j">Airlines</FieldLabel>
                      <Input id="checkout-7j9-airlines-43j" placeholder="Airlines (AC,AZ)" value={airlines} onChange={(e) => setAirlines(e.target.value)} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="checkout-7j9-non-stop-43j">Non-stop</FieldLabel>
                      <Select
                        value={nonStop === null ? "any" : "1"}
                        onValueChange={(value) =>
                          setNonStop(value === "any" ? null : 1)
                        }
                      >
                        <SelectTrigger id="checkout-7j9-non-stop-43j" >
                          <SelectValue placeholder="non-stop?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any</SelectItem>
                          <SelectItem value="1">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="checkout-7j9-max-stops-43j">Max Stops</FieldLabel>
                      <Input
                        type="number"
                        min={0}
                        value={maxStops}
                        disabled={nonStop===1}
                        id="checkout-7j9-max-stops-43j"
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (!Number.isNaN(value) && value >= 0) {
                            setMaxStops(value);
                          }
                        }}
                      />
                    </Field>
                  </FieldGroup>
                </FieldSet>
              </FieldGroup>
            </form>
            <DrawerFooter>
              <Button variant="secondary" onClick={createRule}>Create Rule</Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* RULES TABLE */}
      <Table border={1} cellPadding={8} style={{ marginTop: 12 }}>
        <TableHeader>
          <TableRow>
            <TableHead >Name</TableHead >
            <TableHead >Airlines</TableHead >
            <TableHead >Non-stop</TableHead >
            <TableHead >Max stops</TableHead >
            <TableHead >Enabled</TableHead >
            <TableHead  />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((r) => (
            <TableRow key={r.id}>
              <TableCell >{r.rule_name}</TableCell >
              <TableCell >{r.included_airline_codes || "ANY"}</TableCell >
              <TableCell >{r.non_stop ? "YES" : "-"}</TableCell >
              <TableCell >{r.max_allowed_stops}</TableCell >
              <TableCell >{r.enabled ? "ON" : "OFF"}</TableCell >
              <TableCell >
                <Button variant='outline' onClick={() => toggleRule(r)}>
                  <PowerIcon />{r.enabled ? "Disable" : "Enable"}
                </Button>{" "}
                <Button variant='outline' onClick={() => deleteRule(r.id)}>
                  <TrashIcon />Delete
                </Button>
              </TableCell >
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* SEARCH DRAWER */}
      <h2 style={{ marginTop: 40 }}>Search Flights</h2>

      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline">
            <SearchIcon /> Search Flights
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Search Flights</DrawerTitle>
              <DrawerDescription>
                Search for flights based on your criteria.
              </DrawerDescription>
            </DrawerHeader>
            <form>
              <FieldGroup>
                <FieldSet>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="checkout-7j9-origin-43j">Origin</FieldLabel>
                      <Input id="checkout-7j9-origin-43j" placeholder="Origin airport code" value={origin} onChange={(e) => setOrigin(e.target.value)} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="checkout-7j9-destination-43j">Destination</FieldLabel>
                      <Input id="checkout-7j9-destination-43j" placeholder="Destination airport code" value={destination} onChange={(e) => setDestination(e.target.value)} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="checkout-7j9-depart-43j">Depart Date</FieldLabel>
                      <Popover open={openDepart} onOpenChange={setOpenDepart}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            id="depart"
                            className="w-48 justify-between font-normal"
                          >
                            {depart ? depart.toLocaleDateString() : "Select date"}
                            <ChevronDownIcon />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={depart}
                            captionLayout="dropdown"
                            onSelect={(date) => {
                              setDepart(date)
                              setOpenDepart(false)
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="checkout-7j9-return-43j">Return Date</FieldLabel>
                      <Popover open={openReturn} onOpenChange={setOpenReturn}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            id="return"
                            className="w-48 justify-between font-normal"
                          >
                            {returnDate ? returnDate.toLocaleDateString() : "Select date"}
                            <ChevronDownIcon />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={returnDate}
                            captionLayout="dropdown"
                            onSelect={(date) => {
                              setReturnDate(date)
                              setOpenReturn(false)
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="checkout-7j9-flex-days-43j">Flex Days</FieldLabel>
                      {/* <Input
                        id="checkout-7j9-flex-days-43j"
                        type="number"
                        min={0}
                        value={flexDays} onChange={(e) =>
                          setFlexDays(Number(e.target.value))
                        }
                      /> */}
                      <Stepper
                        value={flexDays}
                        label="Flex Days"
                        min={0}
                        onChange={(next) => setFlexDays(Math.max(0, next))}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="checkout-passengers">
                        Passengers
                      </FieldLabel>
                      {/* <Input
                        id="checkout-passengers"
                        type="number"
                        min={1}
                        step={1}
                        value={adults}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (!Number.isNaN(value) && value >= 1) {
                            setAdults(value);
                          }
                        }}
                      /> */}
                      <Stepper
                        value={adults}
                        label="Passengers"
                        min={1}
                        onChange={(next) => setAdults(Math.max(1, next))}
                      />
                    </Field>
                  </FieldGroup>
                </FieldSet>
              </FieldGroup>
            </form>
            <DrawerFooter>
              <Button variant="secondary" onClick={searchFlights} disabled={searching}>
                {searching ? "Searching..." : "Search Flights"}
              </Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

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
                          {formatStops(o.stop_airports_outbound)}
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
                              ? formatStops(o.stop_airports_inbound)
                              : "Direct"}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </main>
  );
}
