import { useMutation, useQueryClient } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { map } from "lodash";

import { triggerIngest, stopIngest } from "@/api";
import { ingestionStore } from "@/store/ingestionStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { STATE_BADGE } from "@/constants/badges";

export const IngestionPanel = observer(() => {
  const store = ingestionStore;
  const qc = useQueryClient();

  const ingestMutation = useMutation({
    mutationFn: triggerIngest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["status"] }),
  });

  const stopMutation = useMutation({
    mutationFn: stopIngest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["status"] }),
  });

  const statCards: [string, string][] = [
    ["Files", `${store.processedFiles} / ${store.totalFiles}`],
    ["Total Rows", store.totalRows.toLocaleString()],
    ["Inserted", store.insertedRows.toLocaleString()],
    ["Duplicates", store.skippedRows.toLocaleString()],
    ["Invalid Rows", store.errorRows.toLocaleString()],
    [
      "Started",
      store.startedAt ? new Date(store.startedAt).toLocaleTimeString() : "—",
    ],
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Ingestion</CardTitle>
          <Badge
            variant={STATE_BADGE[store.state] ?? "secondary"}
            className="capitalize"
          >
            {store.state}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {store.isDone ? (
          <p className="text-sm text-muted-foreground">
            Ingestion completed
            {store.finishedAt &&
              ` at ${new Date(store.finishedAt).toLocaleTimeString()}`}
            .
          </p>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={() => ingestMutation.mutate()}
              disabled={ingestMutation.isPending || store.isRunning}
            >
              {store.isRunning
                ? "Processing…"
                : store.resumable
                  ? "Resume Ingestion"
                  : "Start Ingestion"}
            </Button>
            {store.isRunning && (
              <Button
                variant="destructive"
                onClick={() => stopMutation.mutate()}
                disabled={stopMutation.isPending}
              >
                Stop
              </Button>
            )}
          </div>
        )}

        {store.state !== "idle" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {map(statCards, ([label, val]) => (
              <div key={label} className="rounded-lg border bg-muted/40 p-3">
                <div className="text-muted-foreground uppercase text-xs tracking-wide">
                  {label}
                </div>
                <div className="font-semibold text-base mt-1">{val}</div>
              </div>
            ))}
          </div>
        )}

        {store.totalFiles > 0 && (
          <Progress value={store.progressPct} className="h-2" />
        )}
      </CardContent>
    </Card>
  );
});
