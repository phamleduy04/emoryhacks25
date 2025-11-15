'use client';

import { useAction } from 'convex/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { carModels, otherMakes, popularMakes } from '@/data/carData';
import { api } from '../../convex/_generated/api';

export default function App() {
  const [make, setMake] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [zipCode, setZipCode] = useState<string>('');
  const [radius, setRadius] = useState<number[]>([50]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [errors, setErrors] = useState({
    make: '',
    model: '',
    zipCode: '',
  });

  const getCarfax = useAction(api.carfax.getCarfax);

  const validateForm = () => {
    const newErrors = {
      make: '',
      model: '',
      zipCode: '',
    };

    if (!make) {
      newErrors.make = 'Please select a make';
    }
    if (!model) {
      newErrors.model = 'Please select a model';
    }
    if (!zipCode) {
      newErrors.zipCode = 'Please enter a zip code';
    } else if (!/^\d{5}$/.test(zipCode)) {
      newErrors.zipCode = 'Please enter a valid 5-digit zip code';
    }

    setErrors(newErrors);
    return !newErrors.make && !newErrors.model && !newErrors.zipCode;
  };

  const handleSearch = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const listings = await getCarfax({
        zipCode,
        make,
        model,
        radius: radius[0],
      });

      // Sort by discount percentage (price vs MSRP)
      const sortedListings = listings.sort((a, b) => {
        const discountA = a.msrp > 0 ? ((a.msrp - a.price) / a.msrp) * 100 : 0;
        const discountB = b.msrp > 0 ? ((b.msrp - b.price) / b.msrp) * 100 : 0;
        return discountB - discountA; // Higher discount first
      });

      setResults(sortedListings);
    } catch (error) {
      console.error('Error fetching car listings:', error);
      alert('Failed to fetch car listings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const availableModels = make ? carModels[make] || [] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">CarMommy</h1>
        </div>

        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle>Search Criteria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Make Selection */}
              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                <Select
                  value={make}
                  onValueChange={(value) => {
                    setMake(value);
                    setModel('');
                    setErrors({ ...errors, make: '' });
                  }}
                >
                  <SelectTrigger
                    id="make"
                    className={errors.make ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder="Select a make" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Popular Makes</SelectLabel>
                      {popularMakes.map((makeName) => (
                        <SelectItem key={makeName} value={makeName}>
                          {makeName}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Other Makes</SelectLabel>
                      {otherMakes.map((makeName) => (
                        <SelectItem key={makeName} value={makeName}>
                          {makeName}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.make && (
                  <p className="text-sm text-red-500">{errors.make}</p>
                )}
              </div>

              {/* Model Selection */}
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select
                  value={model}
                  onValueChange={(value) => {
                    setModel(value);
                    setErrors({ ...errors, model: '' });
                  }}
                  disabled={!make}
                >
                  <SelectTrigger
                    id="model"
                    className={errors.model ? 'border-red-500' : ''}
                  >
                    <SelectValue
                      placeholder={
                        make ? 'Select a model' : 'Select a make first'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Models</SelectLabel>
                      {availableModels.map((modelName) => (
                        <SelectItem key={modelName} value={modelName}>
                          {modelName}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.model && (
                  <p className="text-sm text-red-500">{errors.model}</p>
                )}
              </div>

              {/* Zip Code */}
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  type="text"
                  placeholder="Enter zip code"
                  value={zipCode}
                  onChange={(e) => {
                    setZipCode(e.target.value);
                    setErrors({ ...errors, zipCode: '' });
                  }}
                  maxLength={5}
                  className={errors.zipCode ? 'border-red-500' : ''}
                />
                {errors.zipCode && (
                  <p className="text-sm text-red-500">{errors.zipCode}</p>
                )}
              </div>

              {/* Radius Slider */}
              <div className="space-y-2">
                <Label htmlFor="radius">Search Radius: {radius[0]} miles</Label>
                <Slider
                  id="radius"
                  min={10}
                  max={200}
                  step={10}
                  value={radius}
                  onValueChange={setRadius}
                  className="mt-2"
                />
              </div>
            </div>

            <Button
              onClick={handleSearch}
              disabled={isLoading || !make || !model || !zipCode}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Searching...' : 'Search Cars'}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">
              Found {results.length} Listings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((car, index) => (
                <Card
                  key={index}
                  className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                >
                  {car.images && car.images.length > 0 && (
                    <Carousel className="w-full">
                      <CarouselContent>
                        {car.images.map((image: string, imageIndex: number) => (
                          <CarouselItem key={imageIndex}>
                            <img
                              src={image}
                              alt={`${car.year} ${car.model} - Image ${imageIndex + 1}`}
                              className="w-full h-64 object-cover"
                            />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {car.images.length > 1 && (
                        <>
                          <CarouselPrevious className="left-2" />
                          <CarouselNext className="right-2" />
                        </>
                      )}
                    </Carousel>
                  )}
                  <CardContent className="p-0">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-bold text-slate-900">
                          {car.year} {car.model}
                        </h3>
                        {car.msrp > 0 && car.price < car.msrp && (
                          <Badge
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Good Price
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="text-slate-600">
                          <span className="font-semibold">Trim:</span>{' '}
                          {car.trim}
                        </p>
                        <p className="text-slate-600">
                          <span className="font-semibold">Color:</span>{' '}
                          {car.color}
                        </p>
                        <p className="text-slate-600">
                          <span className="font-semibold">VIN:</span> {car.vin}
                        </p>
                        <p className="text-slate-600">
                          <span className="font-semibold">Stock #:</span>{' '}
                          {car.stockNumber}
                        </p>
                        <div className="pt-2 border-t">
                          <p className="text-2xl font-bold text-green-600">
                            ${car.price.toLocaleString()}
                          </p>
                          {car.msrp && (
                            <p className="text-sm text-slate-500">
                              MSRP: ${car.msrp.toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="pt-2 border-t">
                          <p className="font-semibold text-slate-800">
                            {car.dealer.name}
                          </p>
                          {car.dealer.phone && (
                            <p className="text-slate-600">{car.dealer.phone}</p>
                          )}
                          {car.dealer.address && (
                            <p className="text-slate-600">
                              {car.dealer.address}
                            </p>
                          )}
                        </div>
                        {car.listingUrl && (
                          <Button
                            className="w-full mt-4"
                            onClick={() =>
                              window.open(car.listingUrl, '_blank')
                            }
                          >
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
