// scripts/discover-layout.ts
import { getSheetsClient, getSpreadsheetId } from '../lib/sheets/client';

async function main() {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const tabs = meta.data.sheets ?? [];

  for (const tab of tabs) {
    const title = tab.properties?.title ?? '(untitled)';
    const rowCount = tab.properties?.gridProperties?.rowCount ?? 0;
    console.log(`\n=== Tab: "${title}" (rows: ${rowCount}) ===`);

    const values = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${title}'!A1:N${Math.min(rowCount, 60)}`,
    });

    (values.data.values ?? []).forEach((row, i) => {
      if (row.some((cell) => String(cell).trim().length > 0)) {
        console.log(`row ${i + 1}:`, row);
      }
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
