export const DEPARTMENTS = [
  "Production",
  "Quality",
  "Engineering",
  "Warehouse",
  "HSE",
] as const;

export const CATEGORIES = [
  "Contamination",
  "Underweight",
  "Equipment Failure",
  "Process Deviation",
  "Packaging Defect",
  "Others",
] as const;

export const SEVERITIES = ["Low", "Medium", "High", "Critical"] as const;

export const STATUSES = ["Open", "In Progress", "Closed"] as const;

export const ROLES = ["admin", "supervisor", "operator"] as const;

export const LINES = [
  "Line 1",
  "Line 2",
  "Line 3",
  "Line 4",
  "Packaging Hall A",
  "Packaging Hall B",
  "Receiving Bay",
  "Cold Storage",
];

export const PRODUCT_TYPES = [
  "Beverage 500ml",
  "Beverage 1L",
  "Snack Pack 50g",
  "Snack Pack 150g",
  "Sauce Jar 250g",
  "Bulk Powder 25kg",
  "Cereal Box 500g",
];
