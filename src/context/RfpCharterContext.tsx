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
  vendors_invited: number;
  tbc_fields: string[];
}

export const DEFAULT_CHARTER: RfpCharter = {
  commodity: 'TBC',
  volume: 'TBC',
  origin: 'TBC',
  destination: 'TBC',
  incoterms: 'TBC',
  shipment_window: 'TBC',
  rate_validity: 'TBC',
  free_days: 'TBC',
  payment_terms: 'TBC',
  special_requirements: 'TBC',
  vendors_invited: 8,
  tbc_fields: ['commodity', 'volume', 'origin', 'destination', 'incoterms', 'shipment_window', 'rate_validity', 'free_days', 'payment_terms', 'special_requirements'],
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
  vendors_invited: 'Vendors Invited',
};

export const CHARTER_ORDER: (keyof Omit<RfpCharter, 'tbc_fields'>)[] = [
  'commodity', 'volume', 'origin', 'destination', 'incoterms', 'shipment_window',
  'rate_validity', 'free_days', 'payment_terms', 'special_requirements', 'vendors_invited',
];

export const TBC_DROPDOWN_OPTIONS: Record<string, { label: string; value: string }[]> = {
  destination: [
    { label: 'Copenhagen', value: 'Copenhagen, Denmark' },
    { label: 'Aarhus', value: 'Aarhus, Denmark' },
    { label: 'Both', value: 'Copenhagen / Aarhus (both)' },
    { label: 'Still TBC', value: 'TBC' },
  ],
  incoterms: [
    { label: 'FOB', value: 'FOB' },
    { label: 'CFR', value: 'CFR' },
    { label: 'CIF', value: 'CIF' },
    { label: 'Both', value: 'FOB / CFR (both)' },
    { label: 'Still TBC', value: 'TBC' },
  ],
};

interface RfpCharterContextValue {
  charter: RfpCharter;
  setCharter: (charter: RfpCharter) => void;
  updateField: (field: keyof Omit<RfpCharter, 'tbc_fields'>, value: string | number) => void;
  resolveTbc: (field: string, value: string) => void;
  tbcCount: number;
}

const RfpCharterContext = createContext<RfpCharterContextValue | null>(null);

export function RfpCharterProvider({ children }: { children: ReactNode }) {
  const [charter, setCharterState] = useState<RfpCharter>(DEFAULT_CHARTER);

  const setCharter = (next: RfpCharter) => {
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
