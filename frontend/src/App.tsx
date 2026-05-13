import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";

import { getStatus } from "./api";
import { ingestionStore } from "./store/ingestionStore";
import { useLogStream } from "./hooks/useLogStream";

import { IngestionPanel } from "@/components/IngestionPanel";
import { LogPanel } from "@/components/LogPanel";
import { ReadingsTable } from "@/components/ReadingsTable";

const App = observer(() => {
  const store = ingestionStore;

  useLogStream();

  const { data: statusData } = useQuery({
    queryKey: ["status"],
    queryFn: getStatus,
    refetchInterval: store.isRunning ? 1000 : 5000,
  });

  useEffect(() => {
    store.updateFromStatus(statusData ?? null);
  }, [statusData]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-primary text-primary-foreground py-5 px-8 shadow">
        <h1 className="text-2xl font-bold">IoT Data Reader</h1>
        <p className="text-primary-foreground/70 text-sm mt-1">
          Sensor data ingestion dashboard
        </p>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <IngestionPanel />
        <LogPanel />
        <ReadingsTable />
      </main>
    </div>
  );
});

export default App;
