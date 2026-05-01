'use client'
//import DocToJson from "@/components/DocToJson/DocToJson";
import DocToJsonConverter from "@/components/json/DocToJsonConverter";
import ExpectedResponse from "@/components/mimic/Expected";


export default function DocToJsonPage() {
  return (<>
  <DocToJsonConverter />
  {/* <h1>Expected response calling search tool in AI chat</h1>
  <ExpectedResponse /> */}
  </>);
}