// Loaded on demand — the sheet library is large and most admin visits
// never touch import/export.
let xlsxPromise;
const getXLSX = () => (xlsxPromise ||= import('xlsx'));

/**
 * Column order is the contract between the template, the export and the
 * import parser — keep all three in step.
 */
export const COLUMNS = [
  ['roomType', 'Room Type'],
  ['mealPlan', 'Meal Plan'],
  ['singlePrice', 'Single'],
  ['doublePrice', 'Double'],
  ['triplePrice', 'Triple'],
  ['quadPrice', 'Quad'],
  ['cnbPrice', 'CNB'],
  ['cwbPrice', 'CWB'],
  ['adultExtraBedPrice', 'Adult Extra Bed'],
  ['currency', 'Currency'],
  ['startDate', 'Start Date'],
  ['endDate', 'End Date'],
  ['status', 'Status'],
];

const HEADERS = COLUMNS.map(([, label]) => label);
const byLabel = new Map(COLUMNS.map(([key, label]) => [label.toLowerCase(), key]));

const ymd = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

async function download(rows, filename, notes) {
  const XLSX = await getXLSX();
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
  ws['!cols'] = HEADERS.map((h) => ({ wch: Math.max(12, h.length + 4) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Prices');
  if (notes?.length) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(notes.map((n) => [n])), 'How to fill');
  }
  XLSX.writeFile(wb, filename);
}

/** Blank sheet with two sample rows and a notes tab. */
export async function downloadTemplate(roomTypes = [], mealPlans = []) {
  const rt = roomTypes[0]?.name || 'Deluxe';
  const rt2 = roomTypes[1]?.name || rt;
  const mp = mealPlans[0]?.code || 'EP';
  const mp2 = mealPlans[1]?.code || mp;
  const sample = [
    [rt, mp, 3500, 4200, 5200, 6000, 800, 1500, 1800, 'INR', '2027-01-01', '2027-03-31', 'Active'],
    [rt2, mp2, 4200, 5000, 6100, 7000, 900, 1700, 2000, 'INR', '2027-04-01', '2027-06-30', 'Active'],
  ];
  await download(sample, 'hotel-price-template.xlsx', [
    'How to fill this sheet',
    '',
    '1. Keep the header row exactly as it is. Column order does not matter, the names do.',
    '2. Room Type must match a room type in the admin panel (e.g. ' + (roomTypes.map((r) => r.name).join(', ') || 'Standard, Deluxe') + ').',
    '3. Meal Plan must match a meal plan code (e.g. ' + (mealPlans.map((m) => m.code).join(', ') || 'EP, CP, MAP') + ').',
    '4. Dates must be YYYY-MM-DD. End Date cannot be before Start Date.',
    '5. Prices are numbers only — no currency symbols or commas.',
    '6. Status is Active or Inactive. Leave blank for Active.',
    '7. CNB = child no bed, CWB = child with bed.',
    '',
    'Re-importing a row with the same Room Type, Meal Plan and date range updates that rate instead of creating a duplicate.',
    '',
    'Delete these two sample rows before uploading.',
  ]);
}

/** Current rates for one hotel, in the same shape as the template. */
export async function exportPrices(hotelName, prices = []) {
  const rows = prices.map((p) => [
    p.roomTypeId?.name || '', p.mealPlanId?.code || '',
    p.singlePrice, p.doublePrice, p.triplePrice, p.quadPrice,
    p.cnbPrice, p.cwbPrice, p.adultExtraBedPrice,
    p.currency || 'INR', ymd(p.startDate), ymd(p.endDate), p.status || 'Active',
  ]);
  const safe = String(hotelName || 'hotel').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  await download(rows, `${safe}-prices.xlsx`);
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
  }).filter((r) => r.roomType || r.mealPlan || r.doublePrice);

  if (!rows.length) throw new Error('No usable rows — check the header names match the template');
  return rows;
}
