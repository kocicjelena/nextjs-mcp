// reducers/pdfReducer.ts

import actionTypes from '../interfaces/actionTypes';
import { ContextAction, IContextState } from '../interfaces/ContextType';
import { initialPdfEntry } from '../interfaces/PdfEntryType';

export const initialState: IContextState = {
  pdf: initialPdfEntry,
  webmcp: {
    tools: [],
    prompts: [],
    resources: [],
    messages: [],
    swStatus: 'idle',
  },
};

export const pdfReducer = (
  state: IContextState,
  action: ContextAction
): IContextState => {
  switch (action.type) {
    case actionTypes.SET_PDF_LOADING:
      return {
        ...state,
        pdf: {
          ...state.pdf,
          isLoading: action.payload.loading,
          error: action.payload.loading ? null : state.pdf.error,
        },
      };

    case actionTypes.SET_PDF_ENTRIES:
      return {
        ...state,
        pdf: {
          ...state.pdf,
          entries: action.payload.entries ?? [],
          isLoading: false,
          error: null,
        },
      };

    case actionTypes.SET_PDF_ERROR:
      return {
        ...state,
        pdf: {
          ...state.pdf,
          isLoading: false,
          error: action.payload.error ?? 'Unknown error',
        },
      };

    case actionTypes.CLEAR_PDF_ENTRIES:
      return { ...state, pdf: { ...initialPdfEntry } };

    case actionTypes.ADD_TOOL:
      return {
        ...state,
        webmcp: {
          ...state.webmcp,
          tools: [
            ...state.webmcp.tools.filter((t) => t.name !== action.payload.tool.name),
            action.payload.tool,
          ],
        },
      };

    case actionTypes.REMOVE_TOOL:
      return {
        ...state,
        webmcp: {
          ...state.webmcp,
          tools: state.webmcp.tools.filter((t) => t.name !== action.payload.name),
        },
      };

    case actionTypes.ADD_PROMPT:
      return {
        ...state,
        webmcp: {
          ...state.webmcp,
          prompts: [
            ...state.webmcp.prompts.filter((p) => p.name !== action.payload.prompt.name),
            action.payload.prompt,
          ],
        },
      };

    case actionTypes.REMOVE_PROMPT:
      return {
        ...state,
        webmcp: {
          ...state.webmcp,
          prompts: state.webmcp.prompts.filter((p) => p.name !== action.payload.name),
        },
      };

    case actionTypes.ADD_RESOURCE:
      return {
        ...state,
        webmcp: {
          ...state.webmcp,
          resources: [
            ...state.webmcp.resources.filter((r) => r.uri !== action.payload.resource.uri),
            action.payload.resource,
          ],
        },
      };

    case actionTypes.REMOVE_RESOURCE:
      return {
        ...state,
        webmcp: {
          ...state.webmcp,
          resources: state.webmcp.resources.filter((r) => r.uri !== action.payload.uri),
        },
      };

    case actionTypes.ADD_MESSAGE:
      return {
        ...state,
        webmcp: {
          ...state.webmcp,
          messages: [...state.webmcp.messages, action.payload.message],
        },
      };

    case actionTypes.UPDATE_LAST_AGENT_MESSAGE: {
      const messages = state.webmcp.messages;
      const last = messages[messages.length - 1];

      if (!last || last.role !== 'agent') {
        return {
          ...state,
          webmcp: {
            ...state.webmcp,
            messages: [
              ...messages,
              {
                id: `agent-${Date.now()}`,
                role: 'agent',
                content: action.payload.token,
                timestamp: new Date().toISOString(),
              },
            ],
          },
        };
      }

      return {
        ...state,
        webmcp: {
          ...state.webmcp,
          messages: [
            ...messages.slice(0, -1),
            {
              ...last,
              content: last.content + action.payload.token,
            },
          ],
        },
      };
    }

    case actionTypes.CLEAR_MESSAGES:
      return {
        ...state,
        webmcp: {
          ...state.webmcp,
          messages: [],
        },
      };

    case actionTypes.SET_SW_STATUS:
      return {
        ...state,
        webmcp: {
          ...state.webmcp,
          swStatus: action.payload.status,
        },
      };

    default:
      return state;
  }
};
