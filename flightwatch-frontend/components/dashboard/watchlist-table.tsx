"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PanelTopOpen, Play, PowerIcon, TrashIcon } from "lucide-react";
import type { Watch } from "@/types/watch";

type Props = {
  watches: Watch[];
  highlightWatchId: number | null;
  runningWatchId: number | null;
  onShowResults: (watchId: number) => void;
  onRun: (watchId: number) => void;
  onToggle: (watch: Watch) => void;
  onDelete: (watchId: number) => void;
};

export default function WatchlistTable({
  watches,
  highlightWatchId,
  runningWatchId,
  onShowResults,
  onRun,
  onToggle,
  onDelete,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitoring</CardTitle>
        <CardDescription>Flights Monitored</CardDescription>
      </CardHeader>
      <CardContent>
        <Table border={1} cellPadding={8} style={{ marginTop: 12 }}>
          <TableHeader>
            <TableRow>
              <TableHead>Rule</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Adults</TableHead>
              <TableHead>Flex</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {watches.map((w) => (
              <TableRow
                key={w.id}
                className={
                  w.id === highlightWatchId
                    ? "bg-yellow-100 animate-pulse"
                    : ""
                }
              >
                <TableCell>{w.rule_name}</TableCell>
                <TableCell>
                  {w.origin} → {w.destination}
                </TableCell>
                <TableCell>
                  {w.depart_date}{" "}
                  {w.return_date ? (
                    `→ ${w.return_date}`
                  ) : (
                    <span className="text-muted-foreground italic">
                      (One-way)
                    </span>
                  )}
                </TableCell>
                <TableCell>{w.adults}</TableCell>
                <TableCell>{w.flex_days}</TableCell>
                <TableCell>
                  {w.enabled ? (
                    <span className="text-green-600 font-medium">Enabled</span>
                  ) : (
                    <span className="text-red-600 font-medium">Disabled</span>
                  )}
                </TableCell>
                <TableCell className="space-x-1">
                  <Button
                    variant="outline"
                    onClick={() => onShowResults(w.id)}
                  >
                    <PanelTopOpen /> Results
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => onRun(w.id)}
                    disabled={!w.enabled || runningWatchId === w.id}
                  >
                    <Play />
                    {runningWatchId === w.id ? "Running…" : "Run"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => onToggle(w)}
                  >
                    <PowerIcon />
                    {w.enabled ? "Disable" : "Enable"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => onDelete(w.id)}
                  >
                    <TrashIcon /> Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
