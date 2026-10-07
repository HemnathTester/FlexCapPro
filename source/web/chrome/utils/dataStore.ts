import ExcelJS from 'exceljs';
import fs from 'node:fs';
import path from 'node:path';

// Single reference workbook for data created by test runs, reusable on the next run.
// Every row also carries Run ID / Created By / Date / Status. Status is Valid or Consumed.

export const SHEETS = {
  Users: ['Role', 'Email', 'Password', 'Verified'],
  Entities: ['Entity Name', 'Type', 'Onboarding Status', 'Flow', 'Owner Email'],
  Relationships: ['Supplier', 'Buyer', 'Relationship Status'],
  Invoices: ['Invoice No', 'Supplier', 'Buyer', 'Amount', 'Invoice Status'],
  Payments: ['Invoice No', 'Card Type', 'Amount', 'Result'],
} as const;

export type SheetName = keyof typeof SHEETS;
export type Row = Record<string, string | number | boolean>;

const COMMON = ['Run ID', 'Created By', 'Date', 'Status'];

export const DEFAULT_FILE = path.resolve(process.cwd(), 'fixtures', 'created-data.xlsx');
const filePath = () => process.env.DATA_FILE ?? DEFAULT_FILE;

async function build(): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  const file = filePath();
  if (fs.existsSync(file)) {
    await wb.xlsx.readFile(file);
  }
  for (const [name, cols] of Object.entries(SHEETS)) {
    if (!wb.getWorksheet(name)) {
      const ws = wb.addWorksheet(name);
      ws.addRow([...cols, ...COMMON]).font = { bold: true };
      ws.views = [{ state: 'frozen', ySplit: 1 }];
      ws.columns.forEach((c) => (c.width = 22));
    }
  }
  return wb;
}

function headers(ws: ExcelJS.Worksheet): string[] {
  return (ws.getRow(1).values as unknown[]).slice(1).map(String);
}

function toObject(ws: ExcelJS.Worksheet, rowNumber: number): Row {
  const hs = headers(ws);
  const vals = (ws.getRow(rowNumber).values as unknown[]).slice(1);
  return Object.fromEntries(hs.map((h, i) => [h, (vals[i] ?? '') as string | number | boolean]));
}

function matches(row: Row, criteria: Partial<Row>): boolean {
  return Object.entries(criteria).every(([k, v]) => String(row[k]).toLowerCase() === String(v).toLowerCase());
}

// Serialise all writes in this process so rows are never lost.
let queue: Promise<unknown> = Promise.resolve();
const serial = <T>(fn: () => Promise<T>): Promise<T> => {
  const next = queue.then(fn, fn);
  queue = next.catch(() => undefined);
  return next;
};

async function save(wb: ExcelJS.Workbook) {
  const file = filePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  try {
    await wb.xlsx.writeFile(file);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'EBUSY' || (e as NodeJS.ErrnoException).code === 'EPERM') {
      throw new Error(`Cannot write ${file}: it is open in Excel. Close the file and re-run.`);
    }
    throw e;
  }
}

export const dataStore = {
  /** Record something a scenario created. `createdBy` is the scenario ID. */
  add(sheet: SheetName, row: Row, createdBy: string): Promise<void> {
    return serial(async () => {
      const wb = await build();
      const ws = wb.getWorksheet(sheet)!;
      const full: Row = {
        ...row,
        'Run ID': process.env.RUN_ID ?? 'local',
        'Created By': createdBy,
        Date: new Date().toISOString(),
        Status: 'Valid',
      };
      ws.addRow(headers(ws).map((h) => full[h] ?? ''));
      await save(wb);
    });
  },

  /** First still-Valid row matching the criteria, or undefined. With --fresh, rows from earlier runs are ignored (rows created in this run are still found). */
  find(sheet: SheetName, criteria: Partial<Row> = {}): Promise<Row | undefined> {
    return serial(async () => {
      const fresh = process.env.DATA_FRESH === '1';
      const thisRun = process.env.RUN_ID ?? 'local';
      const wb = await build();
      const ws = wb.getWorksheet(sheet)!;
      for (let r = 2; r <= ws.rowCount; r++) {
        const row = toObject(ws, r);
        if (fresh && row['Run ID'] !== thisRun) continue;
        if (row.Status === 'Valid' && matches(row, criteria)) return row;
      }
      return undefined;
    });
  },

  /** Mark matching Valid rows as Consumed (e.g. an invoice that has been paid and cannot be reused). */
  markConsumed(sheet: SheetName, criteria: Partial<Row>): Promise<number> {
    return serial(async () => {
      const wb = await build();
      const ws = wb.getWorksheet(sheet)!;
      const statusCol = headers(ws).indexOf('Status') + 1;
      let n = 0;
      for (let r = 2; r <= ws.rowCount; r++) {
        const row = toObject(ws, r);
        if (row.Status === 'Valid' && matches(row, criteria)) {
          ws.getRow(r).getCell(statusCol).value = 'Consumed';
          n++;
        }
      }
      if (n) await save(wb);
      return n;
    });
  },

  /** Update fields on matching Valid rows (e.g. Onboarding Status after approval). */
  update(sheet: SheetName, criteria: Partial<Row>, changes: Partial<Row>): Promise<number> {
    return serial(async () => {
      const wb = await build();
      const ws = wb.getWorksheet(sheet)!;
      const hs = headers(ws);
      let n = 0;
      for (let r = 2; r <= ws.rowCount; r++) {
        const row = toObject(ws, r);
        if (row.Status === 'Valid' && matches(row, criteria)) {
          for (const [k, v] of Object.entries(changes)) ws.getRow(r).getCell(hs.indexOf(k) + 1).value = v as ExcelJS.CellValue;
          n++;
        }
      }
      if (n) await save(wb);
      return n;
    });
  },
};
