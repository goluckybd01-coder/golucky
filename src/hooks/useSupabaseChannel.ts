import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Subscribe to a Supabase realtime channel exactly once for the component's
 * lifetime. The setup callback receives a fresh channel and MUST return the
 * subscribed channel (usually `channel.subscribe()` result or the channel
 * itself). The hook guarantees the channel is removed on unmount, avoiding
 * connection leaks in high-traffic wallet components.
 */
export function useSupabaseChannel(
  name: string,
  setup: (channel: RealtimeChannel) => RealtimeChannel,
  deps: ReadonlyArray<unknown> = [],
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channel = supabase.channel(name);
    channelRef.current = setup(channel);
    return () => {
      try {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[useSupabaseChannel] cleanup failed", err);
      }
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return channelRef;
}

export default useSupabaseChannel;
