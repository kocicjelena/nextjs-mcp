import { loadDocs } from "@/lib/mcp/store";
import { useCallback } from "react";

  export default function ExpectedResponse() {

    const temp = useCallback(async () => {
        try{ 
            const docs = await loadDocs();
            return docs.length ? docs : "";
        }
        catch {}
    }, []);

    const jsonStr = temp();

  return (
    <>  
    ({jsonStr})
</>)
  }