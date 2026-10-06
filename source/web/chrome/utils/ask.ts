import fs from 'node:fs';
import path from 'node:path';

// When a script cannot find something on its own (e.g. an OTP in yopmail), it asks the person running the CLI.
// The CLI (cli/run.mjs) watches executions/<runId>/ask/, shows the question in the terminal and writes the answer back.
// Only active when the CLI is attached to a terminal (ASK_USER=1). Otherwise the script fails with a clear message.

let counter = 0;

export async function askUser(question: string): Promise<string> {
  if (process.env.ASK_USER !== '1') {
    throw new Error(`${question}\n(Not running in an interactive terminal, so the run cannot ask you. Re-run from a terminal to be prompted.)`);
  }
  const dir = path.resolve(process.cwd(), '..', '..', '..', 'executions', process.env.RUN_ID ?? 'local', 'ask');
  fs.mkdirSync(dir, { recursive: true });
  const id = `${Date.now()}-${++counter}`;
  fs.writeFileSync(path.join(dir, `${id}.req.json`), JSON.stringify({ question }));
  const answerFile = path.join(dir, `${id}.ans`);
  const deadline = Date.now() + Number(process.env.ASK_TIMEOUT_MS ?? 240000);
  while (Date.now() < deadline) {
    if (fs.existsSync(answerFile)) return fs.readFileSync(answerFile, 'utf8').trim();
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`No answer received within ${Number(process.env.ASK_TIMEOUT_MS ?? 240000) / 1000}s for: ${question}`);
}
