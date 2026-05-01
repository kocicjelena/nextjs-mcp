'use client';

import { createContext, useContext, useReducer, useCallback, useMemo, ReactNode } from 'react';
import { IContextState, IContextAction, PdfAction } from '../interfaces/ContextType';
import { PdfEntryType, initialPdfEntry } from '../interfaces/PdfEntryType';
import actionTypes from '../interfaces/actionTypes';
import { pdfReducer, initialState } from '../reducers/pdfReducer';
import { DocEntry } from '@/types/doc-entry';

interface ContextValue {
  state: IContextState;
  actions: IContextAction;
}

const GlobalContext = createContext<ContextValue | undefined>(undefined);

interface ProviderProps {
  children: ReactNode;
}

export function Provider({ children }: ProviderProps) {
  const [state, dispatch] = useReducer(pdfReducer, initialState);

  const setPdfLoading = useCallback((loading: boolean) => {
    dispatch({ type: actionTypes.SET_PDF_LOADING });
  }, []);

  const setPdfEntries = useCallback((entries: DocEntry[]) => {
    dispatch({ type: actionTypes.SET_PDF_ENTRIES, payload: { entries } });
  }, []);

  const setPdfError = useCallback((error: string | null) => {
    dispatch({ type: actionTypes.SET_PDF_ERROR, payload: { error: error ?? 'Unknown error' } });
  }, []);

  const clearPdfEntries = useCallback(() => {
    dispatch({ type: actionTypes.CLEAR_PDF_ENTRIES });
  }, []);

  const fetchPdfFromApi = useCallback(async () => {
    dispatch({ type: actionTypes.SET_PDF_LOADING });
    try {
      const res = await fetch('/api/docs');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      dispatch({ type: actionTypes.SET_PDF_ENTRIES, payload: { entries: data } });
    } catch (error) {
      dispatch({ type: actionTypes.SET_PDF_ERROR, payload: { error: String(error) } });
    }
  }, []);

  const value = useMemo(
    () => ({
      state,
      actions: {
        setPdfEntries,
        setPdfLoading,
        setPdfError,
        clearPdfEntries,
        fetchPdfFromApi,
      },
    }),
    [state, setPdfEntries, setPdfLoading, setPdfError, clearPdfEntries, fetchPdfFromApi]
  );

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
}

export function useContextState() {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useContextState must be used within a Provider');
  }
  return context.state;
}

export function useContextActions() {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useContextActions must be used within a Provider');
  }
  return context.actions;
}