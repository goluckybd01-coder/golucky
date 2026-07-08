import Hero from "@/components/agent/Hero";
import TierCard from "@/components/agent/TierCard";
import Benefits from "@/components/agent/Benefits";
import { TIERS } from "@/lib/tiers";
import { useAgentStore } from "@/store/useAgentStore";

export default function ApplyPage() {
  const selectedTier = useAgentStore((s) => s.selectedTier);

  return (
    <div className="min-h-screen bg-black p-6">
      <Hero />

      {/* Tiers */}
      <div className="grid md:grid-cols-3 gap-5 mt-10">
        {TIERS.map((tier) => (
          <TierCard key={tier.id} tier={tier} />
        ))}
      </div>

      <Benefits />

      {/* Selected Tier Preview */}
      {selectedTier && (
        <div className="fixed bottom-5 right-5 bg-white/10 p-4 text-white rounded-lg">
          Selected: {selectedTier.name}
        </div>
      )}
    </div>
  );
}
