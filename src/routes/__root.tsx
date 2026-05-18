import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter, HeadContent, Scripts,
} from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import appCss from "../styles.css?url";

const ClientProviders = lazy(() => import("@/components/ClientProviders"));

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center glass p-8">
        <h1 className="text-7xl font-bold gold-gradient-text">404</h1>
        <Link to="/" className="btn-gold inline-block mt-6 px-5 py-2.5">Home</Link>
      </div>
    </div>
  );
}
function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center glass p-8">
        <h1 className="text-xl font-semibold">Error</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="btn-gold mt-6 px-5 py-2.5">Retry</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0a0a0a" },
      { title: "GoldEarn — Earn USDT" },
      { name: "description", content: "Earn USDT by watching ads, completing tasks, and inviting friends. Withdraw to your TRC20 wallet." },
      { property: "og:title", content: "GoldEarn — Earn USDT" },
      { name: "twitter:title", content: "GoldEarn — Earn USDT" },
      { property: "og:description", content: "Earn USDT by watching ads, completing tasks, and inviting friends. Withdraw to your TRC20 wallet." },
      { name: "twitter:description", content: "Earn USDT by watching ads, completing tasks, and inviting friends. Withdraw to your TRC20 wallet." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2d5363b8-c218-4cd6-9d7c-634d9cd26f61/id-preview-ed724383--a8322f2a-a269-4cd2-96c5-dcae5c34597f.lovable.app-1779117028729.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2d5363b8-c218-4cd6-9d7c-634d9cd26f61/id-preview-ed724383--a8322f2a-a269-4cd2-96c5-dcae5c34597f.lovable.app-1779117028729.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Kufi+Arabic:wght@400;500;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ku" dir="rtl" className="dark">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function ClientOnly({ children }: { children: ReactNode }) {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  if (!m) return <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Loading…</div>;
  return <>{children}</>;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ClientOnly>
        <Suspense fallback={null}>
          <ClientProviders><Outlet /></ClientProviders>
        </Suspense>
      </ClientOnly>
    </QueryClientProvider>
  );
}
