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
import { PowerIcon, TrashIcon } from "lucide-react";

type Rule = {
  id: number;
  rule_name: string;
  included_airline_codes: string | null;
  non_stop: number | null;
  max_allowed_stops: number;
  enabled: number;
};

type Props = {
  rules: Rule[];
  onToggle: (rule: Rule) => void;
  onDelete: (id: number) => void;
};

export default function RulesTable({ rules, onToggle, onDelete }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rules</CardTitle>
        <CardDescription>Existing Search Rules</CardDescription>
      </CardHeader>
      <CardContent>
        <Table style={{ marginTop: 12 }}>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Airlines</TableHead>
              <TableHead>Non-stop</TableHead>
              <TableHead>Max stops</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>

          <TableBody>
            {rules.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.rule_name}</TableCell>
                <TableCell>{r.included_airline_codes || "ANY"}</TableCell>
                <TableCell>{r.non_stop ? "YES" : "-"}</TableCell>
                <TableCell>{r.max_allowed_stops}</TableCell>

                <TableCell>
                  {r.enabled ? (
                    <span className="text-green-600 font-medium">ON</span>
                  ) : (
                    <span className="text-red-600 font-medium">OFF</span>
                  )}
                </TableCell>

                <TableCell className="space-x-2">
                  <Button variant="outline" onClick={() => onToggle(r)}>
                    <PowerIcon className="mr-1 h-4 w-4" />
                    {r.enabled ? "Disable" : "Enable"}
                  </Button>

                  <Button variant="outline" onClick={() => onDelete(r.id)}>
                    <TrashIcon className="mr-1 h-4 w-4" />
                    Delete
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
