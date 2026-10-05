import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { SignalGuard, type GuardState, type PreflightStatus } from '../../modules/signal-guard-native';

const initial: GuardState = { phase: 'idle', monitoring: false, internet: 'unknown', cellular: 'unknown', settings: { internet: true, cellular: true } };
interface ContextValue {
  state: GuardState; preflight: PreflightStatus | null; checking: boolean;
  refresh: () => Promise<void>;
}
const Context = createContext<ContextValue | null>(null);
export function GuardProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = useState(initial);
  const [preflight, setPreflight] = useState<PreflightStatus | null>(null);
  const [checking, setChecking] = useState(true);
  const refreshInFlight = useRef<Promise<void> | null>(null);
  const mounted = useRef(true);
  const revision = useRef(0);
  const previousPhase = useRef<GuardState["phase"]>(initial.phase);
  const refresh = useCallback(async () => {
    if (refreshInFlight.current) return refreshInFlight.current;
    setChecking(true);
    // Discard stale preflight readiness as soon as a new automatic check begins.
    setPreflight(null);
    const work = (async () => {
      try {
        const stamp = revision.current;
        const snapshot = await SignalGuard.getGuardState();
        if (mounted.current && stamp === revision.current) setState(snapshot);
        const status = await SignalGuard.getPreflightStatus();
        if (mounted.current) setPreflight(status);
      } finally {
        if (mounted.current) setChecking(false);
        refreshInFlight.current = null;
      }
    })();
    refreshInFlight.current = work;
    return work;
  }, []);
  useEffect(() => {
    mounted.current = true;
    const events = SignalGuard.addListener('onGuardState', (next) => {
      const previous = previousPhase.current;
      previousPhase.current = next.phase;
      revision.current += 1;
      setState(next);
      const ended = ['idle', 'completed', 'interrupted'].includes(next.phase) && ['starting', 'stopping', 'activeHealthy', 'activeDegraded', 'activeIncident'].includes(previous);
      if (ended) {
        setPreflight(null);
        void refresh().catch(() => {});
      }
    });
    void refresh().catch(() => {});
    const appState = AppState.addEventListener('change', (status) => {
      if (status === 'active') void refresh().catch(() => {});
    });
    return () => { mounted.current = false; events.remove(); appState.remove(); };
  }, [refresh]);
  return <Context.Provider value={{ state, preflight, checking, refresh }}>{children}</Context.Provider>;
}
export function useGuard() {
  const value = useContext(Context);
  if (!value) throw new Error('GuardProvider is required');
  return value;
}
