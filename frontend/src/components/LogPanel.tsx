import { observer } from "mobx-react-lite";
import { isEmpty, takeRight, map } from "lodash";

import { ingestionStore } from "@/store/ingestionStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LOG_COLOR } from "@/constants/badges";
import type { LogTab } from "@/types/store";

export const LogPanel = observer(() => {
  const store = ingestionStore;
  if (isEmpty(store.logs)) return null;

  const tabs: LogTab[] = ["all", "info", "success", "error"];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Logs</CardTitle>
          <Tabs
            value={store.logTab}
            onValueChange={(v) => store.setLogTab(v as LogTab)}
          >
            <TabsList>
              {map(tabs, (tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="capitalize text-xs"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-950 rounded-md p-4 h-56 overflow-y-auto space-y-0.5">
          {isEmpty(store.filteredLogs) ? (
            <p className="text-muted-foreground text-xs">
              No {store.logTab} logs.
            </p>
          ) : (
            map(takeRight(store.filteredLogs, 100), (entry, i) => (
              <div
                key={i}
                className={`font-mono text-xs leading-5 ${LOG_COLOR[entry.type]}`}
              >
                <span className="text-gray-500">
                  [
                  {new Date(entry.ts).toLocaleTimeString("en-GB", {
                    hour12: false,
                  })}
                  ]
                </span>{" "}
                <span className="font-bold uppercase tracking-wide text-[10px] opacity-70">
                  [{entry.type}]
                </span>{" "}
                {entry.message}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
});
