import { spawn } from 'child_process';

function run() {
  // Start the stdio runner via npx+tsx so TypeScript file runs directly
  const child = spawn('npx', ['tsx', 'scripts/mcp-stdio.ts'], { stdio: ['pipe', 'pipe', 'inherit'] });

  child.stdout.setEncoding('utf8');
  let buffer = '';
  child.stdout.on('data', (chunk) => {
    buffer += chunk;
    let idx;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      try {
        const obj = JSON.parse(line);
        console.log('RESPONSE:', JSON.stringify(obj, null, 2));
      } catch (err) {
        console.log('RAW:', line);
      }
    }
  });

  child.on('error', (err) => {
    console.error('Failed to start stdio runner:', err);
  });

  // Send a search request
  const searchReq = { id: '1', tool: 'search', input: { query: 'Next.js' } };
  child.stdin.write(JSON.stringify(searchReq) + '\n');

  // After a short delay, send a fetch request for the first sample id
  setTimeout(() => {
    const fetchReq = { id: '2', tool: 'fetch', input: { id: 'doc_1' } };
    child.stdin.write(JSON.stringify(fetchReq) + '\n');

    // Close stdin after sending
    setTimeout(() => child.stdin.end(), 200);
  }, 200);
}

run();
