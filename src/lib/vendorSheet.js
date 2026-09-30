// Loaded on demand — the sheet library is large and most admin visits
// never touch import/export.
let xlsxPromise;
const getXLSX = () => (xlsxPromise ||= import('xlsx'));

/**
 * Column order is the contract between the template, the export and the
 * import parser — keep all three in step.
 */
export const COLUMNS = [
  ['companyName', 'Company Name'],
  ['vendorType', 'Vendor Type'],
  ['contactPerson', 'Contact Person'],
  ['phones', 'Phones'],
  ['emails', 'Emails'],
  ['website', 'Website'],
  ['sectors', 'Sectors'],
  ['gstPan', 'GST / PAN'],
  ['bankName', 'Bank Name'],
  ['accountNumber', 'Account Number'],
  ['ifsc', 'IFSC'],
  ['upi', 'UPI'],
  ['status', 'Status'],
];

const HEADERS = COLUMNS.map(([, label]) => label);
const byLabel = new Map(COLUMNS.map(([key, label]) => [label.toLowerCase(), key]));

const joined = (v) => (Array.isArray(v) ? v.join(', ') : v || '');

async function download(rows, filename, notes) {
  const XLSX = await getXLSX();
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
  ws['!cols'] = HEADERS.map((h) => ({ wch: Math.max(14, h.length + 6) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Vendors');
  if (notes?.length) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(notes.map((n) => [n])), 'How to fill');
  }
  XLSX.writeFile(wb, filename);
}

const row = (v) => COLUMNS.map(([key]) => {
  if (key === 'phones' || key === 'emails' || key === 'sectors') return joined(v[key]);
  return v[key] ?? '';
});

/**
 * Every vendor as it stands today. This is the sheet to fill in: the company
 * names are already correct, so only the blank columns need typing.
 */
export async function exportVendors(vendors = []) {
  await download(vendors.map(row), 'vendors.xlsx', [
    'How to fill this sheet',
    '',
    '1. Keep the header row exactly as it is. Column order does not matter, the names do.',
    '2. Do NOT change Company Name — it is how each row is matched to an existing vendor.',
    '3. Fill in the blank columns (GST / PAN, Bank Name, Account Number, IFSC, UPI).',
    '4. Phones, Emails and Sectors take several values separated by commas.',
    '5. Leave a cell blank to keep whatever is already saved. Blank never erases.',
    '6. Status is Active or Inactive.',
    '',
    'Upload the finished sheet with the Import button on the Vendors page.',
  ]);
}

/** Header-only sheet with one worked example. */
export async function downloadTemplate(vendors = []) {
  const example = vendors[0]?.companyName || 'Example Travels';
  await download([[example, 'Cab', 'Contact name', '9876543210', 'name@example.com',
    'www.example.com', 'Delhi, Rajasthan', '', '', '', '', '', 'Active']],
  'vendor-template.xlsx', [
    'How to fill this sheet',
    '',
    '1. Company Name must match a vendor that already exists in the admin panel.',
    '2. Blank cells are ignored, so you can fill only the columns you care about.',
    '3. Phones, Emails and Sectors take several values separated by commas.',
    '',
    'Export the full vendor list instead if you want every company name pre-filled.',
    'Delete the example row before uploading.',
  ]);
}

/** Parse an uploaded .xlsx/.csv back into rows the API understands. */
export async function parseSheet(file) {
  const XLSX = await getXLSX();
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) throw new Error('That file has no sheets');

  const raw = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
  if (!raw.length) throw new Error('That sheet has no rows');

  const rows = raw.map((r) => {
    const out = {};
    for (const [label, value] of Object.entries(r)) {
      const key = byLabel.get(String(label).trim().toLowerCase());
      if (key) out[key] = typeof value === 'string' ? value.trim() : value;
    }
    return out;
  }).filter((r) => String(r.companyName || '').trim());

  if (!rows.length) throw new Error('No usable rows — check that a Company Name column is present');
  return rows;
}
