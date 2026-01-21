"use client";

import { useState } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { Stepper } from "@/components/ui/stepper";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  origin: string;
  setOrigin: (v: string) => void;

  destination: string;
  setDestination: (v: string) => void;

  depart?: Date;
  setDepart: (d?: Date) => void;

  returnDate?: Date;
  setReturnDate: (d?: Date) => void;

  flexDays: number;
  setFlexDays: (n: number) => void;

  adults: number;
  setAdults: (n: number) => void;

  onSearch: () => void;
  searching: boolean;
};

export default function SearchFlightsDrawer({
  open,
  onOpenChange,
  origin,
  setOrigin,
  destination,
  setDestination,
  depart,
  setDepart,
  returnDate,
  setReturnDate,
  flexDays,
  setFlexDays,
  adults,
  setAdults,
  onSearch,
  searching,
}: Props) {
  const [openDepart, setOpenDepart] = useState(false);
  const [openReturn, setOpenReturn] = useState(false);
  const [returnCalendarDate, setReturnCalendarDate] = useState<Date | undefined>();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
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
                    <FieldLabel>Origin</FieldLabel>
                    <Input
                      placeholder="Origin airport code"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Destination</FieldLabel>
                    <Input
                      placeholder="Destination airport code"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value.toUpperCase())}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Depart Date</FieldLabel>
                    <Popover open={openDepart} onOpenChange={setOpenDepart}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-48 justify-between font-normal"
                        >
                          {depart ? depart.toLocaleDateString() : "Select date"}
                          <ChevronDownIcon />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={depart}
                          captionLayout="dropdown"
                          onSelect={(d) => {
                            setDepart(d);
                            setOpenDepart(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </Field>

                  <Field>
                    <FieldLabel>Return Date</FieldLabel>
                    <Popover
                      open={openReturn}
                      onOpenChange={(open) => {
                        setOpenReturn(open);
                        if (open && depart) {
                          setReturnCalendarDate(
                            new Date(depart.getFullYear(), depart.getMonth(), depart.getDate() + 1)
                          );
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-48 justify-between font-normal"
                        >
                          {returnDate
                            ? returnDate.toLocaleDateString()
                            : "Select date"}
                          <ChevronDownIcon />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={returnDate}
                          month={returnCalendarDate}
                          onMonthChange={setReturnCalendarDate}
                          captionLayout="dropdown"
                          onSelect={(d) => {
                            setReturnDate(d);
                            setOpenReturn(false);
                          }}
                          disabled={(d) => (depart ? d < depart : false)}
                        />
                      </PopoverContent>
                    </Popover>
                  </Field>

                  <Field>
                    <Stepper
                      value={flexDays}
                      label="Flex Days"
                      min={0}
                      onChange={(n) => setFlexDays(Math.max(0, n))}
                    />
                  </Field>

                  <Field>
                    <Stepper
                      value={adults}
                      label="Passengers"
                      min={1}
                      onChange={(n) => setAdults(Math.max(1, n))}
                    />
                  </Field>
                </FieldGroup>
              </FieldSet>
            </FieldGroup>
          </form>

          <DrawerFooter>
            <Button
              variant="secondary"
              onClick={onSearch}
              disabled={searching}
            >
              {searching ? "Searching..." : "Search Flights"}
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
