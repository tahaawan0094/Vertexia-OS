import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-500 font-mono font-bold text-xl flex items-center justify-center mb-4">
        404
      </div>
      <h1 className="text-2xl font-bold font-heading text-white tracking-tight mb-2">
        Page Not Found
      </h1>
      <p className="text-xs text-slate-400 max-w-sm mb-6">
        The requested system resource or dashboard endpoint does not exist or has been relocated.
      </p>
      <Link href="/">
        <Button size="sm">Return to Dashboard</Button>
      </Link>
    </div>
  );
}
