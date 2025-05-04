import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import BackButton from '@/components/ui/back-button';
import { Icon } from '@/components/ui/icon';

type ConversionUnit = 'teaspoon' | 'tablespoon' | 'cup' | 'pint' | 'quart' | 'gallon' | 'ounce' | 'pound' | 'gram' | 'kilogram' | 'milliliter' | 'liter';

type UnitConversion = {
  from: ConversionUnit;
  to: ConversionUnit;
  value: string;
  result: string;
}

// Unit conversion factors to standard units (where standard unit is the first one in each category)
const volumeConversions: Record<ConversionUnit, number> = {
  teaspoon: 1,
  tablespoon: 3,
  cup: 48,
  pint: 96,
  quart: 192,
  gallon: 768,
  milliliter: 0.202884,
  liter: 202.884,
  // These are not volume units but we need them for TypeScript
  ounce: 0,
  pound: 0,
  gram: 0,
  kilogram: 0
};

const weightConversions: Record<ConversionUnit, number> = {
  ounce: 1,
  pound: 16,
  gram: 0.035274,
  kilogram: 35.274,
  // These are not weight units but we need them for TypeScript
  teaspoon: 0,
  tablespoon: 0,
  cup: 0,
  pint: 0,
  quart: 0,
  gallon: 0,
  milliliter: 0,
  liter: 0
};

// Equivalents for common cooking measurements
const commonEquivalents = [
  { measure: '3 teaspoons', equals: '1 tablespoon' },
  { measure: '4 tablespoons', equals: '¼ cup' },
  { measure: '5 tablespoons + 1 teaspoon', equals: '⅓ cup' },
  { measure: '8 tablespoons', equals: '½ cup' },
  { measure: '12 tablespoons', equals: '¾ cup' },
  { measure: '16 tablespoons', equals: '1 cup' },
  { measure: '1 cup', equals: '8 fluid ounces' },
  { measure: '2 cups', equals: '1 pint' },
  { measure: '4 cups', equals: '1 quart' },
  { measure: '4 quarts', equals: '1 gallon' },
  { measure: '1 pound', equals: '16 ounces' },
  { measure: '1 tablespoon', equals: '15 milliliters' },
  { measure: '1 cup', equals: '240 milliliters' },
  { measure: '1 quart', equals: '0.95 liters' },
  { measure: '1 ounce', equals: '28.35 grams' },
  { measure: '1 pound', equals: '453.6 grams' },
];

// Common cooking ingredient equivalents
const ingredientEquivalents = [
  { ingredient: 'Butter', amount: '1 stick', equals: '½ cup or 8 tablespoons' },
  { ingredient: 'Butter', amount: '1 cup', equals: '2 sticks' },
  { ingredient: 'Flour (all-purpose)', amount: '1 cup sifted', equals: '4.25 ounces or 120 grams' },
  { ingredient: 'Sugar (granulated)', amount: '1 cup', equals: '7 ounces or 200 grams' },
  { ingredient: 'Sugar (brown)', amount: '1 cup packed', equals: '7 ounces or 200 grams' },
  { ingredient: 'Honey', amount: '1 cup', equals: '12 ounces or 340 grams' },
  { ingredient: 'Rice (uncooked)', amount: '1 cup', equals: '7 ounces or 200 grams' },
  { ingredient: 'Rice (cooked)', amount: '1 cup uncooked', equals: '3 cups cooked' },
  { ingredient: 'Pasta (uncooked)', amount: '1 cup', equals: '2 cups cooked' },
  { ingredient: 'Cheese (shredded)', amount: '1 cup', equals: '4 ounces or 113 grams' },
  { ingredient: 'Nuts (chopped)', amount: '1 cup', equals: '4 ounces or 113 grams' },
  { ingredient: 'Vegetable Oil', amount: '1 cup', equals: '7 ounces or 200 grams' },
];

// Conversion tips for substitutions
const substitutionTips = [
  { need: 'Buttermilk (1 cup)', substitute: '1 cup milk + 1 tablespoon lemon juice or white vinegar' },
  { need: 'Self-rising flour (1 cup)', substitute: '1 cup all-purpose flour + 1½ teaspoons baking powder + ¼ teaspoon salt' },
  { need: 'Cake flour (1 cup)', substitute: '1 cup all-purpose flour - 2 tablespoons + 2 tablespoons cornstarch' },
  { need: 'Brown sugar (1 cup)', substitute: '1 cup white sugar + 1-2 tablespoons molasses' },
  { need: 'Sour cream (1 cup)', substitute: '1 cup plain yogurt or 1 tablespoon lemon juice + enough milk to make 1 cup' },
  { need: 'Baking powder (1 teaspoon)', substitute: '¼ teaspoon baking soda + ½ teaspoon cream of tartar' },
  { need: 'Cornstarch (1 tablespoon)', substitute: '2 tablespoons all-purpose flour' },
  { need: 'Honey (1 cup)', substitute: '1¼ cup sugar + ¼ cup liquid (water or the liquid called for in recipe)' },
  { need: 'Fresh herbs (1 tablespoon)', substitute: '1 teaspoon dried herbs' },
  { need: 'Chocolate (1 ounce)', substitute: '3 tablespoons cocoa powder + 1 tablespoon butter' },
];

export default function UnitConverter() {
  const [activeTab, setActiveTab] = useState('converter');
  const [volume, setVolume] = useState<UnitConversion>({
    from: 'cup',
    to: 'tablespoon',
    value: '1',
    result: '16'
  });
  const [weight, setWeight] = useState<UnitConversion>({
    from: 'ounce',
    to: 'gram',
    value: '1',
    result: '28.35'
  });

  // Lists of available units for each conversion category
  const volumeUnits: ConversionUnit[] = ['teaspoon', 'tablespoon', 'cup', 'pint', 'quart', 'gallon', 'milliliter', 'liter'];
  const weightUnits: ConversionUnit[] = ['ounce', 'pound', 'gram', 'kilogram'];

  // Convert volume units
  const convertVolume = () => {
    if (!volume.value || isNaN(Number(volume.value))) {
      setVolume({ ...volume, result: 'Invalid input' });
      return;
    }
    
    const inputValue = parseFloat(volume.value);
    const fromFactor = volumeConversions[volume.from];
    const toFactor = volumeConversions[volume.to];
    
    const standardValue = inputValue * fromFactor;
    const result = standardValue / toFactor;
    
    setVolume({
      ...volume,
      result: result.toFixed(2)
    });
  };

  // Convert weight units
  const convertWeight = () => {
    if (!weight.value || isNaN(Number(weight.value))) {
      setWeight({ ...weight, result: 'Invalid input' });
      return;
    }
    
    const inputValue = parseFloat(weight.value);
    const fromFactor = weightConversions[weight.from];
    const toFactor = weightConversions[weight.to];
    
    const standardValue = inputValue * fromFactor;
    const result = standardValue / toFactor;
    
    setWeight({
      ...weight,
      result: result.toFixed(2)
    });
  };

  return (
    <>
      <BackButton />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold font-poppins mb-1">Kitchen Conversions</h1>
          <p className="text-neutral-600">Convert between different units and find cooking equivalents</p>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="converter">Unit Converter</TabsTrigger>
          <TabsTrigger value="common">Common Equivalents</TabsTrigger>
          <TabsTrigger value="ingredients">Ingredient Measures</TabsTrigger>
          <TabsTrigger value="substitutions">Substitutions</TabsTrigger>
        </TabsList>
        
        {/* Unit Converter Tab */}
        <TabsContent value="converter" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Volume Converter */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Volume Conversion</CardTitle>
                <CardDescription>Convert between volume measurements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="volume-value">Value</Label>
                    <div className="flex items-center space-x-2 mt-1.5">
                      <Input
                        id="volume-value"
                        type="number"
                        value={volume.value}
                        onChange={(e) => setVolume({ ...volume, value: e.target.value })}
                        className="flex-1"
                      />
                      
                      <Select 
                        value={volume.from}
                        onValueChange={(value) => setVolume({ ...volume, from: value as ConversionUnit })}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder="From" />
                        </SelectTrigger>
                        <SelectContent>
                          {volumeUnits.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit.charAt(0).toUpperCase() + unit.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <div className="bg-neutral-100 rounded-full p-2">
                      <Icon name="switch" className="text-neutral-500" />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="volume-result">Result</Label>
                    <div className="flex items-center space-x-2 mt-1.5">
                      <Input
                        id="volume-result"
                        value={volume.result}
                        readOnly
                        className="flex-1 bg-neutral-50"
                      />
                      
                      <Select 
                        value={volume.to}
                        onValueChange={(value) => setVolume({ ...volume, to: value as ConversionUnit })}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder="To" />
                        </SelectTrigger>
                        <SelectContent>
                          {volumeUnits.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit.charAt(0).toUpperCase() + unit.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button onClick={convertVolume} className="w-full">Convert</Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Weight Converter */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Weight Conversion</CardTitle>
                <CardDescription>Convert between weight measurements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="weight-value">Value</Label>
                    <div className="flex items-center space-x-2 mt-1.5">
                      <Input
                        id="weight-value"
                        type="number"
                        value={weight.value}
                        onChange={(e) => setWeight({ ...weight, value: e.target.value })}
                        className="flex-1"
                      />
                      
                      <Select 
                        value={weight.from}
                        onValueChange={(value) => setWeight({ ...weight, from: value as ConversionUnit })}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder="From" />
                        </SelectTrigger>
                        <SelectContent>
                          {weightUnits.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit.charAt(0).toUpperCase() + unit.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <div className="bg-neutral-100 rounded-full p-2">
                      <Icon name="switch" className="text-neutral-500" />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="weight-result">Result</Label>
                    <div className="flex items-center space-x-2 mt-1.5">
                      <Input
                        id="weight-result"
                        value={weight.result}
                        readOnly
                        className="flex-1 bg-neutral-50"
                      />
                      
                      <Select 
                        value={weight.to}
                        onValueChange={(value) => setWeight({ ...weight, to: value as ConversionUnit })}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder="To" />
                        </SelectTrigger>
                        <SelectContent>
                          {weightUnits.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit.charAt(0).toUpperCase() + unit.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button onClick={convertWeight} className="w-full">Convert</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Common Equivalents Tab */}
        <TabsContent value="common">
          <Card>
            <CardHeader>
              <CardTitle>Common Cooking Equivalents</CardTitle>
              <CardDescription>Reference table for common cooking measurements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md divide-y">
                <div className="grid grid-cols-2 bg-neutral-50 px-4 py-2 font-medium text-neutral-700">
                  <div>Measurement</div>
                  <div>Equals</div>
                </div>
                {commonEquivalents.map((item, index) => (
                  <div key={index} className="grid grid-cols-2 px-4 py-3 text-sm">
                    <div>{item.measure}</div>
                    <div>{item.equals}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Ingredient Measures Tab */}
        <TabsContent value="ingredients">
          <Card>
            <CardHeader>
              <CardTitle>Ingredient Equivalents</CardTitle>
              <CardDescription>Common conversions for specific ingredients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md divide-y">
                <div className="grid grid-cols-3 bg-neutral-50 px-4 py-2 font-medium text-neutral-700">
                  <div>Ingredient</div>
                  <div>Amount</div>
                  <div>Equals</div>
                </div>
                {ingredientEquivalents.map((item, index) => (
                  <div key={index} className="grid grid-cols-3 px-4 py-3 text-sm">
                    <div>{item.ingredient}</div>
                    <div>{item.amount}</div>
                    <div>{item.equals}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Substitutions Tab */}
        <TabsContent value="substitutions">
          <Card>
            <CardHeader>
              <CardTitle>Ingredient Substitutions</CardTitle>
              <CardDescription>What to use when you're missing an ingredient</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md divide-y">
                <div className="grid grid-cols-2 bg-neutral-50 px-4 py-2 font-medium text-neutral-700">
                  <div>If You Need</div>
                  <div>You Can Substitute</div>
                </div>
                {substitutionTips.map((item, index) => (
                  <div key={index} className="grid grid-cols-2 px-4 py-3 text-sm">
                    <div>{item.need}</div>
                    <div>{item.substitute}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}