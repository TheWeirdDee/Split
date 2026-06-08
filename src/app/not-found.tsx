import Link from "next/link";
import { AppHeader } from "@/components/app/AppHeader";

export default function NotFound() {
  return (
    <>
      <AppHeader />
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center space-y-6 pb-24">
        <div className="space-y-2">
          <p className="text-6xl font-bold font-mono text-brand">404</p>
          <h1 className="text-xl font-bold text-text-primary clash-display">Page not found</h1>
          <p className="text-sm text-text-secondary max-w-[260px]">
            This page doesn&apos;t exist. Check the URL or head back to the app.
          </p>
        </div>
        <Link
          href="/app"
          className="px-6 h-12 bg-brand text-black font-bold rounded-2xl text-sm hover:bg-brand/90 transition-all flex items-center"
        >
          Go to Dashboard
        </Link>
      </div>
    </>
  );
}
