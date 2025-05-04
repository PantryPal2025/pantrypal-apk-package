import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Icon } from '@/components/ui/icon';

// Define unit conversion types
type UnitCategory = 'volume' | 'weight' | 'temperature' | 'length';

interface UnitOption {
  value: string;
  label: string;
  conversionFactor: number; // Relative to base unit
}

interface UnitCategoryOptions {
  name: string;
  baseUnit: string;
  units: UnitOption[];
}

// Define unit conversion data
const unitCategories: Record<UnitCategory, UnitCategoryOptions> = {
  volume: {
    name: 'Volume',
    baseUnit: 'ml',
    units: [
      { value: 'ml', label: 'Milliliter (ml)', conversionFactor: 1 },
      { value: 'l', label: 'Liter (l)', conversionFactor: 1000 },
      { value: 'tsp', label: 'Teaspoon (tsp)', conversionFactor: 4.93 },
      { value: 'tbsp', label: 'Tablespoon (tbsp)', conversionFactor: 14.79 },
      { value: 'fl_oz', label: 'Fluid Ounce (fl oz)', conversionFactor: 29.57 },
      { value: 'cup', label: 'Cup', conversionFactor: 236.59 },
      { value: 'pint', label: 'Pint (pt)', conversionFactor: 473.18 },
      { value: 'quart', label: 'Quart (qt)', conversionFactor: 946.35 },
      { value: 'gallon', label: 'Gallon (gal)', conversionFactor: 3785.41 },
    ]
  },
  weight: {
    name: 'Weight',
    baseUnit: 'g',
    units: [
      { value: 'g', label: 'Gram (g)', conversionFactor: 1 },
      { value: 'kg', label: 'Kilogram (kg)', conversionFactor: 1000 },
      { value: 'oz', label: 'Ounce (oz)', conversionFactor: 28.35 },
      { value: 'lb', label: 'Pound (lb)', conversionFactor: 453.59 },
    ]
  },
  temperature: {
    name: 'Temperature',
    baseUnit: 'c',
    units: [
      { value: 'c', label: 'Celsius (°C)', conversionFactor: 1 },
      { value: 'f', label: 'Fahrenheit (°F)', conversionFactor: 1 }, // Special conversion
      { value: 'k', label: 'Kelvin (K)', conversionFactor: 1 }, // Special conversion
    ]
  },
  length: {
    name: 'Length',
    baseUnit: 'cm',
    units: [
      { value: 'mm', label: 'Millimeter (mm)', conversionFactor: 0.1 },
      { value: 'cm', label: 'Centimeter (cm)', conversionFactor: 1 },
      { value: 'm', label: 'Meter (m)', conversionFactor: 100 },
      { value: 'in', label: 'Inch (in)', conversionFactor: 2.54 },
      { value: 'ft', label: 'Foot (ft)', conversionFactor: 30.48 },
    ]
  }
};

export default function UnitConverter() {
  const [category, setCategory] = useState<UnitCategory>('volume');
  const [fromUnit, setFromUnit] = useState<string>(unitCategories.volume.units[0].value);
  const [toUnit, setToUnit] = useState<string>(unitCategories.volume.units[1].value);
  const [fromValue, setFromValue] = useState<string>('1');
  const [toValue, setToValue] = useState<string>('');
  const [reverseDirection, setReverseDirection] = useState<boolean>(false);

  // Special conversions for temperature
  const convertTemperature = (value: number, from: string, to: string): number => {
    if (from === to) return value;
    
    // Convert to Celsius first
    let celsius: number;
    if (from === 'c') {
      celsius = value;
    } else if (from === 'f') {
      celsius = (value - 32) * 5/9;
    } else { // Kelvin
      celsius = value - 273.15;
    }
    
    // Convert from Celsius to target unit
    if (to === 'c') {
      return celsius;
    } else if (to === 'f') {
      return celsius * 9/5 + 32;
    } else { // Kelvin
      return celsius + 273.15;
    }
  };

  // Standard unit conversion
  const convertUnits = (value: number, from: string, to: string, cat: UnitCategory): number => {
    if (category === 'temperature') {
      return convertTemperature(value, from, to);
    }
    
    const fromUnit = unitCategories[cat].units.find(u => u.value === from);
    const toUnit = unitCategories[cat].units.find(u => u.value === to);
    
    if (!fromUnit || !toUnit) return 0;
    
    // Convert to base unit, then to target unit
    const valueInBaseUnit = value * fromUnit.conversionFactor;
    return valueInBaseUnit / toUnit.conversionFactor;
  };

  // Handle conversion on input change
  const handleConvert = (reverse: boolean = false) => {
    try {
      const numValue = reverse 
        ? parseFloat(toValue || '0') 
        : parseFloat(fromValue || '0');
      
      if (isNaN(numValue)) {
        if (reverse) {
          setFromValue('');
        } else {
          setToValue('');
        }
        return;
      }
      
      const result = reverse
        ? convertUnits(numValue, toUnit, fromUnit, category)
        : convertUnits(numValue, fromUnit, toUnit, category);
            
      // Format the result to 2 decimal places, but show as integers if possible
      const formattedResult = Number.isInteger(result) ? result.toString() : result.toFixed(2);
      
      if (reverse) {
        setFromValue(formattedResult);
      } else {
        setToValue(formattedResult);
      }
    } catch (error) {
      console.error('Conversion error', error);
    }
  };

  // Update conversion when inputs change
  useEffect(() => {
    if (reverseDirection) {
      handleConvert(true);
    } else {
      handleConvert(false);
    }
  }, [fromUnit, toUnit, reverseDirection]);

  // Swap units
  const handleSwapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
    
    if (!reverseDirection) {
      const tempValue = fromValue;
      setFromValue(toValue);
      setToValue(tempValue);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center">
        <h2 className="font-semibold text-lg">Kitchen Unit Converter</h2>
      </div>
      
      <div className="p-5">
        <div className="space-y-4">
          {/* Unit category selection */}
          <div>
            <Label htmlFor="unit-category">Conversion Type</Label>
            <Select
              value={category}
              onValueChange={(value: UnitCategory) => {
                setCategory(value);
                setFromUnit(unitCategories[value].units[0].value);
                setToUnit(unitCategories[value].units[1].value);
                setFromValue('1');
                setToValue('');
              }}
            >
              <SelectTrigger id="unit-category">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(unitCategories).map(([key, category]) => (
                  <SelectItem key={key} value={key}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Conversion direction toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="reverse-direction"
              checked={reverseDirection}
              onCheckedChange={(checked) => {
                setReverseDirection(checked);
              }}
            />
            <Label htmlFor="reverse-direction">
              Reverse conversion direction
            </Label>
          </div>
          
          {/* Conversion interface */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            <div className="md:col-span-2">
              <Label htmlFor="from-value" className="sr-only">From Value</Label>
              <div className="flex flex-col space-y-2">
                <Input
                  id="from-value"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Value"
                  value={fromValue}
                  onChange={(e) => {
                    setFromValue(e.target.value);
                    if (!reverseDirection) {
                      handleConvert(false);
                    }
                  }}
                  disabled={reverseDirection}
                  className={reverseDirection ? "bg-gray-100" : ""}
                />
                <Select
                  value={fromUnit}
                  onValueChange={setFromUnit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitCategories[category].units.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="icon"
                onClick={handleSwapUnits}
                className="rounded-full h-10 w-10"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </Button>
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="to-value" className="sr-only">To Value</Label>
              <div className="flex flex-col space-y-2">
                <Input
                  id="to-value"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Result"
                  value={toValue}
                  onChange={(e) => {
                    setToValue(e.target.value);
                    if (reverseDirection) {
                      handleConvert(true);
                    }
                  }}
                  disabled={!reverseDirection}
                  className={!reverseDirection ? "bg-gray-100" : ""}
                />
                <Select
                  value={toUnit}
                  onValueChange={setToUnit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitCategories[category].units.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Conversion examples */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Common Cooking Conversions:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-600">
              {category === 'volume' && (
                <>
                  <div className="p-2 bg-gray-50 rounded">1 cup = 16 tbsp</div>
                  <div className="p-2 bg-gray-50 rounded">1 tbsp = 3 tsp</div>
                  <div className="p-2 bg-gray-50 rounded">1 cup = 8 fl oz</div>
                  <div className="p-2 bg-gray-50 rounded">1 pint = 2 cups</div>
                  <div className="p-2 bg-gray-50 rounded">1 quart = 4 cups</div>
                  <div className="p-2 bg-gray-50 rounded">1 gallon = 4 quarts</div>
                  <div className="p-2 bg-gray-50 rounded">1 cup = 237 ml</div>
                  <div className="p-2 bg-gray-50 rounded">1 tbsp = 15 ml</div>
                  <div className="p-2 bg-gray-50 rounded">1 tsp = 5 ml</div>
                </>
              )}
              {category === 'weight' && (
                <>
                  <div className="p-2 bg-gray-50 rounded">1 lb = 16 oz</div>
                  <div className="p-2 bg-gray-50 rounded">1 kg = 1000 g</div>
                  <div className="p-2 bg-gray-50 rounded">1 lb = 453.59 g</div>
                  <div className="p-2 bg-gray-50 rounded">1 oz = 28.35 g</div>
                  <div className="p-2 bg-gray-50 rounded">1 stick butter = 113g</div>
                  <div className="p-2 bg-gray-50 rounded">1 cup flour ≈ 120g</div>
                  <div className="p-2 bg-gray-50 rounded">1 cup sugar ≈ 200g</div>
                  <div className="p-2 bg-gray-50 rounded">1 cup rice ≈ 185g</div>
                  <div className="p-2 bg-gray-50 rounded">1 cup water = 237g</div>
                </>
              )}
              {category === 'temperature' && (
                <>
                  <div className="p-2 bg-gray-50 rounded">0°C = 32°F</div>
                  <div className="p-2 bg-gray-50 rounded">100°C = 212°F</div>
                  <div className="p-2 bg-gray-50 rounded">0°C = 273.15K</div>
                  <div className="p-2 bg-gray-50 rounded">Freezing: 0°C/32°F</div>
                  <div className="p-2 bg-gray-50 rounded">Boiling: 100°C/212°F</div>
                  <div className="p-2 bg-gray-50 rounded">Room temp: 20-22°C</div>
                  <div className="p-2 bg-gray-50 rounded">Fridge: 1-4°C/34-39°F</div>
                  <div className="p-2 bg-gray-50 rounded">Freezer: -18°C/0°F</div>
                  <div className="p-2 bg-gray-50 rounded">Oven Low: 150°C/300°F</div>
                </>
              )}
              {category === 'length' && (
                <>
                  <div className="p-2 bg-gray-50 rounded">1 in = 2.54 cm</div>
                  <div className="p-2 bg-gray-50 rounded">1 ft = 30.48 cm</div>
                  <div className="p-2 bg-gray-50 rounded">1 m = 100 cm</div>
                  <div className="p-2 bg-gray-50 rounded">1 ft = 12 in</div>
                  <div className="p-2 bg-gray-50 rounded">1 yard = 3 ft</div>
                  <div className="p-2 bg-gray-50 rounded">1 m = 39.37 in</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}