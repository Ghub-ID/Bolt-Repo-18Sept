import { useVendorData, type ExtractedField } from '@/context/VendorDataContext';

export interface NormalizedVendor {
  vendorId: string;
  vendorName: string;
  rate: string;
  rateTone: 'good' | 'warn' | 'bad' | 'neutral';
  transit: string;
  transitTone: 'good' | 'warn' | 'bad' | 'neutral';
  freeDays: string;
  freeDaysTone: 'good' | 'warn' | 'bad' | 'neutral';
  format: string;
  confidence: string;
  confidenceTone: 'good' | 'warn' | 'bad' | 'neutral';
  fields: ExtractedField[];
  extracted: boolean;
  extractionError?: string;
  originalCurrency?: 'USD' | 'INR' | null;
  fxRate?: number | null;
  originalUsdAmount?: number | null;
}

const SOURCE_LABEL: Record<string, string> = {
  csv: 'Excel',
  pdf: 'PDF',
  docx: 'Word',
  jpg: 'Photo',
  txt: 'Email',
};

function getField(fields: ExtractedField[], name: string): ExtractedField | undefined {
  return fields.find((f) => f.field_name === name);
}

function rateToneForConfidence(conf: number): 'good' | 'warn' | 'bad' {
  if (conf >= 0.8) return 'good';
  if (conf >= 0.5) return 'warn';
  return 'bad';
}

function parseRate(value: string): { num: number; currency: string } | null {
  if (!value || value === 'NOT_FOUND') return null;
  const match = value.match(/(?:INR|USD|₹|\$)?\s*([\d,]+)/i);
  if (!match) return null;
  const num = parseFloat(match[1].replace(/,/g, ''));
  const currency = value.toUpperCase().includes('USD') || value.includes('$') ? 'USD' : 'INR';
  return { num, currency };
}

export function useNormalizedVendors(): NormalizedVendor[] {
  const { vendors } = useVendorData();

  return Object.values(vendors).filter((v) => v.fields.length > 0).map((v) => {
    const fields = v.fields;
    const totalRate = getField(fields, 'Total Rate/Ton');
    const transit = getField(fields, 'Transit Time');
    const freeDays = getField(fields, 'Free Days');
    const currency = getField(fields, 'Currency');

    const rateValue = totalRate?.value || 'NOT_FOUND';
    const transitValue = transit?.value || 'NOT_FOUND';
    const freeDaysValue = freeDays?.value || 'NOT_FOUND';

    const FX_USD_TO_INR = 83.5;

    let displayRate = rateValue;
    let originalCurrency: 'USD' | 'INR' | null = null;
    let fxRate: number | null = null;
    let originalUsdAmount: number | null = null;
    if (rateValue && rateValue !== 'NOT_FOUND') {
      const isUSD = /USD|\$/i.test(rateValue) || (currency?.value || '').toUpperCase().includes('USD');
      if (isUSD) {
        const num = parseFloat(rateValue.replace(/[^\d.]/g, ''));
        if (!isNaN(num)) {
          const inr = Math.round(num * FX_USD_TO_INR);
          displayRate = '₹' + inr.toLocaleString('en-IN') + '/ton';
          originalCurrency = 'USD';
          fxRate = FX_USD_TO_INR;
          originalUsdAmount = num;
        }
      } else if (!rateValue.includes('₹')) {
        const num = rateValue.match(/[\d,]+/);
        if (num) displayRate = '₹' + num[0] + '/ton';
        originalCurrency = 'INR';
      } else {
        originalCurrency = 'INR';
      }
    }

    // Determine tones
    const avgConfidence = fields.length > 0
      ? fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length
      : 0;

    const rateTone: 'good' | 'warn' | 'bad' | 'neutral' = totalRate?.value === 'NOT_FOUND' ? 'neutral' : rateToneForConfidence(totalRate?.confidence || 0);
    const transitTone: 'good' | 'warn' | 'bad' | 'neutral' = transit?.value === 'NOT_FOUND' ? 'neutral' : rateToneForConfidence(transit?.confidence || 0);

    let freeDaysTone: 'good' | 'warn' | 'bad' | 'neutral' = 'neutral';
    if (freeDays?.value && freeDays.value !== 'NOT_FOUND') {
      const days = parseInt(freeDays.value);
      if (!isNaN(days)) {
        if (days >= 14) freeDaysTone = 'good';
        else if (days >= 10) freeDaysTone = 'warn';
        else freeDaysTone = 'bad';
      }
    } else if (freeDays?.value === 'NOT_FOUND') {
      freeDaysTone = 'bad';
    }

    const confidenceTone = rateToneForConfidence(avgConfidence);
    const confidenceLabel = avgConfidence >= 0.8 ? 'Low risk' : avgConfidence >= 0.5 ? 'Med risk' : 'High risk';

    // Add notes to confidence if there are specific caveats
    let confidenceText = confidenceLabel;
    if (currency?.value && currency.value.includes('USD')) {
      confidenceText += ' (USD conv)';
    }
    if (v.sourceType === 'jpg') {
      confidenceText += ' (OCR)';
    }

    return {
      vendorId: v.vendorId,
      vendorName: v.vendorName,
      rate: rateValue === 'NOT_FOUND' ? 'NOT_FOUND' : rateValue,
      rateTone,
      transit: transitValue === 'NOT_FOUND' ? '—' : transitValue,
      transitTone,
      freeDays: freeDaysValue === 'NOT_FOUND' ? '—' : freeDaysValue,
      freeDaysTone,
      format: SOURCE_LABEL[v.sourceType] || v.sourceType,
      confidence: confidenceText,
      confidenceTone,
      fields,
      extracted: v.extracted,
      extractionError: v.extractionError,
      originalCurrency,
      fxRate,
      originalUsdAmount,
    };
  });
}

export function useVendorCount(): { total: number; extracted: number; failed: number } {
  const { vendors } = useVendorData();
  const allVendors = Object.values(vendors);
  return {
    total: allVendors.length,
    extracted: allVendors.filter((v) => v.extracted).length,
    failed: allVendors.filter((v) => !v.extracted).length,
  };
}
