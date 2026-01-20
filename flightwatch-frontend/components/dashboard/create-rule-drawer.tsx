"use client";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  ruleName: string;
  setRuleName: (v: string) => void;

  airlines: string;
  setAirlines: (v: string) => void;

  nonStop: number | null;
  setNonStop: (v: number | null) => void;

  maxStops: number;
  setMaxStops: (v: number) => void;

  onCreate: () => void;
};

export default function CreateRuleDrawer({
  open,
  onOpenChange,
  ruleName,
  setRuleName,
  airlines,
  setAirlines,
  nonStop,
  setNonStop,
  maxStops,
  setMaxStops,
  onCreate,
}: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
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
                    <FieldLabel>Rule Name</FieldLabel>
                    <Input
                      placeholder="Rule name"
                      value={ruleName}
                      onChange={(e) => setRuleName(e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Airlines</FieldLabel>
                    <Input
                      placeholder="Airlines (AC,AZ)"
                      value={airlines}
                      onChange={(e) => setAirlines(e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Non-stop</FieldLabel>
                    <Select
                      value={nonStop === null ? "any" : "1"}
                      onValueChange={(v) =>
                        setNonStop(v === "any" ? null : 1)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="non-stop?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="1">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>Max Stops</FieldLabel>
                    <Input
                      type="number"
                      min={0}
                      disabled={nonStop === 1}
                      value={maxStops}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (!Number.isNaN(v) && v >= 0) {
                          setMaxStops(v);
                        }
                      }}
                    />
                  </Field>
                </FieldGroup>
              </FieldSet>
            </FieldGroup>
          </form>

          <DrawerFooter>
            <Button variant="secondary" onClick={onCreate}>
              Create Rule
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
