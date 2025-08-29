export type CalculationType = 'fixed' | 'time' | 'weight' | 'percentage';

export interface LineItemDefinition {
  id: string;
  name: string;
}

export interface Template {
  id: string;
  name: string;
  currency: string;
  lines: LineItemDefinition[];
}

// Represents a single, specific instance of a line item in the calculator
export interface LineItemEntry {
  id: string; // Unique ID for this specific entry
  defId: string; // ID of the LineItemDefinition it belongs to
  name: string; // User-defined name/description for this entry
  type: CalculationType; // Each entry now has its own calculation type
  value1?: number; // For fixed: quantity; for time: hours; for weight: amount; for percentage: percent
  value2?: number; // for fixed: price; for time: rate; for weight: rate;
  appliesTo?: string[]; // For percentage: array of line item ENTRY IDs it applies to
}

// The values are now stored as an array of entries
export type LineItemValues = LineItemEntry[];
