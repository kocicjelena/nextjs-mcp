// interfaces/actionTypes.ts

const actionTypes = {
  SET_PDF_LOADING: 'SET_PDF_LOADING',
  SET_PDF_ENTRIES: 'SET_PDF_ENTRIES',
  SET_PDF_ERROR: 'SET_PDF_ERROR',
  CLEAR_PDF_ENTRIES: 'CLEAR_PDF_ENTRIES',
} as const;

export default actionTypes;