import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import ResultsEntryClient from "./results-entry-client"

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}

export default function ResultsEntryPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResultsEntryClient />
    </Suspense>
  )
}
