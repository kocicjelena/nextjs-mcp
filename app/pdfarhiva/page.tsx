'use client'

import { useEffect } from 'react';
import DocToJsonConverter from "@/components/json/DocToJsonConverter";
import PdfToJsonConverter from "@/components/json/PdfToJsonConverterAI";
import { useContextState, useContextActions } from "@/context/GlobalContext";
import Link from 'next/link';

export default function PdfToJsonPage() {
  // const { pdf } = useContextState();
  // const { fetchPdfFromApi } = useContextActions();

  // Fetch existing entries from API on mount
  // useEffect(() => {
  //   if (pdf.entries.length === 0 && !pdf.isLoading) {
  //     fetchPdfFromApi();
  //   }
  // }, [pdf.entries.length, pdf.isLoading, fetchPdfFromApi]);

  return (<><PdfToJsonConverter />   <Link href='/'>back</Link></>);
}