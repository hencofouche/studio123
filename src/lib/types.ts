export type CalculationType = 'fixed' | 'time' | 'weight' | 'percentage' | 'quantity';

export interface LineItemDefinition {
  id: string;
  name: string;
  type?: 'percentage'; // This can now be set in the template
  appliesTo?: string[]; // Array of line item definition IDs for percentages
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
  value1?: number; // For fixed: price; for time: hours; for weight: amount; for quantity: quantity; for percentage: percent
  value2?: number; // for time: rate; for weight: rate; for quantity: price per item
}

// The values are now stored as an array of entries
export type LineItemValues = LineItemEntry[];
