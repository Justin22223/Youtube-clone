"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SearchResults from "@/components/search-results";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  return <SearchResults initialQuery={query} />;
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}