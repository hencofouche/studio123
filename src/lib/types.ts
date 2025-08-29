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

// Represents a single, specific instance of a line item in the calculator
export interface LineItemEntry {
  id: string; // Unique ID for this specific entry
  defId: string; // ID of the LineItemDefinition it belongs to
  name: string; // User-defined name/description for this entry
  value1?: number; // For fixed: price; for time: hours; for weight: amount; for percentage: percent
  value2?: number; // for time: rate; for weight: rate
}

// The values are now stored as an array of entries
export type LineItemValues = LineItemEntry[];
