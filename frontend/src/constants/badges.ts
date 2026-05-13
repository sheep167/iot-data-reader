import type { ComponentProps } from "react";
import type { Badge } from "@/components/ui/badge";

export const STATE_BADGE: Record<
  string,
  ComponentProps<typeof Badge>["variant"]
> = {
  idle: "secondary",
  running: "default",
  stopped: "warning",
  done: "success",
  error: "destructive",
};

export const LOG_COLOR: Record<"info" | "success" | "error", string> = {
  info: "text-blue-300",
  success: "text-green-400",
  error: "text-red-400",
};
