export type CalculationType = 'fixed' | 'time' | 'weight' | 'percentage';

export interface LineItemDefinition {
  id: string;
  name: string;
  type: CalculationType;
}

export interface Template {
  id: string;
  name: string;
  lines: LineItemDefinition[];
}

export interface LineItemValues {
  [lineItemId: string]: {
    value1?: number; // For fixed: price; for time: hours; for weight: amount; for percentage: percent
    value2?: number; // for time: rate; for weight: rate
  };
}
