import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { isEmpty, debounce, map } from "lodash";
import { ArrowUpDown, ArrowUp, ArrowDown, X, RefreshCw } from "lucide-react";

import { getReadings, getSensorNames } from "@/api";
import { ingestionStore } from "@/store/ingestionStore";
import type { SensorReading } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export const ReadingsTable = observer(() => {
  const store = ingestionStore;
  const qc = useQueryClient();
  const handleSearchChange = useMemo(
    () => debounce((val: string) => store.setSensorSearch(val), 350),
    [],
  );

  const { data: sensorNames = [] } = useQuery({
    queryKey: ["sensorNames"],
    queryFn: getSensorNames,
  });

  const { data: readings } = useQuery({
    queryKey: [
      "readings",
      store.page,
      store.sensorSearch,
      store.sensorFilter,
      store.sortBy,
      store.sortOrder,
    ],
    queryFn: () =>
      getReadings(
        store.page,
        20,
        store.sensorFilter || undefined,
        store.sensorSearch || undefined,
        store.sortBy,
        store.sortOrder,
      ),
  });

  useEffect(() => {
    if (store.state === "done") {
      qc.invalidateQueries({ queryKey: ["readings"] });
      qc.invalidateQueries({ queryKey: ["sensorNames"] });
    }
  }, [store.state, qc]);

  const SortIcon = ({ field }: { field: typeof store.sortBy }) => {
    if (store.sortBy !== field)
      return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-40" />;
    return store.sortOrder === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 inline text-primary" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 inline text-primary" />
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Sensor Readings</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              qc.invalidateQueries({ queryKey: ["readings"] });
              qc.invalidateQueries({ queryKey: ["sensorNames"] });
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          <Input
            className="flex-1 min-w-48"
            placeholder="Search sensor name…"
            defaultValue={store.sensorSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <Select
            value={store.sensorFilter || "__all__"}
            onValueChange={(v) =>
              store.setSensorFilter(v === "__all__" ? "" : v)
            }
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="All sensors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All sensors</SelectItem>
              {map(sensorNames, (n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(store.sensorSearch || store.sensorFilter) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => store.clearFilters()}
            >
              <X className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          )}
        </div>

        {readings && !isEmpty(readings.data) ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => store.toggleSort("sensorName")}
                  >
                    Sensor <SortIcon field="sensorName" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => store.toggleSort("timestamp")}
                  >
                    Timestamp <SortIcon field="timestamp" />
                  </TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {map(readings.data, (r: SensorReading) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-muted-foreground">
                      {r.id}
                    </TableCell>
                    <TableCell className="font-mono">{r.sensorName}</TableCell>
                    <TableCell>
                      {new Date(r.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>{r.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
              <span>
                Page {readings.page} of {readings.totalPages} (
                {readings.total.toLocaleString()} records)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={readings.page <= 1}
                  onClick={() => store.setPage(readings.page - 1)}
                >
                  ← Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={readings.page >= readings.totalPages}
                  onClick={() => store.setPage(readings.page + 1)}
                >
                  Next →
                </Button>
              </div>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            No readings yet. Click "Process Files" to start ingestion.
          </p>
        )}
      </CardContent>
    </Card>
  );
});
