"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon } from "lucide-react";

import type { FlightOffer } from "@/types/flight-offer";

type Props = {
  results: FlightOffer[];
  onWatch: (offer: FlightOffer) => void;

  formatDateTime: (iso: string) => string;
  formatDuration: (duration?: string) => string;
  formatStops: (stops?: string[]) => string;
};

export default function SearchResultsTable({
  results,
  onWatch,
  formatDateTime,
  formatDuration,
  formatStops,
}: Props) {
  if (results.length === 0) return null;

  return (
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
          {results.map((o, i) => (
            <TableRow key={i}>
              <TableCell>{o.rule_name}</TableCell>

              <TableCell>
                {o.carrier} – {o.fare_brand}
              </TableCell>

              {/* OUTBOUND */}
              <TableCell>
                <div className="flex flex-col">
                  <span>
                    🛫 {formatDateTime(o.outbound.depart_time)}
                    {" → "}
                    {formatDateTime(o.outbound.arrive_time)}
                  </span>

                  {o.outbound.duration && (
                    <span className="text-sm text-muted-foreground">
                      {formatDuration(o.outbound.duration)}
                      {" · "}
                      {o.outbound_flight_numbers +
                        " " +
                        formatStops(o.stop_airports_outbound)}
                    </span>
                  )}
                </div>
              </TableCell>

              {/* INBOUND */}
              <TableCell>
                {o.inbound ? (
                  <div className="flex flex-col">
                    <span>
                      🛬 {formatDateTime(o.inbound.depart_time)}
                      {" → "}
                      {formatDateTime(o.inbound.arrive_time)}
                    </span>

                    {o.inbound.duration && (
                      <span className="text-sm text-muted-foreground">
                        {formatDuration(o.inbound.duration)}
                        {" · "}
                        {o.stop_airports_inbound
                          ? o.inbound_flight_numbers +
                            " " +
                            formatStops(o.stop_airports_inbound)
                          : o.inbound_flight_numbers + " Direct"}
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
                🧳 {o.checked_bags} / 🎒 {o.cabin_bags}
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
                  onClick={() => onWatch(o)}
                >
                  <PlusIcon /> Watch
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
