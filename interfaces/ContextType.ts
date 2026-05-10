// interfaces/ContextType.ts

import { PdfEntryType } from './PdfEntryType';
import actionTypes from './actionTypes';
import type {
  RegisteredToolEntry,
  RegisteredPromptEntry,
  RegisteredResourceEntry,
  AgentMessage,
  SwStatus,
} from '@/lib/types/navigator.types';
import type { DocEntry } from '@/types/doc-entry';

export interface IWebMcpState {
  tools: RegisteredToolEntry[];
  prompts: RegisteredPromptEntry[];
  resources: RegisteredResourceEntry[];
  messages: AgentMessage[];
  swStatus: SwStatus;
}

export interface IContextState {
  pdf: PdfEntryType;
  webmcp: IWebMcpState;
}

export interface IContextAction {
  setPdfEntries: (entries: DocEntry[]) => void;
  setPdfLoading: (loading: boolean) => void;
  setPdfError: (error: string | null) => void;
  clearPdfEntries: () => void;
  fetchPdfFromApi: () => Promise<void>;

  addTool: (tool: RegisteredToolEntry) => void;
  removeTool: (name: string) => void;
  addPrompt: (prompt: RegisteredPromptEntry) => void;
  removePrompt: (name: string) => void;
  addResource: (resource: RegisteredResourceEntry) => void;
  removeResource: (uri: string) => void;
  addMessage: (message: AgentMessage) => void;
  updateLastAgentMessage: (token: string) => void;
  clearMessages: () => void;
  setSwStatus: (status: SwStatus) => void;
}

export type PdfAction =
  | { type: typeof actionTypes.SET_PDF_LOADING; payload: { loading: boolean } }
  | {
      type: typeof actionTypes.SET_PDF_ENTRIES;
      payload: { entries: DocEntry[] };
    }
  | { type: typeof actionTypes.SET_PDF_ERROR; payload: { error: string } }
  | { type: typeof actionTypes.CLEAR_PDF_ENTRIES };

export type WebMcpAction =
  | { type: typeof actionTypes.ADD_TOOL; payload: { tool: RegisteredToolEntry } }
  | { type: typeof actionTypes.REMOVE_TOOL; payload: { name: string } }
  | {
      type: typeof actionTypes.ADD_PROMPT;
      payload: { prompt: RegisteredPromptEntry };
    }
  | { type: typeof actionTypes.REMOVE_PROMPT; payload: { name: string } }
  | {
      type: typeof actionTypes.ADD_RESOURCE;
      payload: { resource: RegisteredResourceEntry };
    }
  | { type: typeof actionTypes.REMOVE_RESOURCE; payload: { uri: string } }
  | { type: typeof actionTypes.ADD_MESSAGE; payload: { message: AgentMessage } }
  | {
      type: typeof actionTypes.UPDATE_LAST_AGENT_MESSAGE;
      payload: { token: string };
    }
  | { type: typeof actionTypes.CLEAR_MESSAGES }
  | { type: typeof actionTypes.SET_SW_STATUS; payload: { status: SwStatus } };

export type ContextAction = PdfAction | WebMcpAction;
