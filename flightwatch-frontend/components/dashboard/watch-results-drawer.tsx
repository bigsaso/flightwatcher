"use client";

import { useEffect, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type WatchResult = {
  id: number;
  watch_id: number;
  total_price: number;
  currency: string;
  carrier: string;
  fare_brand: string;

  outbound_depart_time: string;
  outbound_arrive_time: string;
  inbound_depart_time: string | null;
  inbound_arrive_time: string | null;

  checked_bags: number;
  cabin_bags: number;
  seats_left: number;
  adults: number;
  captured_at: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  watchId: number | null;
  apiBase: string;
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function WatchResultsDrawer({
  open,
  onOpenChange,
  watchId,
  apiBase,
}: Props) {
  const [results, setResults] = useState<WatchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !watchId) return;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/watches/${watchId}/results`);
        if (!res.ok) throw new Error(await res.text());
        setResults(await res.json());
      } catch (e: any) {
        alert(e.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [open, watchId, apiBase]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-5xl">
          <DrawerHeader>
            <DrawerTitle>
              Watch Results {watchId && `#${watchId}`}
            </DrawerTitle>
            <DrawerDescription>
              Cheapest captured results for this watch
            </DrawerDescription>
          </DrawerHeader>

          {loading ? (
            <p className="p-4">Loading…</p>
          ) : results.length === 0 ? (
            <p className="p-4 text-muted-foreground">
              No results yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Captured</TableHead>
                  <TableHead>Passengers</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Outbound</TableHead>
                  <TableHead>Inbound</TableHead>
                  <TableHead>Bags</TableHead>
                  <TableHead>Seats</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {results.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {formatDateTime(r.captured_at)}
                    </TableCell>

                    <TableCell>{r.adults}</TableCell>

                    <TableCell>
                      {r.carrier} · {r.fare_brand}
                    </TableCell>

                    <TableCell>
                      {formatDateTime(r.outbound_depart_time)} →{" "}
                      {formatDateTime(r.outbound_arrive_time)}
                    </TableCell>

                    <TableCell>
                      {r.inbound_depart_time ? (
                        <>
                          {formatDateTime(r.inbound_depart_time)} →{" "}
                          {formatDateTime(r.inbound_arrive_time!)}
                        </>
                      ) : (
                        <span className="italic text-muted-foreground">
                          One-way
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      🧳 {r.checked_bags} / 🎒 {r.cabin_bags}
                    </TableCell>

                    <TableCell>{r.seats_left}</TableCell>

                    <TableCell>
                      {r.currency} {r.total_price}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
