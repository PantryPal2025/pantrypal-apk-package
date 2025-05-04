import { FoodCategoryType, StorageLocationType, MeasurementUnitType } from '@shared/schema';

export interface NutritionInfo {
  calories?: number;
  fat?: number;
  carbs?: number;
  protein?: number;
  ingredients?: string;
  allergens?: string[];
}

export interface ProductData {
  name: string;
  brand?: string;
  category: FoodCategoryType | string;
  barcode?: string;
  imageUrl?: string;
  quantity: number;
  unit?: MeasurementUnitType | string;
  location?: StorageLocationType | string;
  price?: number;
  expirationDate?: string;
  notes?: string;
  nutritionInfo?: NutritionInfo;
}

export interface EnhancedProductData extends ProductData {
  quantity: number;
  unit: MeasurementUnitType | string;
  category: FoodCategoryType | string;
  location: StorageLocationType | string;
  price: number;
  expirationDate: string;
}