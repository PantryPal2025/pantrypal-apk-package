export enum MeasurementUnit {
  COUNT = 'Count',
  POUND = 'lb',
  OUNCE = 'oz',
  GRAM = 'g',
  KILOGRAM = 'kg',
  MILLILITER = 'ml',
  LITER = 'l',
  TEASPOON = 'tsp',
  TABLESPOON = 'tbsp',
  CUP = 'cup',
  PINT = 'pint',
  QUART = 'quart',
  GALLON = 'gallon'
}

export type MeasurementUnitType = `${MeasurementUnit}`;