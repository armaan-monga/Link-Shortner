import { GlobeStage } from "@/components/globe-stage"
import { DEMO_CITIES, DEMO_COUNTRIES } from "@/lib/demo-geo"
import { cn } from "@/lib/utils"

export function HeroGlobe({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none select-none", className)}>
      <GlobeStage className="size-full" countries={DEMO_COUNTRIES} cities={DEMO_CITIES} selectedId={null} altitude={2.1} />
    </div>
  )
}
