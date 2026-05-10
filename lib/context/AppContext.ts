"use client";

// Compatibility bridge:
// This project uses context/GlobalContext.tsx (Context + useReducer) as the
// single state source. Keeping this file prevents stale imports from breaking.

import { Provider, useContextState, useContextActions } from "@/context/GlobalContext";

export const AppProvider = Provider;

export function useApp() {
  const state = useContextState();
  const actions = useContextActions();
  return { state, actions };
}
