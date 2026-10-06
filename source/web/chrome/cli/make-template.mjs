// Creates fixtures/created-data.template.xlsx (headers only) for committing to git.
import ExcelJS from 'exceljs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const SHEETS = {
  Users: ['Role', 'Email', 'Password', 'Verified'],
  Entities: ['Entity Name', 'Type', 'Onboarding Status', 'Flow', 'Owner Email'],
  Relationships: ['Supplier', 'Buyer', 'Relationship Status'],
  Invoices: ['Invoice No', 'Supplier', 'Buyer', 'Amount', 'Invoice Status'],
  Payments: ['Invoice No', 'Card Type', 'Amount', 'Result'],
};
const wb = new ExcelJS.Workbook();
for (const [name, cols] of Object.entries(SHEETS)) {
  const ws = wb.addWorksheet(name);
  ws.addRow([...cols, 'Run ID', 'Created By', 'Date', 'Status']).font = { bold: true };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.columns.forEach((c) => (c.width = 22));
}
const out = path.resolve(here, '../fixtures/created-data.template.xlsx');
await wb.xlsx.writeFile(out);
console.log('Wrote', out);
