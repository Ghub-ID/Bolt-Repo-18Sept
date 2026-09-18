export type RfpStatus = 'Open' | 'In Approval' | 'Awarded';

export interface RfpListItem {
  id: string;
  number: string;
  title: string;
  commodity: string;
  origin: string;
  destination: string;
  status: RfpStatus;
  bidCount?: string;
  awardedValue?: string;
  date: string;
}

export const rfpList: RfpListItem[] = [
  { id: '052', number: 'RFP-052', title: 'Specialty Rice → Denmark', commodity: 'Specialty Rice', origin: 'Mundra, IN', destination: 'Denmark (TBC)', status: 'Open', bidCount: '6 received · 1 pending · 1 declined', date: 'Sep 12, 2026' },
  { id: '048', number: 'RFP-048', title: 'Cotton Bales → Rotterdam', commodity: 'Cotton Bales', origin: 'Nhava Sheva, IN', destination: 'Rotterdam, NL', status: 'In Approval', bidCount: '6 bids', date: 'Sep 05, 2026' },
  { id: '045', number: 'RFP-045', title: 'Coffee Beans → Hamburg', commodity: 'Coffee Beans', origin: 'Mundra, IN', destination: 'Hamburg, DE', status: 'Awarded', awardedValue: '₹6.8L', date: 'Aug 28, 2026' },
  { id: '041', number: 'RFP-041', title: 'Basmati Rice → Dubai', commodity: 'Basmati Rice', origin: 'Kandla, IN', destination: 'Dubai, UAE', status: 'Awarded', awardedValue: '₹4.2L', date: 'Aug 14, 2026' },
  { id: '038', number: 'RFP-038', title: 'Raw Cotton → Mombasa', commodity: 'Raw Cotton', origin: 'Mundra, IN', destination: 'Mombasa, KE', status: 'Awarded', awardedValue: '₹18.6L', date: 'Jul 22, 2026' },
  { id: '033', number: 'RFP-033', title: 'Specialty Cocoa → Rotterdam', commodity: 'Specialty Cocoa', origin: 'Tuticorin, IN', destination: 'Rotterdam, NL', status: 'Awarded', date: 'Jul 01, 2026' },
  { id: '029', number: 'RFP-029', title: 'Bagged Rice → Dammam', commodity: 'Bagged Rice', origin: 'Mundra, IN', destination: 'Dammam, SA', status: 'Awarded', awardedValue: '₹3.1L', date: 'Jun 18, 2026' },
];

export interface VendorRow {
  id: string;
  name: string;
  badge?: string;
  rate: string;
  rateTone: 'good' | 'warn' | 'bad' | 'neutral';
  transit: string;
  transitTone: 'good' | 'warn' | 'bad' | 'neutral';
  freeDays: string;
  freeDaysTone: 'good' | 'warn' | 'bad' | 'neutral';
  questionnaire: string;
  questionnaireScore: 'full' | 'partial' | 'fail';
  format: string;
  confidence: string;
  confidenceTone: 'good' | 'warn' | 'bad' | 'neutral';
  benchmark: string;
  benchmarkTone: 'good' | 'warn' | 'bad' | 'neutral';
  issues: string;
  issuesTone: 'good' | 'warn' | 'bad' | 'neutral';
  status: 'active' | 'pending' | 'declined' | 'remind';
  rateComponents: { label: string; value: string }[];
}

export const rfp052Vendors: VendorRow[] = [
  {
    id: 'oceanlink',
    name: 'OceanLink',
    badge: 'Past · 4.2★',
    rate: '₹18,400 · Mid-range',
    rateTone: 'neutral',
    transit: '22-25d · Fast',
    transitTone: 'good',
    freeDays: '14 · OK',
    freeDaysTone: 'good',
    questionnaire: '8/8',
    questionnaireScore: 'full',
    format: 'Excel',
    confidence: 'Low risk',
    confidenceTone: 'good',
    benchmark: 'In line (past ₹18,100, market ₹17.8-19.2K)',
    benchmarkTone: 'good',
    issues: '—',
    issuesTone: 'good',
    status: 'active',
    rateComponents: [
      { label: 'Ocean Freight', value: '₹15,200/ton' },
      { label: 'BAF', value: '₹1,800/ton' },
      { label: 'THC Origin', value: '₹600/ton' },
      { label: 'THC Destination', value: '₹500/ton' },
      { label: 'Documentation', value: '₹150/ton' },
      { label: 'BL + ISPS', value: '₹150/ton' },
      { label: 'Total Rate/Ton', value: '₹18,400/ton' },
      { label: 'Rate per Container', value: '₹4,60,000/TEU' },
      { label: 'Currency', value: 'INR (all-in)' },
      { label: 'Rate Validity', value: '30 days' },
    ],
  },
  {
    id: 'gulf-freight',
    name: 'Gulf Freight',
    badge: 'Past · 3.8★',
    rate: '₹17,200 · Low price',
    rateTone: 'good',
    transit: '24-28d',
    transitTone: 'neutral',
    freeDays: '14 · OK',
    freeDaysTone: 'good',
    questionnaire: '7/8 (missing EU phyto)',
    questionnaireScore: 'partial',
    format: 'PDF',
    confidence: 'Med risk (USD conv, footnote)',
    confidenceTone: 'warn',
    benchmark: 'Below avg',
    benchmarkTone: 'warn',
    issues: '2 issues',
    issuesTone: 'warn',
    status: 'active',
    rateComponents: [
      { label: 'Ocean Freight', value: 'USD 180/ton' },
      { label: 'BAF', value: 'USD 22/ton' },
      { label: 'THC Origin', value: 'USD 8/ton' },
      { label: 'THC Destination', value: 'USD 9/ton' },
      { label: 'Documentation', value: 'USD 3/ton' },
      { label: 'BL + ISPS', value: 'USD 2/ton' },
      { label: 'Total Rate/Ton', value: 'USD 224/ton (≈ ₹17,200)' },
      { label: 'Rate per Container', value: 'USD 5,600/TEU' },
      { label: 'Currency', value: 'USD (converted)' },
      { label: 'Rate Validity', value: '21 days' },
    ],
  },
  {
    id: 'indoship',
    name: 'IndoShip',
    badge: 'Past · 4.0★',
    rate: '₹17,800',
    rateTone: 'neutral',
    transit: '26-30d',
    transitTone: 'neutral',
    freeDays: '14 · OK',
    freeDaysTone: 'good',
    questionnaire: '8/8',
    questionnaireScore: 'full',
    format: 'Word',
    confidence: 'Med risk (all-in ambiguous)',
    confidenceTone: 'warn',
    benchmark: 'In line',
    benchmarkTone: 'good',
    issues: '1 issue',
    issuesTone: 'warn',
    status: 'active',
    rateComponents: [
      { label: 'Ocean Freight', value: '₹14,600/ton (all-in)' },
      { label: 'BAF', value: 'Included' },
      { label: 'THC Origin', value: 'Included' },
      { label: 'THC Destination', value: 'Included' },
      { label: 'Documentation', value: 'Included' },
      { label: 'BL + ISPS', value: 'Included' },
      { label: 'Total Rate/Ton', value: '₹17,800/ton' },
      { label: 'Rate per Container', value: '₹4,45,000/TEU' },
      { label: 'Currency', value: 'INR (all-in)' },
      { label: 'Rate Validity', value: '30 days' },
    ],
  },
  {
    id: 'nordic-freight',
    name: 'Nordic Freight',
    badge: 'Past · 4.1★',
    rate: 'No bid received',
    rateTone: 'bad',
    transit: '—',
    transitTone: 'neutral',
    freeDays: '—',
    freeDaysTone: 'neutral',
    questionnaire: '—',
    questionnaireScore: 'fail',
    format: '—',
    confidence: '—',
    confidenceTone: 'neutral',
    benchmark: '—',
    benchmarkTone: 'neutral',
    issues: 'No bid received',
    issuesTone: 'bad',
    status: 'pending',
    rateComponents: [
      { label: 'Ocean Freight', value: '₹15,900/ton' },
      { label: 'BAF', value: '₹1,850/ton' },
      { label: 'THC Origin', value: '₹650/ton' },
      { label: 'THC Destination', value: '₹550/ton' },
      { label: 'Documentation', value: '₹75/ton' },
      { label: 'BL + ISPS', value: '₹75/ton' },
      { label: 'Total Rate/Ton', value: '₹19,100/ton' },
      { label: 'Rate per Container', value: '₹4,77,500/TEU' },
      { label: 'Currency', value: 'INR (all-in)' },
      { label: 'Rate Validity', value: '30 days' },
    ],
  },
  {
    id: 'swiftsea',
    name: 'SwiftSea',
    badge: 'New',
    rate: '₹15,600 · Lowest',
    rateTone: 'good',
    transit: '28-32d · Slow',
    transitTone: 'bad',
    freeDays: '7d · Below req!',
    freeDaysTone: 'bad',
    questionnaire: '5/8 (missing fumigation, phyto, on-time)',
    questionnaireScore: 'fail',
    format: 'Photo',
    confidence: 'High risk (OCR, 7 free days)',
    confidenceTone: 'bad',
    benchmark: 'No history',
    benchmarkTone: 'bad',
    issues: '3 issues',
    issuesTone: 'bad',
    status: 'active',
    rateComponents: [
      { label: 'Ocean Freight', value: '₹12,400/ton (OCR)' },
      { label: 'BAF', value: '₹1,900/ton (OCR)' },
      { label: 'THC Origin', value: '₹600/ton (OCR)' },
      { label: 'THC Destination', value: '₹400/ton (estimated)' },
      { label: 'Documentation', value: '₹150/ton (estimated)' },
      { label: 'BL + ISPS', value: '₹150/ton (estimated)' },
      { label: 'Total Rate/Ton', value: '₹15,600/ton' },
      { label: 'Rate per Container', value: '₹3,90,000/TEU' },
      { label: 'Currency', value: 'INR (assumed)' },
      { label: 'Rate Validity', value: '14 days' },
    ],
  },
  {
    id: 'maersk',
    name: 'Maersk',
    badge: 'New',
    rate: '₹21,300 · Highest',
    rateTone: 'bad',
    transit: '19-21d · Fast',
    transitTone: 'good',
    freeDays: '21 · Above req',
    freeDaysTone: 'good',
    questionnaire: '8/8',
    questionnaireScore: 'full',
    format: 'Excel',
    confidence: 'Low risk',
    confidenceTone: 'good',
    benchmark: 'Above market',
    benchmarkTone: 'warn',
    issues: '—',
    issuesTone: 'good',
    status: 'active',
    rateComponents: [
      { label: 'Ocean Freight', value: '₹17,600/ton' },
      { label: 'BAF', value: '₹2,100/ton' },
      { label: 'THC Origin', value: '₹700/ton' },
      { label: 'THC Destination', value: '₹600/ton' },
      { label: 'Documentation', value: '₹150/ton' },
      { label: 'BL + ISPS', value: '₹150/ton' },
      { label: 'Total Rate/Ton', value: '₹21,300/ton' },
      { label: 'Rate per Container', value: '₹5,32,500/TEU' },
      { label: 'Currency', value: 'INR (all-in)' },
      { label: 'Rate Validity', value: '30 days' },
    ],
  },
  {
    id: 'transocean',
    name: 'TransOcean',
    badge: 'Past',
    rate: '₹17,820 · Computed',
    rateTone: 'neutral',
    transit: '24-28d',
    transitTone: 'neutral',
    freeDays: '14 · OK',
    freeDaysTone: 'good',
    questionnaire: '—',
    questionnaireScore: 'fail',
    format: 'Email',
    confidence: 'Med risk (computed)',
    confidenceTone: 'warn',
    benchmark: '—',
    benchmarkTone: 'neutral',
    issues: '—',
    issuesTone: 'good',
    status: 'active',
    rateComponents: [],
  },
  {
    id: 'sealand',
    name: 'Sealand',
    badge: 'New',
    rate: 'Declined — no Denmark service',
    rateTone: 'bad',
    transit: '—',
    transitTone: 'neutral',
    freeDays: '—',
    freeDaysTone: 'neutral',
    questionnaire: '—',
    questionnaireScore: 'fail',
    format: '—',
    confidence: '—',
    confidenceTone: 'neutral',
    benchmark: '—',
    benchmarkTone: 'neutral',
    issues: 'No Denmark service',
    issuesTone: 'bad',
    status: 'declined',
    rateComponents: [],
  },
];

export const questionnaireQuestions = [
  'Bagged agri experience',
  'CHA at Mundra',
  'Fumigation cert',
  'EU phytosanitary',
  'On-time rate',
  'Invoice accuracy',
  'Dedicated CS contact',
  'Past client rating',
];

export const questionnaireVendors = ['OceanLink', 'Gulf Freight', 'IndoShip', 'Nordic Freight', 'SwiftSea', 'Maersk'];

// ✓ = full, ⚠ = partial, ✗ = missing
export const questionnaireMatrix: ('full' | 'partial' | 'fail')[][] = [
  ['full', 'full', 'full', 'full', 'full', 'full'],     // Bagged agri experience
  ['full', 'full', 'full', 'full', 'partial', 'full'],   // CHA at Mundra
  ['full', 'partial', 'full', 'full', 'fail', 'full'],   // Fumigation cert
  ['full', 'fail', 'full', 'full', 'fail', 'full'],      // EU phytosanitary
  ['full', 'full', 'full', 'full', 'fail', 'full'],      // On-time rate
  ['full', 'full', 'partial', 'full', 'partial', 'full'], // Invoice accuracy
  ['full', 'full', 'full', 'full', 'partial', 'full'],   // Dedicated CS contact
  ['full', 'full', 'full', 'full', 'partial', 'full'],   // Past client rating
];

export interface CharterField {
  name: string;
  value: string;
  confidence: number;
  source: string;
  sourceType: 'pdf' | 'excel' | 'word' | 'photo' | 'email';
  group: 1 | 2 | 3 | 4;
}

export function charterFieldsForVendor(vendorId: string): CharterField[] {
  const base: CharterField[] = [
    { name: 'Ocean Freight', value: '₹15,200/ton', confidence: 0.95, source: 'Excel · cell B4', sourceType: 'excel', group: 1 },
    { name: 'BAF', value: '₹1,800/ton', confidence: 0.92, source: 'Excel · cell B5', sourceType: 'excel', group: 1 },
    { name: 'THC Origin', value: '₹600/ton', confidence: 0.90, source: 'Excel · cell B6', sourceType: 'excel', group: 1 },
    { name: 'THC Destination', value: '₹500/ton', confidence: 0.88, source: 'Excel · cell B7', sourceType: 'excel', group: 1 },
    { name: 'Documentation', value: '₹150/ton', confidence: 0.91, source: 'Excel · cell B8', sourceType: 'excel', group: 1 },
    { name: 'BL+ISPS', value: '₹150/ton', confidence: 0.91, source: 'Excel · cell B9', sourceType: 'excel', group: 1 },
    { name: 'Total Rate/Ton', value: '₹18,400/ton', confidence: 0.97, source: 'Excel · computed', sourceType: 'excel', group: 1 },
    { name: 'Rate per Container', value: '₹4,60,000/TEU', confidence: 0.95, source: 'Excel · cell B11', sourceType: 'excel', group: 1 },
    { name: 'Currency', value: 'INR (all-in)', confidence: 0.98, source: 'Excel · header', sourceType: 'excel', group: 1 },
    { name: 'Rate Validity', value: '30 days', confidence: 0.93, source: 'Excel · cell B12', sourceType: 'excel', group: 1 },
    { name: 'Vessel Name', value: 'MV Star Ocean', confidence: 0.85, source: 'Excel · cell B14', sourceType: 'excel', group: 2 },
    { name: 'Vessel DWT', value: '28,500 MT', confidence: 0.86, source: 'Excel · cell B15', sourceType: 'excel', group: 2 },
    { name: 'Vessel Flag', value: 'Panama', confidence: 0.82, source: 'Excel · cell B16', sourceType: 'excel', group: 2 },
    { name: 'Laycan Start', value: 'Oct 05, 2026', confidence: 0.90, source: 'Excel · cell B17', sourceType: 'excel', group: 2 },
    { name: 'Laycan End', value: 'Oct 12, 2026', confidence: 0.90, source: 'Excel · cell B18', sourceType: 'excel', group: 2 },
    { name: 'Transit Time', value: '22-25 days', confidence: 0.88, source: 'Excel · cell B19', sourceType: 'excel', group: 2 },
    { name: 'Load Rate (MT/day)', value: '6,000', confidence: 0.80, source: 'Excel · cell B20', sourceType: 'excel', group: 2 },
    { name: 'Discharge Rate (MT/day)', value: '5,500', confidence: 0.80, source: 'Excel · cell B21', sourceType: 'excel', group: 2 },
    { name: 'Free Days (Detention/Demurrage)', value: '14 days', confidence: 0.92, source: 'Excel · cell B23', sourceType: 'excel', group: 3 },
    { name: 'Demurrage Rate (PDPR)', value: 'USD 12,000 PDPR', confidence: 0.87, source: 'Excel · cell B24', sourceType: 'excel', group: 3 },
    { name: 'Dispatch Rate', value: 'USD 6,000 PDPR (half demurrage)', confidence: 0.84, source: 'Excel · cell B25', sourceType: 'excel', group: 3 },
    { name: 'Laytime Allowance', value: '72 hours', confidence: 0.85, source: 'Excel · cell B26', sourceType: 'excel', group: 3 },
    { name: 'NOR Clause', value: 'NOR at anchorage, 6 hrs turnaround', confidence: 0.78, source: 'Excel · cell B27', sourceType: 'excel', group: 3 },
    { name: 'Payment Terms', value: '30 days from BL date', confidence: 0.91, source: 'Excel · cell B28', sourceType: 'excel', group: 3 },
    { name: 'Volume Discount Threshold', value: '5% above 5,000 MT', confidence: 0.82, source: 'Excel · cell B29', sourceType: 'excel', group: 3 },
    { name: 'Fumigation Certificate (Y/N)', value: 'Yes', confidence: 0.94, source: 'Excel · cell B31', sourceType: 'excel', group: 4 },
    { name: 'Phytosanitary Certificate (Y/N)', value: 'Yes', confidence: 0.93, source: 'Excel · cell B32', sourceType: 'excel', group: 4 },
    { name: 'Hold Cleanliness Standard', value: 'Food grade, IMO class clean', confidence: 0.86, source: 'Excel · cell B33', sourceType: 'excel', group: 4 },
    { name: 'Stowage Factor', value: '1.4 MT/m³', confidence: 0.83, source: 'Excel · cell B34', sourceType: 'excel', group: 4 },
    { name: 'Container Type/Count', value: '20\' FCL × 25', confidence: 0.89, source: 'Excel · cell B35', sourceType: 'excel', group: 4 },
  ];

  if (vendorId === 'gulf-freight') {
    return base.map((f) => {
      if (f.name === 'Ocean Freight') return { ...f, value: 'USD 180/ton', source: 'PDF · page 2 · table row 3', sourceType: 'pdf' as const, confidence: 0.88 };
      if (f.name === 'BAF') return { ...f, value: 'USD 22/ton', source: 'PDF · page 2 · table row 4', sourceType: 'pdf' as const, confidence: 0.85 };
      if (f.name === 'THC Origin') return { ...f, value: 'USD 8/ton', source: 'PDF · page 2 · table row 5', sourceType: 'pdf' as const, confidence: 0.82 };
      if (f.name === 'THC Destination') return { ...f, value: 'USD 9/ton', source: 'PDF · page 2 · table row 6', sourceType: 'pdf' as const, confidence: 0.82 };
      if (f.name === 'Documentation') return { ...f, value: 'USD 3/ton', source: 'PDF · page 2 · table row 7', sourceType: 'pdf' as const, confidence: 0.80 };
      if (f.name === 'BL+ISPS') return { ...f, value: 'USD 2/ton', source: 'PDF · page 2 · table row 8', sourceType: 'pdf' as const, confidence: 0.80 };
      if (f.name === 'Total Rate/Ton') return { ...f, value: 'USD 224/ton (≈ ₹17,200)', source: 'PDF · computed', sourceType: 'pdf' as const, confidence: 0.82 };
      if (f.name === 'Rate per Container') return { ...f, value: 'USD 5,600/TEU', source: 'PDF · page 2 · table row 10', sourceType: 'pdf' as const, confidence: 0.85 };
      if (f.name === 'Currency') return { ...f, value: 'USD (converted)', source: 'PDF · page 1 · header', sourceType: 'pdf' as const, confidence: 0.75 };
      if (f.name === 'Rate Validity') return { ...f, value: '21 days', source: 'PDF · page 1 · clause 4', sourceType: 'pdf' as const, confidence: 0.84 };
      if (f.name === 'Vessel Name') return { ...f, value: 'MV Gulf Star', confidence: 0.76, source: 'PDF · page 1 · §2', sourceType: 'pdf' as const };
      if (f.name === 'Vessel DWT') return { ...f, value: '25,000 MT', confidence: 0.74, source: 'PDF · page 1 · §2', sourceType: 'pdf' as const };
      if (f.name === 'Vessel Flag') return { ...f, value: 'Liberia', confidence: 0.72, source: 'PDF · page 1 · §2', sourceType: 'pdf' as const };
      if (f.name === 'Laycan Start') return { ...f, value: 'Oct 08, 2026', confidence: 0.79, source: 'PDF · page 1 · §3', sourceType: 'pdf' as const };
      if (f.name === 'Laycan End') return { ...f, value: 'Oct 15, 2026', confidence: 0.79, source: 'PDF · page 1 · §3', sourceType: 'pdf' as const };
      if (f.name === 'Transit Time') return { ...f, value: '24-28 days', confidence: 0.81, source: 'PDF · page 1 · §3', sourceType: 'pdf' as const };
      if (f.name === 'Load Rate (MT/day)') return { ...f, value: '5,000', confidence: 0.70, source: 'PDF · page 2 · §5', sourceType: 'pdf' as const };
      if (f.name === 'Discharge Rate (MT/day)') return { ...f, value: '4,800', confidence: 0.70, source: 'PDF · page 2 · §5', sourceType: 'pdf' as const };
      if (f.name === 'Free Days (Detention/Demurrage)') return { ...f, value: '14 days', confidence: 0.88, source: 'PDF · page 2 · §6', sourceType: 'pdf' as const };
      if (f.name === 'Demurrage Rate (PDPR)') return { ...f, value: 'USD 18,000 PDPR', confidence: 0.60, source: 'PDF · page 3 · footnote', sourceType: 'pdf' as const };
      if (f.name === 'Dispatch Rate') return { ...f, value: 'USD 9,000 PDPR', confidence: 0.58, source: 'PDF · page 3 · footnote', sourceType: 'pdf' as const };
      if (f.name === 'Laytime Allowance') return { ...f, value: '96 hours', confidence: 0.77, source: 'PDF · page 2 · §6', sourceType: 'pdf' as const };
      if (f.name === 'NOR Clause') return { ...f, value: 'NOR at berth, 12 hrs turnaround', confidence: 0.65, source: 'PDF · page 3 · §7', sourceType: 'pdf' as const };
      if (f.name === 'Payment Terms') return { ...f, value: '45 days from BL date', confidence: 0.83, source: 'PDF · page 3 · §8', sourceType: 'pdf' as const };
      if (f.name === 'Volume Discount Threshold') return { ...f, value: '3% above 3,000 MT', confidence: 0.68, source: 'PDF · page 3 · §8', sourceType: 'pdf' as const };
      if (f.name === 'Fumigation Certificate (Y/N)') return { ...f, value: 'Yes', confidence: 0.85, source: 'PDF · page 4 · annex A', sourceType: 'pdf' as const };
      if (f.name === 'Phytosanitary Certificate (Y/N)') return { ...f, value: 'Not mentioned', confidence: 0.40, source: 'PDF · not found in annex', sourceType: 'pdf' as const };
      if (f.name === 'Hold Cleanliness Standard') return { ...f, value: 'Food grade', confidence: 0.72, source: 'PDF · page 4 · annex A', sourceType: 'pdf' as const };
      if (f.name === 'Stowage Factor') return { ...f, value: '1.5 MT/m³', confidence: 0.69, source: 'PDF · page 4 · annex A', sourceType: 'pdf' as const };
      if (f.name === 'Container Type/Count') return { ...f, value: '20\' FCL × 22', confidence: 0.81, source: 'PDF · page 1 · §1', sourceType: 'pdf' as const };
      return f;
    });
  }

  if (vendorId === 'swiftsea') {
    return base.map((f) => {
      if (f.name === 'Ocean Freight') return { ...f, value: '₹12,400/ton', source: 'Photo · OCR · image 1', sourceType: 'photo' as const, confidence: 0.55 };
      if (f.name === 'BAF') return { ...f, value: '₹1,900/ton', source: 'Photo · OCR · image 1', sourceType: 'photo' as const, confidence: 0.52 };
      if (f.name === 'THC Origin') return { ...f, value: '₹600/ton', source: 'Photo · OCR · image 1', sourceType: 'photo' as const, confidence: 0.50 };
      if (f.name === 'THC Destination') return { ...f, value: '₹400/ton (estimated)', source: 'Photo · OCR · partial', sourceType: 'photo' as const, confidence: 0.40 };
      if (f.name === 'Documentation') return { ...f, value: '₹150/ton (estimated)', source: 'Photo · OCR · partial', sourceType: 'photo' as const, confidence: 0.42 };
      if (f.name === 'BL+ISPS') return { ...f, value: '₹150/ton (estimated)', source: 'Photo · OCR · partial', sourceType: 'photo' as const, confidence: 0.42 };
      if (f.name === 'Total Rate/Ton') return { ...f, value: '₹15,600/ton', source: 'Photo · OCR · computed', sourceType: 'photo' as const, confidence: 0.48 };
      if (f.name === 'Rate per Container') return { ...f, value: '₹3,90,000/TEU', source: 'Photo · OCR · image 2', sourceType: 'photo' as const, confidence: 0.46 };
      if (f.name === 'Currency') return { ...f, value: 'INR (assumed)', source: 'Photo · OCR · not stated', sourceType: 'photo' as const, confidence: 0.30 };
      if (f.name === 'Rate Validity') return { ...f, value: '14 days', source: 'Photo · OCR · image 1', sourceType: 'photo' as const, confidence: 0.58 };
      if (f.name === 'Vessel Name') return { ...f, value: 'MV Swift Express', confidence: 0.62, source: 'Photo · OCR · image 2', sourceType: 'photo' as const };
      if (f.name === 'Vessel DWT') return { ...f, value: '22,000 MT', confidence: 0.55, source: 'Photo · OCR · image 2', sourceType: 'photo' as const };
      if (f.name === 'Vessel Flag') return { ...f, value: 'Not found', confidence: 0.10, source: 'Photo · OCR · unreadable', sourceType: 'photo' as const };
      if (f.name === 'Laycan Start') return { ...f, value: 'Oct 10, 2026', confidence: 0.60, source: 'Photo · OCR · image 3', sourceType: 'photo' as const };
      if (f.name === 'Laycan End') return { ...f, value: 'Oct 18, 2026', confidence: 0.58, source: 'Photo · OCR · image 3', sourceType: 'photo' as const };
      if (f.name === 'Transit Time') return { ...f, value: '28-32 days', confidence: 0.64, source: 'Photo · OCR · image 3', sourceType: 'photo' as const };
      if (f.name === 'Load Rate (MT/day)') return { ...f, value: '4,500', confidence: 0.48, source: 'Photo · OCR · partial', sourceType: 'photo' as const };
      if (f.name === 'Discharge Rate (MT/day)') return { ...f, value: '4,200', confidence: 0.46, source: 'Photo · OCR · partial', sourceType: 'photo' as const };
      if (f.name === 'Free Days (Detention/Demurrage)') return { ...f, value: '7 days', confidence: 0.50, source: 'Photo · OCR · 2 fields unreadable', sourceType: 'photo' as const };
      if (f.name === 'Demurrage Rate (PDPR)') return { ...f, value: 'NOT FOUND', confidence: 0.0, source: 'Photo · OCR · not detected', sourceType: 'photo' as const };
      if (f.name === 'Dispatch Rate') return { ...f, value: 'NOT FOUND', confidence: 0.0, source: 'Photo · OCR · not detected', sourceType: 'photo' as const };
      if (f.name === 'Laytime Allowance') return { ...f, value: 'NOT FOUND', confidence: 0.0, source: 'Photo · OCR · not detected', sourceType: 'photo' as const };
      if (f.name === 'NOR Clause') return { ...f, value: 'Not stated', confidence: 0.15, source: 'Photo · OCR · image 3', sourceType: 'photo' as const };
      if (f.name === 'Payment Terms') return { ...f, value: '15 days', confidence: 0.52, source: 'Photo · OCR · image 1', sourceType: 'photo' as const };
      if (f.name === 'Volume Discount Threshold') return { ...f, value: 'Not mentioned', confidence: 0.20, source: 'Photo · OCR', sourceType: 'photo' as const };
      if (f.name === 'Fumigation Certificate (Y/N)') return { ...f, value: 'Not found', confidence: 0.0, source: 'Photo · OCR · not detected', sourceType: 'photo' as const };
      if (f.name === 'Phytosanitary Certificate (Y/N)') return { ...f, value: 'Not found', confidence: 0.0, source: 'Photo · OCR · not detected', sourceType: 'photo' as const };
      if (f.name === 'Hold Cleanliness Standard') return { ...f, value: 'Not stated', confidence: 0.25, source: 'Photo · OCR', sourceType: 'photo' as const };
      if (f.name === 'Stowage Factor') return { ...f, value: 'Not stated', confidence: 0.25, source: 'Photo · OCR', sourceType: 'photo' as const };
      if (f.name === 'Container Type/Count') return { ...f, value: '20\' FCL × 20 (est.)', confidence: 0.38, source: 'Photo · OCR · partial', sourceType: 'photo' as const };
      return f;
    });
  }

  if (vendorId === 'indoship') {
    return base.map((f) => {
      if (f.sourceType === 'excel') return { ...f, sourceType: 'word' as const, source: f.source.replace('Excel', 'Word') };
      if (f.name === 'Ocean Freight') return { ...f, value: '₹14,600/ton (all-in)', confidence: 0.72, source: 'Word · ¶3, line 2', sourceType: 'word' as const };
      if (f.name === 'BAF') return { ...f, value: 'Included', confidence: 0.65, source: 'Word · ¶3, line 2', sourceType: 'word' as const };
      if (f.name === 'THC Origin') return { ...f, value: 'Included', confidence: 0.65, source: 'Word · ¶3, line 2', sourceType: 'word' as const };
      if (f.name === 'THC Destination') return { ...f, value: 'Included', confidence: 0.65, source: 'Word · ¶3, line 2', sourceType: 'word' as const };
      if (f.name === 'Documentation') return { ...f, value: 'Included', confidence: 0.65, source: 'Word · ¶3, line 2', sourceType: 'word' as const };
      if (f.name === 'BL+ISPS') return { ...f, value: 'Included', confidence: 0.65, source: 'Word · ¶3, line 2', sourceType: 'word' as const };
      if (f.name === 'Total Rate/Ton') return { ...f, value: '₹17,800/ton', confidence: 0.78, source: 'Word · ¶3, line 2', sourceType: 'word' as const };
      if (f.name === 'Rate per Container') return { ...f, value: '₹4,45,000/TEU', confidence: 0.76, source: 'Word · ¶3, line 3', sourceType: 'word' as const };
      if (f.name === 'Currency') return { ...f, value: 'INR (all-in)', confidence: 0.85, source: 'Word · ¶2', sourceType: 'word' as const };
      if (f.name === 'Rate Validity') return { ...f, value: '30 days', confidence: 0.82, source: 'Word · ¶5', sourceType: 'word' as const };
      if (f.name === 'Demurrage Rate (PDPR)') return { ...f, value: 'USD 14,000 PDPR', confidence: 0.75, source: 'Word · ¶7', sourceType: 'word' as const };
      if (f.name === 'NOR Clause') return { ...f, value: 'NOR at berth, 8 hrs turnaround', confidence: 0.68, source: 'Word · ¶8', sourceType: 'word' as const };
      return f;
    });
  }

  if (vendorId === 'nordic-freight') {
    return base.map((f) => ({ ...f, value: f.value.replace('18,400', '19,100').replace('4,60,000', '4,77,500') }));
  }

  if (vendorId === 'maersk') {
    return base.map((f) => ({ ...f, value: f.value.replace('18,400', '21,300').replace('4,60,000', '5,32,500').replace('14 days', '21 days') }));
  }

  return base;
}

export const charterGroupNames: Record<number, string> = {
  1: 'Freight Components',
  2: 'Vessel & Voyage',
  3: 'Terms & Conditions',
  4: 'Compliance & Cargo',
};

export interface InvoiceItem {
  id: string;
  number: string;
  vendor: string;
  route: string;
  amount: string;
  status: 'Open' | 'Discrepancy' | 'Detention Alert' | 'Active Dispute' | 'Recovered';
  date: string;
}

export const invoices: InvoiceItem[] = [
  { id: 'INV-2041', number: 'INV-2041', vendor: 'OceanLink', route: 'RFP-045 · Hamburg', amount: '₹6,82,000', status: 'Open', date: 'Sep 14, 2026' },
  { id: 'INV-2038', number: 'INV-2038', vendor: 'Gulf Freight', route: 'RFP-038 · Mombasa', amount: '₹18,60,000', status: 'Discrepancy', date: 'Sep 12, 2026' },
  { id: 'INV-2035', number: 'INV-2035', vendor: 'IndoShip', route: 'RFP-041 · Dubai', amount: '₹4,20,000', status: 'Detention Alert', date: 'Sep 10, 2026' },
  { id: 'INV-2031', number: 'INV-2031', vendor: 'Nordic Freight', route: 'RFP-029 · Dammam', amount: '₹3,10,000', status: 'Active Dispute', date: 'Sep 08, 2026' },
  { id: 'INV-2028', number: 'INV-2028', vendor: 'Maersk', route: 'RFP-045 · Hamburg', amount: '₹5,50,000', status: 'Recovered', date: 'Sep 05, 2026' },
  { id: 'INV-2025', number: 'INV-2025', vendor: 'TransOcean', route: 'RFP-033 · Rotterdam', amount: '₹2,95,000', status: 'Open', date: 'Sep 03, 2026' },
  { id: 'INV-2020', number: 'INV-2020', vendor: 'SwiftSea', route: 'RFP-029 · Dammam', amount: '₹1,80,000', status: 'Discrepancy', date: 'Aug 30, 2026' },
];

export interface ActivityItem {
  id: number;
  icon: string;
  title: string;
  detail: string;
  time: string;
}

export const activities: ActivityItem[] = [
  { id: 1, icon: 'clipboard', title: 'New bid received', detail: 'Maersk submitted a bid for RFP-052 (Specialty Rice → Denmark)', time: '12 min ago' },
  { id: 2, icon: 'check', title: 'RFP awarded', detail: 'RFP-045 (Coffee Beans → Hamburg) awarded to OceanLink at ₹6.8L', time: '2 hours ago' },
  { id: 3, icon: 'alert', title: 'Clarification sent', detail: 'Rate breakdown clarification sent to Gulf Freight for RFP-052', time: '3 hours ago' },
  { id: 4, icon: 'file', title: 'Invoice discrepancy flagged', detail: 'INV-2038 (Gulf Freight) — USD conversion mismatch of ₹14,200', time: '5 hours ago' },
  { id: 5, icon: 'clock', title: 'Bid overdue', detail: 'TransOcean bid for RFP-052 is 2 days overdue — reminder sent', time: '6 hours ago' },
  { id: 6, icon: 'shield', title: 'Compliance review completed', detail: 'Nordic Freight passed full questionnaire (8/8) for RFP-052', time: '8 hours ago' },
  { id: 7, icon: 'x', title: 'Vendor declined', detail: 'Sealand declined RFP-052 — no Denmark service coverage', time: '1 day ago' },
  { id: 8, icon: 'trending', title: 'Detention recovered', detail: '₹48,000 recovered from INV-2028 (Maersk) — detention dispute resolved', time: '2 days ago' },
];

export const analystChatSeed = [
  { role: 'analyst' as const, text: 'Hi Neel Rao, I have all 6 active bids for RFP-052 loaded. What would you like to dig into?' },
  { role: 'user' as const, text: 'Which vendor offers the best value considering rate and transit?' },
  { role: 'analyst' as const, text: 'OceanLink is the best value pick — ₹18,400/ton, 22-25 day transit, 14 free days, full 8/8 questionnaire, and in line with their past rate of ₹18,100 and the market range of ₹17.8-19.2K. SwiftSea is cheapest at ₹15,600 but carries high extraction risk (photo OCR) and only 7 free days, which is below your 14-day requirement.' },
  { role: 'user' as const, text: 'What are the risks with Gulf Freight?' },
  { role: 'analyst' as const, text: 'Three flags on Gulf Freight: (1) USD-denominated rate requires conversion, creating FX exposure; (2) their demurrage rate of USD 18,000 PDPR was extracted from a PDF footnote at 0.60 confidence — worth confirming; (3) they are missing the EU phytosanitary certificate, which risks a customs hold at Copenhagen. I would send a clarification before approval.' },
];
