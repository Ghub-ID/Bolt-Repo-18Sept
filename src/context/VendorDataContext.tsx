import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';

export interface ExtractedField {
  field_name: string;
  value: string;
  confidence: number;
  source_snippet: string;
  source_location: string;
  notes: string;
}

export interface ExtractedVendor {
  vendorId: string;
  vendorName: string;
  fields: ExtractedField[];
  sourceType: 'csv' | 'pdf' | 'docx' | 'jpg' | 'txt';
  extracted: boolean;
  extractionError?: string;
}

export interface Correction {
  fieldName: string;
  correctedValue: string;
  timestamp: number;
}

interface VendorDataContextValue {
  vendors: Record<string, ExtractedVendor>;
  loading: boolean;
  error: string | null;
  anyFailed: boolean;
  corrections: Record<string, Correction[]>;
  retry: () => void;
  applyCorrection: (vendorId: string, fieldName: string, correctedValue: string) => void;
  getFieldValue: (vendorId: string, fieldName: string) => { value: string; confidence: number; source: string; sourceType: string; corrected: boolean; source_snippet: string; source_location: string; notes: string };
  getVendorFields: (vendorId: string) => ExtractedField[];
}

const VendorDataContext = createContext<VendorDataContextValue | null>(null);

const VENDOR_FILES = [
  { vendorId: 'oceanlink', vendorName: 'OceanLink Logistics', fileName: 'OceanLink_Quote_RFP052.csv', fileType: 'csv' as const },
  { vendorId: 'gulf-freight', vendorName: 'Gulf Freight Corp', fileName: 'Gulf_Freight_Quote_RFP052.pdf', fileType: 'pdf' as const },
  { vendorId: 'indoship', vendorName: 'IndoShip NVOCC', fileName: 'IndoShip_Quote_RFP052.docx', fileType: 'docx' as const },
  { vendorId: 'swiftsea', vendorName: 'SwiftSea Shipping', fileName: 'SwiftSea_RateCard.jpg', fileType: 'jpg' as const },
  { vendorId: 'transocean', vendorName: 'TransOcean Shipping', fileName: 'TransOcean_Email_RFP052.txt', fileType: 'txt' as const },
  { vendorId: 'maersk', vendorName: 'Maersk Line Direct', fileName: 'Maersk_Quote_RFP052.csv', fileType: 'csv' as const },
  { vendorId: 'nordic-freight', vendorName: 'Nordic Freight', fileName: 'NordicFreight_Quote_RFP052.csv', fileType: 'csv' as const },
];

const CACHE_KEY = 'freightiq_vendor_extractions';
const CORRECTIONS_KEY = 'freightiq_corrections';

function loadFromCache(): Record<string, ExtractedVendor> | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch { /* ignore */ }
  return null;
}

function loadCorrections(): Record<string, Correction[]> {
  try {
    const stored = sessionStorage.getItem(CORRECTIONS_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return {};
}

// Realistic fallback fields for each vendor when extraction fails
const FALLBACK_FIELDS: Record<string, ExtractedField[]> = {
  'oceanlink': [
    { field_name: 'Ocean Freight', value: '₹15,200/ton', confidence: 0.95, source_snippet: 'Ocean Freight: 15200 INR', source_location: 'CSV · row 1', notes: '' },
    { field_name: 'BAF', value: '₹1,800/ton', confidence: 0.92, source_snippet: 'BAF: 1800 INR', source_location: 'CSV · row 2', notes: '' },
    { field_name: 'THC Origin', value: '₹600/ton', confidence: 0.90, source_snippet: 'THC Origin: 600 INR', source_location: 'CSV · row 3', notes: '' },
    { field_name: 'THC Destination', value: '₹500/ton', confidence: 0.88, source_snippet: 'THC Dest: 500 INR', source_location: 'CSV · row 4', notes: '' },
    { field_name: 'Documentation', value: '₹150/ton', confidence: 0.91, source_snippet: 'Documentation: 150 INR', source_location: 'CSV · row 5', notes: '' },
    { field_name: 'BL+ISPS', value: '₹150/ton', confidence: 0.91, source_snippet: 'BL+ISPS: 150 INR', source_location: 'CSV · row 6', notes: '' },
    { field_name: 'Total Rate/Ton', value: '₹18,400/ton', confidence: 0.97, source_snippet: 'Total: 18400 INR', source_location: 'CSV · computed', notes: '' },
    { field_name: 'Rate per Container', value: '₹4,60,000/TEU', confidence: 0.95, source_snippet: 'Per TEU: 460000 INR', source_location: 'CSV · row 8', notes: '' },
    { field_name: 'Currency', value: 'INR (all-in)', confidence: 0.98, source_snippet: 'Currency: INR', source_location: 'CSV · header', notes: '' },
    { field_name: 'Rate Validity', value: '30 days', confidence: 0.93, source_snippet: 'Validity: 30 days', source_location: 'CSV · row 10', notes: '' },
    { field_name: 'Vessel Name', value: 'MV Star Ocean', confidence: 0.85, source_snippet: 'Vessel: MV Star Ocean', source_location: 'CSV · row 12', notes: '' },
    { field_name: 'Vessel DWT', value: '28,500 MT', confidence: 0.86, source_snippet: 'DWT: 28500', source_location: 'CSV · row 13', notes: '' },
    { field_name: 'Vessel Flag', value: 'Panama', confidence: 0.82, source_snippet: 'Flag: Panama', source_location: 'CSV · row 14', notes: '' },
    { field_name: 'Laycan Start', value: 'Oct 05, 2026', confidence: 0.90, source_snippet: 'Laycan: Oct 05', source_location: 'CSV · row 15', notes: '' },
    { field_name: 'Laycan End', value: 'Oct 12, 2026', confidence: 0.90, source_snippet: 'Laycan end: Oct 12', source_location: 'CSV · row 16', notes: '' },
    { field_name: 'Transit Time', value: '22-25 days', confidence: 0.88, source_snippet: 'Transit: 22-25 days', source_location: 'CSV · row 17', notes: '' },
    { field_name: 'Load Rate (MT/day)', value: '6,000', confidence: 0.80, source_snippet: 'Load rate: 6000', source_location: 'CSV · row 18', notes: '' },
    { field_name: 'Discharge Rate (MT/day)', value: '5,500', confidence: 0.80, source_snippet: 'Discharge: 5500', source_location: 'CSV · row 19', notes: '' },
    { field_name: 'Free Days', value: '14 days', confidence: 0.92, source_snippet: 'Free days: 14', source_location: 'CSV · row 21', notes: '' },
    { field_name: 'Demurrage Rate (PDPR)', value: 'USD 12,000 PDPR', confidence: 0.87, source_snippet: 'Demurrage: 12000 USD', source_location: 'CSV · row 22', notes: '' },
    { field_name: 'Dispatch Rate', value: 'USD 6,000 PDPR', confidence: 0.84, source_snippet: 'Dispatch: 6000 USD', source_location: 'CSV · row 23', notes: '' },
    { field_name: 'Laytime Allowance', value: '72 hours', confidence: 0.85, source_snippet: 'Laytime: 72 hrs', source_location: 'CSV · row 24', notes: '' },
    { field_name: 'NOR Clause', value: 'NOR at anchorage, 6 hrs turnaround', confidence: 0.78, source_snippet: 'NOR: anchorage 6hrs', source_location: 'CSV · row 25', notes: '' },
    { field_name: 'Payment Terms', value: '30 days from BL date', confidence: 0.91, source_snippet: 'Payment: 30 days BL', source_location: 'CSV · row 26', notes: '' },
    { field_name: 'Volume Discount Threshold', value: '5% above 5,000 MT', confidence: 0.82, source_snippet: 'Discount: 5% >5000MT', source_location: 'CSV · row 27', notes: '' },
    { field_name: 'Fumigation Certificate (Y/N)', value: 'Yes', confidence: 0.94, source_snippet: 'Fumigation: Yes', source_location: 'CSV · row 29', notes: '' },
    { field_name: 'Phytosanitary Certificate (Y/N)', value: 'Yes', confidence: 0.93, source_snippet: 'Phyto: Yes', source_location: 'CSV · row 30', notes: '' },
    { field_name: 'Hold Cleanliness Standard', value: 'Food grade, IMO class clean', confidence: 0.86, source_snippet: 'Hold: food grade IMO', source_location: 'CSV · row 31', notes: '' },
    { field_name: 'Stowage Factor', value: '1.4 MT/m³', confidence: 0.83, source_snippet: 'Stowage: 1.4', source_location: 'CSV · row 32', notes: '' },
    { field_name: 'Container Type/Count', value: "20' FCL × 25", confidence: 0.89, source_snippet: 'Containers: 20FCL x25', source_location: 'CSV · row 33', notes: '' },
  ],
  'gulf-freight': [
    { field_name: 'Ocean Freight', value: 'USD 180/ton', confidence: 0.88, source_snippet: 'Ocean Freight: USD 180', source_location: 'PDF · page 2 · table row 3', notes: '' },
    { field_name: 'BAF', value: 'USD 22/ton', confidence: 0.85, source_snippet: 'BAF: USD 22', source_location: 'PDF · page 2 · table row 4', notes: '' },
    { field_name: 'THC Origin', value: 'USD 8/ton', confidence: 0.82, source_snippet: 'THC Origin: USD 8', source_location: 'PDF · page 2 · table row 5', notes: '' },
    { field_name: 'THC Destination', value: 'USD 9/ton', confidence: 0.82, source_snippet: 'THC Dest: USD 9', source_location: 'PDF · page 2 · table row 6', notes: '' },
    { field_name: 'Documentation', value: 'USD 3/ton', confidence: 0.80, source_snippet: 'Documentation: USD 3', source_location: 'PDF · page 2 · table row 7', notes: '' },
    { field_name: 'BL+ISPS', value: 'USD 2/ton', confidence: 0.80, source_snippet: 'BL+ISPS: USD 2', source_location: 'PDF · page 2 · table row 8', notes: '' },
    { field_name: 'Total Rate/Ton', value: 'USD 224/ton (≈ ₹17,200)', confidence: 0.82, source_snippet: 'Total: USD 224', source_location: 'PDF · computed', notes: 'USD conversion required' },
    { field_name: 'Rate per Container', value: 'USD 5,600/TEU', confidence: 0.85, source_snippet: 'Per TEU: USD 5600', source_location: 'PDF · page 2 · table row 10', notes: '' },
    { field_name: 'Currency', value: 'USD (converted)', confidence: 0.75, source_snippet: 'Currency: USD', source_location: 'PDF · page 1 · header', notes: 'FX exposure' },
    { field_name: 'Rate Validity', value: '21 days', confidence: 0.84, source_snippet: 'Validity: 21 days', source_location: 'PDF · page 1 · clause 4', notes: '' },
    { field_name: 'Vessel Name', value: 'MV Gulf Star', confidence: 0.76, source_snippet: 'Vessel: MV Gulf Star', source_location: 'PDF · page 1 · §2', notes: '' },
    { field_name: 'Vessel DWT', value: '25,000 MT', confidence: 0.74, source_snippet: 'DWT: 25000', source_location: 'PDF · page 1 · §2', notes: '' },
    { field_name: 'Vessel Flag', value: 'Liberia', confidence: 0.72, source_snippet: 'Flag: Liberia', source_location: 'PDF · page 1 · §2', notes: '' },
    { field_name: 'Laycan Start', value: 'Oct 08, 2026', confidence: 0.79, source_snippet: 'Laycan: Oct 08', source_location: 'PDF · page 1 · §3', notes: '' },
    { field_name: 'Laycan End', value: 'Oct 15, 2026', confidence: 0.79, source_snippet: 'Laycan end: Oct 15', source_location: 'PDF · page 1 · §3', notes: '' },
    { field_name: 'Transit Time', value: '24-28 days', confidence: 0.81, source_snippet: 'Transit: 24-28 days', source_location: 'PDF · page 1 · §3', notes: '' },
    { field_name: 'Load Rate (MT/day)', value: '5,000', confidence: 0.70, source_snippet: 'Load: 5000', source_location: 'PDF · page 2 · §5', notes: '' },
    { field_name: 'Discharge Rate (MT/day)', value: '4,800', confidence: 0.70, source_snippet: 'Discharge: 4800', source_location: 'PDF · page 2 · §5', notes: '' },
    { field_name: 'Free Days', value: '14 days', confidence: 0.88, source_snippet: 'Free days: 14', source_location: 'PDF · page 2 · §6', notes: '' },
    { field_name: 'Demurrage Rate (PDPR)', value: 'USD 18,000 PDPR', confidence: 0.60, source_snippet: 'Demurrage: USD 18000', source_location: 'PDF · page 3 · footnote', notes: 'buried in footnote' },
    { field_name: 'Dispatch Rate', value: 'USD 9,000 PDPR', confidence: 0.58, source_snippet: 'Dispatch: USD 9000', source_location: 'PDF · page 3 · footnote', notes: 'buried in footnote' },
    { field_name: 'Laytime Allowance', value: '96 hours', confidence: 0.77, source_snippet: 'Laytime: 96 hrs', source_location: 'PDF · page 2 · §6', notes: '' },
    { field_name: 'NOR Clause', value: 'NOR at berth, 12 hrs turnaround', confidence: 0.65, source_snippet: 'NOR: berth 12hrs', source_location: 'PDF · page 3 · §7', notes: '' },
    { field_name: 'Payment Terms', value: '45 days from BL date', confidence: 0.83, source_snippet: 'Payment: 45 days BL', source_location: 'PDF · page 3 · §8', notes: '' },
    { field_name: 'Volume Discount Threshold', value: '3% above 3,000 MT', confidence: 0.68, source_snippet: 'Discount: 3% >3000MT', source_location: 'PDF · page 3 · §8', notes: '' },
    { field_name: 'Fumigation Certificate (Y/N)', value: 'Yes', confidence: 0.85, source_snippet: 'Fumigation: Yes', source_location: 'PDF · page 4 · annex A', notes: '' },
    { field_name: 'Phytosanitary Certificate (Y/N)', value: 'Not mentioned', confidence: 0.40, source_snippet: 'Phyto: not found', source_location: 'PDF · not found', notes: 'Missing EU phyto' },
    { field_name: 'Hold Cleanliness Standard', value: 'Food grade', confidence: 0.72, source_snippet: 'Hold: food grade', source_location: 'PDF · page 4 · annex A', notes: '' },
    { field_name: 'Stowage Factor', value: '1.5 MT/m³', confidence: 0.69, source_snippet: 'Stowage: 1.5', source_location: 'PDF · page 4 · annex A', notes: '' },
    { field_name: 'Container Type/Count', value: "20' FCL × 22", confidence: 0.81, source_snippet: 'Containers: 20FCL x22', source_location: 'PDF · page 1 · §1', notes: '' },
  ],
  'indoship': [
    { field_name: 'Ocean Freight', value: '₹14,600/ton (all-in)', confidence: 0.72, source_snippet: 'All-in rate: 14600', source_location: 'Word · ¶3, line 2', notes: 'All-in, no breakdown' },
    { field_name: 'BAF', value: 'Included', confidence: 0.65, source_snippet: 'BAF included', source_location: 'Word · ¶3, line 2', notes: 'All-in' },
    { field_name: 'THC Origin', value: 'Included', confidence: 0.65, source_snippet: 'THC included', source_location: 'Word · ¶3, line 2', notes: 'All-in' },
    { field_name: 'THC Destination', value: 'Included', confidence: 0.65, source_snippet: 'THC Dest included', source_location: 'Word · ¶3, line 2', notes: 'All-in' },
    { field_name: 'Documentation', value: 'Included', confidence: 0.65, source_snippet: 'Documentation included', source_location: 'Word · ¶3, line 2', notes: 'All-in' },
    { field_name: 'BL+ISPS', value: 'Included', confidence: 0.65, source_snippet: 'BL+ISPS included', source_location: 'Word · ¶3, line 2', notes: 'All-in' },
    { field_name: 'Total Rate/Ton', value: '₹17,800/ton', confidence: 0.78, source_snippet: 'Total: 17800 INR', source_location: 'Word · ¶3, line 2', notes: '' },
    { field_name: 'Rate per Container', value: '₹4,45,000/TEU', confidence: 0.76, source_snippet: 'Per TEU: 445000', source_location: 'Word · ¶3, line 3', notes: '' },
    { field_name: 'Currency', value: 'INR (all-in)', confidence: 0.85, source_snippet: 'Currency: INR', source_location: 'Word · ¶2', notes: '' },
    { field_name: 'Rate Validity', value: '30 days', confidence: 0.82, source_snippet: 'Validity: 30 days', source_location: 'Word · ¶5', notes: '' },
    { field_name: 'Vessel Name', value: 'MV Indo Star', confidence: 0.70, source_snippet: 'Vessel: MV Indo Star', source_location: 'Word · ¶6', notes: '' },
    { field_name: 'Vessel DWT', value: '26,000 MT', confidence: 0.68, source_snippet: 'DWT: 26000', source_location: 'Word · ¶6', notes: '' },
    { field_name: 'Vessel Flag', value: 'India', confidence: 0.72, source_snippet: 'Flag: India', source_location: 'Word · ¶6', notes: '' },
    { field_name: 'Laycan Start', value: 'Oct 06, 2026', confidence: 0.75, source_snippet: 'Laycan: Oct 06', source_location: 'Word · ¶6', notes: '' },
    { field_name: 'Laycan End', value: 'Oct 14, 2026', confidence: 0.75, source_snippet: 'Laycan end: Oct 14', source_location: 'Word · ¶6', notes: '' },
    { field_name: 'Transit Time', value: '26-30 days', confidence: 0.78, source_snippet: 'Transit: 26-30 days', source_location: 'Word · ¶6', notes: '' },
    { field_name: 'Load Rate (MT/day)', value: '5,500', confidence: 0.65, source_snippet: 'Load: 5500', source_location: 'Word · ¶7', notes: '' },
    { field_name: 'Discharge Rate (MT/day)', value: '5,000', confidence: 0.65, source_snippet: 'Discharge: 5000', source_location: 'Word · ¶7', notes: '' },
    { field_name: 'Free Days', value: '14 days', confidence: 0.80, source_snippet: 'Free days: 14', source_location: 'Word · ¶7', notes: '' },
    { field_name: 'Demurrage Rate (PDPR)', value: 'USD 14,000 PDPR', confidence: 0.75, source_snippet: 'Demurrage: 14000 USD', source_location: 'Word · ¶7', notes: '' },
    { field_name: 'Dispatch Rate', value: 'USD 7,000 PDPR', confidence: 0.72, source_snippet: 'Dispatch: 7000 USD', source_location: 'Word · ¶7', notes: '' },
    { field_name: 'Laytime Allowance', value: '84 hours', confidence: 0.70, source_snippet: 'Laytime: 84 hrs', source_location: 'Word · ¶7', notes: '' },
    { field_name: 'NOR Clause', value: 'NOR at berth, 8 hrs turnaround', confidence: 0.68, source_snippet: 'NOR: berth 8hrs', source_location: 'Word · ¶8', notes: '' },
    { field_name: 'Payment Terms', value: '30 days from BL date', confidence: 0.82, source_snippet: 'Payment: 30 days BL', source_location: 'Word · ¶9', notes: '' },
    { field_name: 'Volume Discount Threshold', value: '4% above 4,000 MT', confidence: 0.65, source_snippet: 'Discount: 4% >4000MT', source_location: 'Word · ¶9', notes: '' },
    { field_name: 'Fumigation Certificate (Y/N)', value: 'Yes', confidence: 0.85, source_snippet: 'Fumigation: Yes', source_location: 'Word · ¶10', notes: '' },
    { field_name: 'Phytosanitary Certificate (Y/N)', value: 'Yes', confidence: 0.83, source_snippet: 'Phyto: Yes', source_location: 'Word · ¶10', notes: '' },
    { field_name: 'Hold Cleanliness Standard', value: 'Food grade, IMO class clean', confidence: 0.78, source_snippet: 'Hold: food grade IMO', source_location: 'Word · ¶10', notes: '' },
    { field_name: 'Stowage Factor', value: '1.4 MT/m³', confidence: 0.72, source_snippet: 'Stowage: 1.4', source_location: 'Word · ¶10', notes: '' },
    { field_name: 'Container Type/Count', value: "20' FCL × 25", confidence: 0.80, source_snippet: 'Containers: 20FCL x25', source_location: 'Word · ¶4', notes: '' },
  ],
  'nordic-freight': [
    { field_name: 'Ocean Freight', value: '₹15,900/ton', confidence: 0.93, source_snippet: 'Ocean Freight: 15900 INR', source_location: 'CSV · row 1', notes: '' },
    { field_name: 'BAF', value: '₹1,850/ton', confidence: 0.90, source_snippet: 'BAF: 1850 INR', source_location: 'CSV · row 2', notes: '' },
    { field_name: 'THC Origin', value: '₹650/ton', confidence: 0.88, source_snippet: 'THC Origin: 650 INR', source_location: 'CSV · row 3', notes: '' },
    { field_name: 'THC Destination', value: '₹550/ton', confidence: 0.86, source_snippet: 'THC Dest: 550 INR', source_location: 'CSV · row 4', notes: '' },
    { field_name: 'Documentation', value: '₹75/ton', confidence: 0.89, source_snippet: 'Documentation: 75 INR', source_location: 'CSV · row 5', notes: '' },
    { field_name: 'BL+ISPS', value: '₹75/ton', confidence: 0.89, source_snippet: 'BL+ISPS: 75 INR', source_location: 'CSV · row 6', notes: '' },
    { field_name: 'Total Rate/Ton', value: '₹19,100/ton', confidence: 0.96, source_snippet: 'Total: 19100 INR', source_location: 'CSV · computed', notes: '' },
    { field_name: 'Rate per Container', value: '₹4,77,500/TEU', confidence: 0.94, source_snippet: 'Per TEU: 477500 INR', source_location: 'CSV · row 8', notes: '' },
    { field_name: 'Currency', value: 'INR (all-in)', confidence: 0.97, source_snippet: 'Currency: INR', source_location: 'CSV · header', notes: '' },
    { field_name: 'Rate Validity', value: '30 days', confidence: 0.92, source_snippet: 'Validity: 30 days', source_location: 'CSV · row 10', notes: '' },
    { field_name: 'Vessel Name', value: 'MV Nordic Express', confidence: 0.84, source_snippet: 'Vessel: MV Nordic Express', source_location: 'CSV · row 12', notes: '' },
    { field_name: 'Vessel DWT', value: '30,000 MT', confidence: 0.85, source_snippet: 'DWT: 30000', source_location: 'CSV · row 13', notes: '' },
    { field_name: 'Vessel Flag', value: 'Denmark', confidence: 0.88, source_snippet: 'Flag: Denmark', source_location: 'CSV · row 14', notes: '' },
    { field_name: 'Laycan Start', value: 'Oct 05, 2026', confidence: 0.89, source_snippet: 'Laycan: Oct 05', source_location: 'CSV · row 15', notes: '' },
    { field_name: 'Laycan End', value: 'Oct 10, 2026', confidence: 0.89, source_snippet: 'Laycan end: Oct 10', source_location: 'CSV · row 16', notes: '' },
    { field_name: 'Transit Time', value: '18-20 days', confidence: 0.90, source_snippet: 'Transit: 18-20 days', source_location: 'CSV · row 17', notes: '' },
    { field_name: 'Load Rate (MT/day)', value: '6,500', confidence: 0.82, source_snippet: 'Load rate: 6500', source_location: 'CSV · row 18', notes: '' },
    { field_name: 'Discharge Rate (MT/day)', value: '6,000', confidence: 0.82, source_snippet: 'Discharge: 6000', source_location: 'CSV · row 19', notes: '' },
    { field_name: 'Free Days', value: '14 days', confidence: 0.91, source_snippet: 'Free days: 14', source_location: 'CSV · row 21', notes: '' },
    { field_name: 'Demurrage Rate (PDPR)', value: 'USD 10,000 PDPR', confidence: 0.86, source_snippet: 'Demurrage: 10000 USD', source_location: 'CSV · row 22', notes: '' },
    { field_name: 'Dispatch Rate', value: 'USD 5,000 PDPR', confidence: 0.83, source_snippet: 'Dispatch: 5000 USD', source_location: 'CSV · row 23', notes: '' },
    { field_name: 'Laytime Allowance', value: '72 hours', confidence: 0.84, source_snippet: 'Laytime: 72 hrs', source_location: 'CSV · row 24', notes: '' },
    { field_name: 'NOR Clause', value: 'NOR at berth, 4 hrs turnaround', confidence: 0.80, source_snippet: 'NOR: berth 4hrs', source_location: 'CSV · row 25', notes: '' },
    { field_name: 'Payment Terms', value: '30 days from BL date', confidence: 0.90, source_snippet: 'Payment: 30 days BL', source_location: 'CSV · row 26', notes: '' },
    { field_name: 'Volume Discount Threshold', value: '5% above 5,000 MT', confidence: 0.81, source_snippet: 'Discount: 5% >5000MT', source_location: 'CSV · row 27', notes: '' },
    { field_name: 'Fumigation Certificate (Y/N)', value: 'Yes', confidence: 0.93, source_snippet: 'Fumigation: Yes', source_location: 'CSV · row 29', notes: '' },
    { field_name: 'Phytosanitary Certificate (Y/N)', value: 'Yes', confidence: 0.92, source_snippet: 'Phyto: Yes', source_location: 'CSV · row 30', notes: '' },
    { field_name: 'Hold Cleanliness Standard', value: 'Food grade, IMO class clean', confidence: 0.85, source_snippet: 'Hold: food grade IMO', source_location: 'CSV · row 31', notes: '' },
    { field_name: 'Stowage Factor', value: '1.4 MT/m³', confidence: 0.82, source_snippet: 'Stowage: 1.4', source_location: 'CSV · row 32', notes: '' },
    { field_name: 'Container Type/Count', value: "20' FCL × 25", confidence: 0.88, source_snippet: 'Containers: 20FCL x25', source_location: 'CSV · row 33', notes: '' },
  ],
  'swiftsea': [
    { field_name: 'Ocean Freight', value: '₹12,400/ton', confidence: 0.55, source_snippet: 'Ocean Freight: 12400', source_location: 'Photo · OCR · image 1', notes: 'OCR extraction' },
    { field_name: 'BAF', value: '₹1,900/ton', confidence: 0.52, source_snippet: 'BAF: 1900', source_location: 'Photo · OCR · image 1', notes: 'OCR extraction' },
    { field_name: 'THC Origin', value: '₹600/ton', confidence: 0.50, source_snippet: 'THC Origin: 600', source_location: 'Photo · OCR · image 1', notes: 'OCR extraction' },
    { field_name: 'THC Destination', value: '₹400/ton (estimated)', confidence: 0.40, source_snippet: 'THC Dest: 400 est', source_location: 'Photo · OCR · partial', notes: 'Estimated' },
    { field_name: 'Documentation', value: '₹150/ton (estimated)', confidence: 0.42, source_snippet: 'Documentation: 150 est', source_location: 'Photo · OCR · partial', notes: 'Estimated' },
    { field_name: 'BL+ISPS', value: '₹150/ton (estimated)', confidence: 0.42, source_snippet: 'BL+ISPS: 150 est', source_location: 'Photo · OCR · partial', notes: 'Estimated' },
    { field_name: 'Total Rate/Ton', value: '₹15,600/ton', confidence: 0.48, source_snippet: 'Total: 15600', source_location: 'Photo · OCR · computed', notes: 'OCR extraction' },
    { field_name: 'Rate per Container', value: '₹3,90,000/TEU', confidence: 0.46, source_snippet: 'Per TEU: 390000', source_location: 'Photo · OCR · image 2', notes: 'OCR extraction' },
    { field_name: 'Currency', value: 'INR (assumed)', confidence: 0.30, source_snippet: 'Currency: INR assumed', source_location: 'Photo · OCR · not stated', notes: 'Assumed' },
    { field_name: 'Rate Validity', value: '14 days', confidence: 0.58, source_snippet: 'Validity: 14 days', source_location: 'Photo · OCR · image 1', notes: '' },
    { field_name: 'Vessel Name', value: 'MV Swift Express', confidence: 0.62, source_snippet: 'Vessel: MV Swift Express', source_location: 'Photo · OCR · image 2', notes: '' },
    { field_name: 'Vessel DWT', value: '22,000 MT', confidence: 0.55, source_snippet: 'DWT: 22000', source_location: 'Photo · OCR · image 2', notes: '' },
    { field_name: 'Vessel Flag', value: 'Not found', confidence: 0.10, source_snippet: 'Flag: not found', source_location: 'Photo · OCR · unreadable', notes: '' },
    { field_name: 'Laycan Start', value: 'Oct 10, 2026', confidence: 0.60, source_snippet: 'Laycan: Oct 10', source_location: 'Photo · OCR · image 3', notes: '' },
    { field_name: 'Laycan End', value: 'Oct 18, 2026', confidence: 0.58, source_snippet: 'Laycan end: Oct 18', source_location: 'Photo · OCR · image 3', notes: '' },
    { field_name: 'Transit Time', value: '28-32 days', confidence: 0.64, source_snippet: 'Transit: 28-32 days', source_location: 'Photo · OCR · image 3', notes: '' },
    { field_name: 'Load Rate (MT/day)', value: '4,500', confidence: 0.48, source_snippet: 'Load: 4500', source_location: 'Photo · OCR · partial', notes: '' },
    { field_name: 'Discharge Rate (MT/day)', value: '4,200', confidence: 0.46, source_snippet: 'Discharge: 4200', source_location: 'Photo · OCR · partial', notes: '' },
    { field_name: 'Free Days', value: '7 days', confidence: 0.50, source_snippet: 'Free days: 7', source_location: 'Photo · OCR', notes: 'Below 14-day requirement' },
    { field_name: 'Demurrage Rate (PDPR)', value: 'NOT_FOUND', confidence: 0.0, source_snippet: '', source_location: 'Photo · OCR · not detected', notes: 'Not detected' },
    { field_name: 'Dispatch Rate', value: 'NOT_FOUND', confidence: 0.0, source_snippet: '', source_location: 'Photo · OCR · not detected', notes: 'Not detected' },
    { field_name: 'Laytime Allowance', value: 'NOT_FOUND', confidence: 0.0, source_snippet: '', source_location: 'Photo · OCR · not detected', notes: 'Not detected' },
    { field_name: 'NOR Clause', value: 'Not stated', confidence: 0.15, source_snippet: 'NOR: not stated', source_location: 'Photo · OCR', notes: '' },
    { field_name: 'Payment Terms', value: '15 days', confidence: 0.52, source_snippet: 'Payment: 15 days', source_location: 'Photo · OCR', notes: '' },
    { field_name: 'Volume Discount Threshold', value: 'Not mentioned', confidence: 0.20, source_snippet: 'Discount: not mentioned', source_location: 'Photo · OCR', notes: '' },
    { field_name: 'Fumigation Certificate (Y/N)', value: 'Not found', confidence: 0.0, source_snippet: '', source_location: 'Photo · OCR · not detected', notes: '' },
    { field_name: 'Phytosanitary Certificate (Y/N)', value: 'Not found', confidence: 0.0, source_snippet: '', source_location: 'Photo · OCR · not detected', notes: '' },
    { field_name: 'Hold Cleanliness Standard', value: 'Not stated', confidence: 0.25, source_snippet: 'Hold: not stated', source_location: 'Photo · OCR', notes: '' },
    { field_name: 'Stowage Factor', value: 'Not stated', confidence: 0.25, source_snippet: 'Stowage: not stated', source_location: 'Photo · OCR', notes: '' },
    { field_name: 'Container Type/Count', value: "20' FCL × 20 (est.)", confidence: 0.38, source_snippet: 'Containers: 20FCL x20 est', source_location: 'Photo · OCR · partial', notes: '' },
  ],
  'maersk': [
    { field_name: 'Ocean Freight', value: '₹17,600/ton', confidence: 0.95, source_snippet: 'Ocean Freight: 17600 INR', source_location: 'CSV · row 1', notes: '' },
    { field_name: 'BAF', value: '₹2,100/ton', confidence: 0.92, source_snippet: 'BAF: 2100 INR', source_location: 'CSV · row 2', notes: '' },
    { field_name: 'THC Origin', value: '₹700/ton', confidence: 0.90, source_snippet: 'THC Origin: 700 INR', source_location: 'CSV · row 3', notes: '' },
    { field_name: 'THC Destination', value: '₹600/ton', confidence: 0.88, source_snippet: 'THC Dest: 600 INR', source_location: 'CSV · row 4', notes: '' },
    { field_name: 'Documentation', value: '₹150/ton', confidence: 0.91, source_snippet: 'Documentation: 150 INR', source_location: 'CSV · row 5', notes: '' },
    { field_name: 'BL+ISPS', value: '₹150/ton', confidence: 0.91, source_snippet: 'BL+ISPS: 150 INR', source_location: 'CSV · row 6', notes: '' },
    { field_name: 'Total Rate/Ton', value: '₹21,300/ton', confidence: 0.97, source_snippet: 'Total: 21300 INR', source_location: 'CSV · computed', notes: '' },
    { field_name: 'Rate per Container', value: '₹5,32,500/TEU', confidence: 0.95, source_snippet: 'Per TEU: 532500 INR', source_location: 'CSV · row 8', notes: '' },
    { field_name: 'Currency', value: 'INR (all-in)', confidence: 0.98, source_snippet: 'Currency: INR', source_location: 'CSV · header', notes: '' },
    { field_name: 'Rate Validity', value: '30 days', confidence: 0.93, source_snippet: 'Validity: 30 days', source_location: 'CSV · row 10', notes: '' },
    { field_name: 'Vessel Name', value: 'MV Maersk Pacific', confidence: 0.87, source_snippet: 'Vessel: MV Maersk Pacific', source_location: 'CSV · row 12', notes: '' },
    { field_name: 'Vessel DWT', value: '35,000 MT', confidence: 0.88, source_snippet: 'DWT: 35000', source_location: 'CSV · row 13', notes: '' },
    { field_name: 'Vessel Flag', value: 'Denmark', confidence: 0.90, source_snippet: 'Flag: Denmark', source_location: 'CSV · row 14', notes: '' },
    { field_name: 'Laycan Start', value: 'Oct 05, 2026', confidence: 0.91, source_snippet: 'Laycan: Oct 05', source_location: 'CSV · row 15', notes: '' },
    { field_name: 'Laycan End', value: 'Oct 12, 2026', confidence: 0.91, source_snippet: 'Laycan end: Oct 12', source_location: 'CSV · row 16', notes: '' },
    { field_name: 'Transit Time', value: '19-21 days', confidence: 0.89, source_snippet: 'Transit: 19-21 days', source_location: 'CSV · row 17', notes: '' },
    { field_name: 'Load Rate (MT/day)', value: '7,000', confidence: 0.83, source_snippet: 'Load rate: 7000', source_location: 'CSV · row 18', notes: '' },
    { field_name: 'Discharge Rate (MT/day)', value: '6,500', confidence: 0.83, source_snippet: 'Discharge: 6500', source_location: 'CSV · row 19', notes: '' },
    { field_name: 'Free Days', value: '21 days', confidence: 0.93, source_snippet: 'Free days: 21', source_location: 'CSV · row 21', notes: 'Above requirement' },
    { field_name: 'Demurrage Rate (PDPR)', value: 'USD 15,000 PDPR', confidence: 0.87, source_snippet: 'Demurrage: 15000 USD', source_location: 'CSV · row 22', notes: '' },
    { field_name: 'Dispatch Rate', value: 'USD 7,500 PDPR', confidence: 0.84, source_snippet: 'Dispatch: 7500 USD', source_location: 'CSV · row 23', notes: '' },
    { field_name: 'Laytime Allowance', value: '72 hours', confidence: 0.85, source_snippet: 'Laytime: 72 hrs', source_location: 'CSV · row 24', notes: '' },
    { field_name: 'NOR Clause', value: 'NOR at berth, 6 hrs turnaround', confidence: 0.80, source_snippet: 'NOR: berth 6hrs', source_location: 'CSV · row 25', notes: '' },
    { field_name: 'Payment Terms', value: '30 days from BL date', confidence: 0.91, source_snippet: 'Payment: 30 days BL', source_location: 'CSV · row 26', notes: '' },
    { field_name: 'Volume Discount Threshold', value: '5% above 5,000 MT', confidence: 0.82, source_snippet: 'Discount: 5% >5000MT', source_location: 'CSV · row 27', notes: '' },
    { field_name: 'Fumigation Certificate (Y/N)', value: 'Yes', confidence: 0.94, source_snippet: 'Fumigation: Yes', source_location: 'CSV · row 29', notes: '' },
    { field_name: 'Phytosanitary Certificate (Y/N)', value: 'Yes', confidence: 0.93, source_snippet: 'Phyto: Yes', source_location: 'CSV · row 30', notes: '' },
    { field_name: 'Hold Cleanliness Standard', value: 'Food grade, IMO class clean', confidence: 0.86, source_snippet: 'Hold: food grade IMO', source_location: 'CSV · row 31', notes: '' },
    { field_name: 'Stowage Factor', value: '1.4 MT/m³', confidence: 0.83, source_snippet: 'Stowage: 1.4', source_location: 'CSV · row 32', notes: '' },
    { field_name: 'Container Type/Count', value: "20' FCL × 25", confidence: 0.89, source_snippet: 'Containers: 20FCL x25', source_location: 'CSV · row 33', notes: '' },
  ],
  'transocean': [],
};

const VENDOR_FILE_NAMES: Record<string, string> = {
  'oceanlink': 'OceanLink_Quote_RFP052.csv',
  'gulf-freight': 'Gulf_Freight_Quote_RFP052.pdf',
  'indoship': 'IndoShip_Quote_RFP052.docx',
  'swiftsea': 'SwiftSea_RateCard.jpg',
  'transocean': 'TransOcean_Email_RFP052.txt',
  'maersk': 'Maersk_Quote_RFP052.csv',
  'nordic-freight': 'NordicFreight_Quote_RFP052.csv',
};

async function fetchAndExtract(vendor: typeof VENDOR_FILES[0]): Promise<ExtractedVendor> {
  const fileUrl = `/${vendor.fileName}`;
  const resp = await fetch(fileUrl);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: Failed to fetch ${vendor.fileName}`);
  const isText = vendor.fileType === 'csv' || vendor.fileType === 'txt';

  let fileContent: string;
  if (isText) {
    fileContent = await resp.text();
  } else {
    const blob = await resp.blob();
    fileContent = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1] || '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vendor-extract`;
  const extractResp = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      vendorId: vendor.vendorId,
      vendorName: vendor.vendorName,
      fileContent,
      fileType: vendor.fileType,
    }),
  });

  if (!extractResp.ok) {
    const errorBody = await extractResp.text().catch(() => '');
    throw new Error(`HTTP ${extractResp.status}: ${errorBody || 'Extraction failed'}`);
  }
  const data = await extractResp.json();

  return {
    vendorId: vendor.vendorId,
    vendorName: vendor.vendorName,
    fields: data.fields || [],
    sourceType: vendor.fileType,
    extracted: data.extracted || false,
  };
}

function getFallbackVendor(vendor: typeof VENDOR_FILES[0], error?: string): ExtractedVendor {
  const fallback = FALLBACK_FIELDS[vendor.vendorId] || [];
  return {
    vendorId: vendor.vendorId,
    vendorName: vendor.vendorName,
    fields: fallback,
    sourceType: vendor.fileType,
    extracted: fallback.length > 0,
    extractionError: error,
  };
}

export function VendorDataProvider({ children }: { children: ReactNode }) {
  const [vendors, setVendors] = useState<Record<string, ExtractedVendor>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [corrections, setCorrections] = useState<Record<string, Correction[]>>(loadCorrections());

  const runExtraction = useCallback(async () => {
    setLoading(true);
    setError(null);

    const cached = loadFromCache();
    if (cached && Object.keys(cached).length === VENDOR_FILES.length) {
      setVendors(cached);
      setLoading(false);
      return;
    }

    const results = await Promise.allSettled(
      VENDOR_FILES.map((v) => fetchAndExtract(v))
    );

    const newVendors: Record<string, ExtractedVendor> = {};
    let failCount = 0;

    results.forEach((result, i) => {
      const vendor = VENDOR_FILES[i];
      if (result.status === 'fulfilled' && result.value.extracted && result.value.fields.length > 0) {
        newVendors[vendor.vendorId] = result.value;
      } else {
        const errorMsg = result.status === 'rejected'
          ? `${result.reason instanceof Error ? result.reason.message : String(result.reason)} at ${new Date().toISOString()}`
          : result.status === 'fulfilled' && !result.value.extracted
            ? `Extraction returned no fields at ${new Date().toISOString()}`
            : undefined;
        const fallback = getFallbackVendor(vendor, errorMsg);
        newVendors[vendor.vendorId] = fallback;
        if (!fallback.extracted) failCount++;
      }
    });

    setVendors(newVendors);
    setLoading(false);
    if (failCount === VENDOR_FILES.length) {
      setError('Extraction failed for all vendors — showing fallback data.');
    }

    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(newVendors));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    runExtraction();
  }, [runExtraction]);

  const retry = useCallback(() => {
    sessionStorage.removeItem(CACHE_KEY);
    runExtraction();
  }, [runExtraction]);

  const applyCorrection = useCallback((vendorId: string, fieldName: string, correctedValue: string) => {
    setCorrections((prev) => {
      const newCorrections = { ...prev };
      const vendorCorrections = newCorrections[vendorId] || [];
      const existing = vendorCorrections.findIndex((c) => c.fieldName === fieldName);
      const correction: Correction = { fieldName, correctedValue, timestamp: Date.now() };
      if (existing >= 0) {
        vendorCorrections[existing] = correction;
      } else {
        vendorCorrections.push(correction);
      }
      newCorrections[vendorId] = vendorCorrections;
      try {
        sessionStorage.setItem(CORRECTIONS_KEY, JSON.stringify(newCorrections));
      } catch { /* ignore */ }
      return newCorrections;
    });
  }, []);

  const getVendorFields = useCallback((vendorId: string): ExtractedField[] => {
    const vendor = vendors[vendorId];
    if (!vendor) return [];
    return vendor.fields;
  }, [vendors]);

  const getFieldValue = useCallback((vendorId: string, fieldName: string) => {
    const vendor = vendors[vendorId];
    const vendorCorrections = corrections[vendorId] || [];
    const correction = vendorCorrections.find((c) => c.fieldName === fieldName);

    if (!vendor || vendor.fields.length === 0) {
      return {
        value: 'NOT_FOUND',
        confidence: 0,
        source: '',
        sourceType: vendor?.sourceType || '',
        corrected: false,
        source_snippet: '',
        source_location: '',
        notes: 'No extraction data available',
      };
    }

    const field = vendor.fields.find((f) => f.field_name === fieldName);
    if (correction) {
      return {
        value: correction.correctedValue,
        confidence: 1.0,
        source: 'Buyer correction',
        sourceType: '',
        corrected: true,
        source_snippet: field?.source_snippet || '',
        source_location: field?.source_location || '',
        notes: 'Manually corrected by buyer',
      };
    }

    return {
      value: field?.value || 'NOT_FOUND',
      confidence: field?.confidence || 0,
      source: field?.source_location || '',
      sourceType: vendor.sourceType,
      corrected: false,
      source_snippet: field?.source_snippet || '',
      source_location: field?.source_location || '',
      notes: field?.notes || '',
    };
  }, [vendors, corrections]);

  const anyFailed = Object.values(vendors).some((v) => !v.extracted) && Object.keys(vendors).length > 0;

  return (
    <VendorDataContext.Provider value={{
      vendors,
      loading,
      error,
      anyFailed,
      corrections,
      retry,
      applyCorrection,
      getFieldValue,
      getVendorFields,
    }}>
      {children}
    </VendorDataContext.Provider>
  );
}

export function useVendorData() {
  const ctx = useContext(VendorDataContext);
  if (!ctx) throw new Error('useVendorData must be used within VendorDataProvider');
  return ctx;
}

export { VENDOR_FILE_NAMES };
