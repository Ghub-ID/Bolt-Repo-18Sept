import { createContext, useContext, useState, type ReactNode } from 'react';

export interface RfpCharter {
  commodity: string;
  volume: string;
  origin: string;
  destination: string;
  incoterms: string;
  shipment_window: string;
  rate_validity: string;
  free_days: string;
  payment_terms: string;
  special_requirements: string;
  tbc_fields: string[];
}

export const DEFAULT_CHARTER: RfpCharter = {
  commodity: 'Specialty Rice (Bagged)',
  volume: '30 tons (3 × 10 tons)',
  origin: 'Mundra, IN',
  destination: 'TBC',
  incoterms: 'TBC',
  shipment_window: 'Oct 5 – Oct 20, 2026',
  rate_validity: '30 days',
  free_days: '14 days',
  payment_terms: '30 days from BL date',
  special_requirements: 'Food grade hold, fumigation & EU phytosanitary required',
  tbc_fields: ['destination', 'incoterms'],
};

export const CHARTER_LABELS: Record<keyof Omit<RfpCharter, 'tbc_fields'>, string> = {
  commodity: 'Commodity',
  volume: 'Volume',
  origin: 'Origin',
  destination: 'Destination',
  incoterms: 'Incoterms',
  shipment_window: 'Shipment Window',
  rate_validity: 'Rate Validity',
  free_days: 'Free Days',
  payment_terms: 'Payment Terms',
  special_requirements: 'Special Requirements',
};

export const CHARTER_ORDER: (keyof Omit<RfpCharter, 'tbc_fields'>)[] = [
  'commodity', 'volume', 'origin', 'destination', 'incoterms', 'shipment_window',
  'rate_validity', 'free_days', 'payment_terms', 'special_requirements',
];

export const TBC_DROPDOWN_OPTIONS: Record<string, { label: string; value: string }[]> = {
  commodity: [
    { label: 'Specialty Rice (Bagged)', value: 'Specialty Rice (Bagged)' },
    { label: 'Cotton', value: 'Cotton' },
    { label: 'Cocoa', value: 'Cocoa' },
    { label: 'Coffee', value: 'Coffee' },
    { label: 'Still TBC', value: 'TBC' },
  ],
  volume: [
    { label: '30 tons (3 × 10 tons)', value: '30 tons (3 × 10 tons)' },
    { label: '50 tons', value: '50 tons' },
    { label: '100 tons', value: '100 tons' },
    { label: 'Still TBC', value: 'TBC' },
  ],
  origin: [
    { label: 'Mundra, IN', value: 'Mundra, IN' },
    { label: 'Kandla, IN', value: 'Kandla, IN' },
    { label: 'Nhava Sheva, IN', value: 'Nhava Sheva, IN' },
    { label: 'Still TBC', value: 'TBC' },
  ],
  destination: [
    { label: 'Copenhagen', value: 'Copenhagen, Denmark' },
    { label: 'Aarhus', value: 'Aarhus, Denmark' },
    { label: 'Hamburg', value: 'Hamburg, Germany' },
    { label: 'Rotterdam', value: 'Rotterdam, Netherlands' },
    { label: 'Still TBC', value: 'TBC' },
  ],
  incoterms: [
    { label: 'FOB', value: 'FOB' },
    { label: 'CFR', value: 'CFR' },
    { label: 'CIF', value: 'CIF' },
    { label: 'Both FOB & CFR', value: 'Both FOB & CFR' },
    { label: 'Still TBC', value: 'TBC' },
  ],
  shipment_window: [
    { label: 'Oct 5 – Oct 20, 2026', value: 'Oct 5 – Oct 20, 2026' },
    { label: 'Within 30 days', value: 'Within 30 days' },
    { label: '30–60 days', value: '30–60 days' },
    { label: '60–90 days', value: '60–90 days' },
    { label: 'Still TBC', value: 'TBC' },
  ],
  rate_validity: [
    { label: '30 days', value: '30 days' },
    { label: '45 days', value: '45 days' },
    { label: '60 days', value: '60 days' },
    { label: 'Still TBC', value: 'TBC' },
  ],
  free_days: [
    { label: '7 days', value: '7 days' },
    { label: '10 days', value: '10 days' },
    { label: '14 days', value: '14 days' },
    { label: '21 days', value: '21 days' },
    { label: 'Still TBC', value: 'TBC' },
  ],
  payment_terms: [
    { label: '30 days from BL date', value: '30 days from BL date' },
    { label: '45 days from BL date', value: '45 days from BL date' },
    { label: '60 days from BL date', value: '60 days from BL date' },
    { label: 'Still TBC', value: 'TBC' },
  ],
  special_requirements: [
    { label: 'Food grade hold, fumigation & EU phytosanitary required', value: 'Food grade hold, fumigation & EU phytosanitary required' },
    { label: 'Fumigation only', value: 'Fumigation only' },
    { label: 'EU phytosanitary only', value: 'EU phytosanitary only' },
    { label: 'None', value: 'None' },
    { label: 'Still TBC', value: 'TBC' },
  ],
};

interface RfpCharterContextValue {
  charter: RfpCharter;
  setCharter: (charter: RfpCharter | ((prev: RfpCharter) => RfpCharter)) => void;
  updateField: (field: keyof Omit<RfpCharter, 'tbc_fields'>, value: string | number) => void;
  resolveTbc: (field: string, value: string) => void;
  tbcCount: number;
}

const RfpCharterContext = createContext<RfpCharterContextValue | null>(null);

export function RfpCharterProvider({ children }: { children: ReactNode }) {
  const [charter, setCharterState] = useState<RfpCharter>(DEFAULT_CHARTER);

  const setCharter = (next: RfpCharter | ((prev: RfpCharter) => RfpCharter)) => {
    setCharterState(next);
  };

  const updateField = (field: keyof Omit<RfpCharter, 'tbc_fields'>, value: string | number) => {
    setCharterState((prev) => {
      const isTbc = String(value).toUpperCase() === 'TBC';
      const wasTbc = prev.tbc_fields.includes(field);
      let newTbcFields = [...prev.tbc_fields];
      if (!isTbc && wasTbc) {
        newTbcFields = newTbcFields.filter((f) => f !== field);
      } else if (isTbc && !wasTbc) {
        newTbcFields = [...newTbcFields, field];
      }
      return {
        ...prev,
        [field]: value,
        tbc_fields: newTbcFields,
      };
    });
  };

  const resolveTbc = (field: string, value: string) => {
    setCharterState((prev) => {
      const isTbc = String(value).toUpperCase() === 'TBC';
      let newTbcFields = [...prev.tbc_fields];
      if (!isTbc) {
        newTbcFields = newTbcFields.filter((f) => f !== field);
      } else if (!newTbcFields.includes(field)) {
        newTbcFields = [...newTbcFields, field];
      }
      return {
        ...prev,
        [field]: value,
        tbc_fields: newTbcFields,
      };
    });
  };

  const tbcCount = charter.tbc_fields.length;

  return (
    <RfpCharterContext.Provider value={{ charter, setCharter, updateField, resolveTbc, tbcCount }}>
      {children}
    </RfpCharterContext.Provider>
  );
}

export function useRfpCharter() {
  const ctx = useContext(RfpCharterContext);
  if (!ctx) throw new Error('useRfpCharter must be used within RfpCharterProvider');
  return ctx;
}
