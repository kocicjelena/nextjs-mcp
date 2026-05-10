'use client';

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import {
  IContextState,
  IContextAction,
} from '../interfaces/ContextType';
import actionTypes from '../interfaces/actionTypes';
import { pdfReducer, initialState } from '../reducers/pdfReducer';
import type {
  AgentMessage,
  RegisteredPromptEntry,
  RegisteredResourceEntry,
  RegisteredToolEntry,
  SwStatus,
} from '@/lib/types/navigator.types';
import type { DocEntry } from '@/types/doc-entry';

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
    dispatch({ type: actionTypes.SET_PDF_LOADING, payload: { loading } });
  }, []);

  const setPdfEntries = useCallback((entries: DocEntry[]) => {
    dispatch({ type: actionTypes.SET_PDF_ENTRIES, payload: { entries } });
  }, []);

  const setPdfError = useCallback((error: string | null) => {
    dispatch({
      type: actionTypes.SET_PDF_ERROR,
      payload: { error: error ?? 'Unknown error' },
    });
  }, []);

  const clearPdfEntries = useCallback(() => {
    dispatch({ type: actionTypes.CLEAR_PDF_ENTRIES });
  }, []);

  const fetchPdfFromApi = useCallback(async () => {
    dispatch({ type: actionTypes.SET_PDF_LOADING, payload: { loading: true } });
    try {
      const res = await fetch('/api/docs');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      dispatch({ type: actionTypes.SET_PDF_ENTRIES, payload: { entries: data } });
    } catch (error) {
      dispatch({
        type: actionTypes.SET_PDF_ERROR,
        payload: { error: String(error) },
      });
    }
  }, []);

  const addTool = useCallback((tool: RegisteredToolEntry) => {
    dispatch({ type: actionTypes.ADD_TOOL, payload: { tool } });
  }, []);

  const removeTool = useCallback((name: string) => {
    dispatch({ type: actionTypes.REMOVE_TOOL, payload: { name } });
  }, []);

  const addPrompt = useCallback((prompt: RegisteredPromptEntry) => {
    dispatch({ type: actionTypes.ADD_PROMPT, payload: { prompt } });
  }, []);

  const removePrompt = useCallback((name: string) => {
    dispatch({ type: actionTypes.REMOVE_PROMPT, payload: { name } });
  }, []);

  const addResource = useCallback((resource: RegisteredResourceEntry) => {
    dispatch({ type: actionTypes.ADD_RESOURCE, payload: { resource } });
  }, []);

  const removeResource = useCallback((uri: string) => {
    dispatch({ type: actionTypes.REMOVE_RESOURCE, payload: { uri } });
  }, []);

  const addMessage = useCallback((message: AgentMessage) => {
    dispatch({ type: actionTypes.ADD_MESSAGE, payload: { message } });
  }, []);

  const updateLastAgentMessage = useCallback((token: string) => {
    dispatch({ type: actionTypes.UPDATE_LAST_AGENT_MESSAGE, payload: { token } });
  }, []);

  const clearMessages = useCallback(() => {
    dispatch({ type: actionTypes.CLEAR_MESSAGES });
  }, []);

  const setSwStatus = useCallback((status: SwStatus) => {
    dispatch({ type: actionTypes.SET_SW_STATUS, payload: { status } });
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
        addTool,
        removeTool,
        addPrompt,
        removePrompt,
        addResource,
        removeResource,
        addMessage,
        updateLastAgentMessage,
        clearMessages,
        setSwStatus,
      },
    }),
    [
      state,
      setPdfEntries,
      setPdfLoading,
      setPdfError,
      clearPdfEntries,
      fetchPdfFromApi,
      addTool,
      removeTool,
      addPrompt,
      removePrompt,
      addResource,
      removeResource,
      addMessage,
      updateLastAgentMessage,
      clearMessages,
      setSwStatus,
    ]
  );

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
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
