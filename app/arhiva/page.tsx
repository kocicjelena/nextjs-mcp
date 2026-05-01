'use client'
//import DocToJson from "@/components/DocToJson/DocToJson";
import DocToJsonConverter from "@/components/json/DocToJsonConverter";
import ExpectedResponse from "@/components/mimic/Expected";
import Link from "next/link";


export default function DocToJsonPage() {
  return (<>
  <Link href='/'>back</Link>
  <DocToJsonConverter />
  {/* <h1>Expected response calling search tool in AI chat</h1>
  <ExpectedResponse /> */}
  </>);
}