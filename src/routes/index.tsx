import { createFileRoute } from "@tanstack/react-router";
import { HomeLanding } from "@/components/HomeLanding";

export const Route = createFileRoute("/")({
  component: HomeLanding,
});
