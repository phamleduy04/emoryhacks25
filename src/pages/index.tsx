// index.tsx (paste this over your current file)
'use client';

import { useAction, useQuery } from 'convex/react';
import { useState } from 'react';
import { ExternalLink, Phone } from 'lucide-react';
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
import type { FilteredListing } from '../../convex/carfax';

// Call button component (unchanged behavior)
function CallDealerButton({
                              car,
                              isLoading,
                              onCallRequest,
                          }: {
    car: FilteredListing;
    isLoading: boolean;
    onCallRequest: () => Promise<void>;
}) {
    const existingCall = useQuery(api.elevenlabs.checkExistingCall, {
        vin: car.vin,
    });

    const isDisabled = isLoading || existingCall !== null;

    const getButtonText = () => {
        if (isLoading) return 'Calling...';
        if (existingCall?.status === 'pending') return 'Call Pending';
        if (existingCall?.status === 'completed') return 'Already Called';
        if (existingCall?.status === 'quoted') return 'Quote Received';
        return 'Call Dealer using AI';
    };

    const getButtonClass = () => {
        if (existingCall?.status === 'pending')
            return 'flex-1 bg-yellow-600 hover:bg-yellow-600 cursor-pointer';
        if (existingCall?.status === 'completed')
            return 'flex-1 bg-gray-600 hover:bg-gray-600 cursor-pointer';
        if (existingCall?.status === 'quoted')
            return 'flex-1 bg-green-600 hover:bg-green-600 cursor-pointer';
        return 'flex-1 bg-blue-600 hover:bg-blue-700 cursor-pointer';
    };

    return (
        <Button className={getButtonClass()} onClick={onCallRequest} disabled={isDisabled}>
            <Phone className="w-4 h-4 mr-2" />
            {getButtonText()}
        </Button>
    );
}

export default function App() {
    // --- state (unchanged) ---
    const [make, setMake] = useState<string>('');
    const [model, setModel] = useState<string>('');
    const [zipCode, setZipCode] = useState<string>('');
    const [radius, setRadius] = useState<number[]>([50]);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<FilteredListing[]>([]);
    const [callLoadingStates, setCallLoadingStates] = useState<Record<string, boolean>>({});
    const [errors, setErrors] = useState({ make: '', model: '', zipCode: '' });

    const getCarfax = useAction(api.carfax.getCarfax);
    const requestCall = useAction(api.elevenlabs.requestCall);

    const validateForm = () => {
        const newErrors = { make: '', model: '', zipCode: '' };
        if (!make) newErrors.make = 'Please select a make';
        if (!model) newErrors.model = 'Please select a model';
        if (!zipCode) newErrors.zipCode = 'Please enter a zip code';
        else if (!/^\d{5}$/.test(zipCode)) newErrors.zipCode = 'Please enter a valid 5-digit zip code';

        setErrors(newErrors);
        return !newErrors.make && !newErrors.model && !newErrors.zipCode;
    };

    const handleSearch = async () => {
        if (!validateForm()) return;
        setIsLoading(true);
        try {
            const listings = await getCarfax({ zipCode, make, model, radius: radius[0] });

            const sortedListings = listings.sort((a, b) => {
                const discountA = a.msrp > 0 ? ((a.msrp - a.price) / a.msrp) * 100 : 0;
                const discountB = b.msrp > 0 ? ((b.msrp - b.price) / b.msrp) * 100 : 0;
                return discountB - discountA;
            });

            setResults(sortedListings);
            setTimeout(() => {
                const el = document.getElementById('results-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 150);
        } catch (error) {
            console.error('Error fetching car listings:', error);
            alert('Failed to fetch car listings. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const availableModels = make ? carModels[make] || [] : [];

    return (
        <div
            className="min-h-screen relative bg-slate-50"
            style={{
                fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto",
            }}
        >
            {/* HERO — background from public/images/car-background.jpg */}
            <section
                className="relative w-full min-h-screen bg-cover bg-center bg-no-repeat flex items-center overflow-hidden"
                style={{ 
                    backgroundImage: "url('/images/car-background.jpg')",
                    backgroundAttachment: 'fixed',
                }}
            >
                {/* Enhanced overlay for better contrast and visual depth */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-black/5" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />

                {/* Logo top-right - bright and clean */}
                <div className="absolute top-8 right-8 z-40">
                    <img
                        src="/images/logo.png"
                        alt="CarMommy logo"
                        className="w-28 h-auto drop-shadow-2xl brightness-110 contrast-110"
                        style={{ filter: 'brightness(1.2) contrast(1.1) drop-shadow(0 10px 25px rgba(0,0,0,0.3))' }}
                    />
                </div>

                {/* left column: beautiful form */}
                <div className="relative z-30 w-full max-w-7xl mx-auto px-6">
                    <div className="flex items-center min-h-screen">
                        {/* Sleek minimal form - narrower width */}
                        <div className="w-full max-w-sm">
                            <div className="my-8">
                                <Card className="bg-white p-6 shadow-xl rounded-2xl border border-gray-200">
                                    <CardHeader className="pb-0 px-0">
                                        <CardTitle className="text-2xl font-bold text-gray-900 tracking-tight">
                                            Find Your Next Car
                                        </CardTitle>
                                    </CardHeader>

                                    <div className="border-t-2 border-black my-1"></div>

                                    <CardContent className="space-y-4 px-0 pt-0">
                                        {/* MAKE */}
                                        <div className="w-full">
                                            <Label htmlFor="make" className="text-sm font-semibold text-gray-800 mb-1.5 block">
                                                Make
                                            </Label>
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
                                                    className={`w-full ${errors.make ? 'h-12 rounded-lg border-2 border-red-400 bg-white focus:ring-2 focus:ring-red-500' : 'h-12 rounded-lg border-2 border-gray-300 bg-white hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all'}`}
                                                >
                                                    <SelectValue placeholder="Select make" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        <SelectLabel>Popular Makes</SelectLabel>
                                                        {popularMakes.map((m) => (
                                                            <SelectItem key={m} value={m}>
                                                                {m}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                    <SelectGroup>
                                                        <SelectLabel>Other Makes</SelectLabel>
                                                        {otherMakes.map((m) => (
                                                            <SelectItem key={m} value={m}>
                                                                {m}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                            {errors.make && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.make}</p>}
                                        </div>

                                        {/* MODEL */}
                                        <div className="w-full">
                                            <Label htmlFor="model" className="text-sm font-semibold text-gray-800 mb-1.5 block">
                                                Model
                                            </Label>
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
                                                    className={`w-full ${errors.model ? 'h-12 rounded-lg border-2 border-red-400 bg-white focus:ring-2 focus:ring-red-500' : 'h-12 rounded-lg border-2 border-gray-300 bg-white hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed'}`}
                                                >
                                                    <SelectValue placeholder={make ? 'Select a model' : 'Select a make first'} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        <SelectLabel>Models</SelectLabel>
                                                        {availableModels.map((mm) => (
                                                            <SelectItem key={mm} value={mm}>
                                                                {mm}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                            {errors.model && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.model}</p>}
                                        </div>

                                        {/* SEARCH RADIUS */}
                                        <div className="w-full">
                                            <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">Search Radius</Label>
                                            <Select
                                                value={radius[0].toString()}
                                                onValueChange={(value) => setRadius([parseInt(value)])}
                                            >
                                                <SelectTrigger className="w-full h-12 rounded-lg border-2 border-gray-300 bg-white hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[10, 20, 30, 50, 75, 100, 150, 200].map((miles) => (
                                                        <SelectItem key={miles} value={miles.toString()}>
                                                            {miles} miles
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* ZIP */}
                                        <div className="w-full">
                                            <Label htmlFor="zipCode" className="text-sm font-semibold text-gray-800 mb-1.5 block">
                                                ZIP
                                            </Label>
                                            <Input
                                                id="zipCode"
                                                type="text"
                                                placeholder="Enter zip"
                                                value={zipCode}
                                                onChange={(e) => {
                                                    setZipCode(e.target.value);
                                                    setErrors({ ...errors, zipCode: '' });
                                                }}
                                                maxLength={5}
                                                className={`w-full ${errors.zipCode ? 'h-12 rounded-lg border-2 border-red-400 focus:ring-2 focus:ring-red-500' : 'h-12 rounded-lg border-2 border-gray-300 hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all'}`}
                                            />
                                            {errors.zipCode && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.zipCode}</p>}
                                        </div>

                                        <Button
                                            onClick={handleSearch}
                                            disabled={isLoading || !make || !model || !zipCode}
                                            className="w-full mt-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                        >
                                            {isLoading ? (
                                                <span className="flex items-center justify-center">
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Searching...
                                                </span>
                                            ) : (
                                                'Search Cars'
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* flexible spacer so the hero photo shows on the right */}
                        <div className="flex-1" />
                    </div>
                </div>
            </section>

            {/* RESULTS below hero */}
            <main className="max-w-7xl mx-auto px-6 pt-8 relative z-20 bg-slate-50">
                {results.length > 0 && (
                    <div id="results-section" className="space-y-4">
                        <h2 className="text-2xl font-bold text-slate-900">Found {results.length} Listings</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {results.map((car, index) => (
                                <Card key={index} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                                    {car.images && car.images.length > 0 && (
                                        <Carousel className="w-full">
                                            <CarouselContent>
                                                {car.images.map((image: string, imageIndex: number) => (
                                                    <CarouselItem key={imageIndex}>
                                                        <img src={image} alt={`${car.year} ${car.model} - Image ${imageIndex + 1}`} className="w-full h-64 object-cover" />
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
                                                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                                        Good Price
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="space-y-2 text-sm">
                                                <p className="text-slate-600">
                                                    <span className="font-semibold">Trim:</span> {car.trim}
                                                </p>
                                                <p className="text-slate-600">
                                                    <span className="font-semibold">Color:</span> {car.color}
                                                </p>
                                                <p className="text-slate-600">
                                                    <span className="font-semibold">VIN:</span> {car.vin}
                                                </p>
                                                <p className="text-slate-600">
                                                    <span className="font-semibold">Stock #:</span> {car.stockNumber}
                                                </p>

                                                <div className="pt-2 border-t">
                                                    <p className="text-2xl font-bold text-green-600">${car.price.toLocaleString()}</p>
                                                    {car.msrp && <p className="text-sm text-slate-500">MSRP: ${car.msrp.toLocaleString()}</p>}
                                                </div>

                                                <div className="pt-2 border-t">
                                                    <p className="font-semibold text-slate-800">{car.dealer.name}</p>
                                                    {car.dealer.phone && <p className="text-slate-600">{car.dealer.phone}</p>}
                                                    {car.dealer.address && <p className="text-slate-600">{car.dealer.address}</p>}
                                                </div>

                                                <div className="flex gap-2 mt-4">
                                                    {car.listingUrl && (
                                                        <Button className="flex-1 cursor-pointer" onClick={() => window.open(car.listingUrl, '_blank')}>
                                                            <ExternalLink className="w-4 h-4 mr-2" />
                                                            View Details
                                                        </Button>
                                                    )}
                                                    <CallDealerButton
                                                        car={car}
                                                        isLoading={callLoadingStates[car.vin] || false}
                                                        onCallRequest={async () => {
                                                            setCallLoadingStates((prev) => ({ ...prev, [car.vin]: true }));
                                                            try {
                                                                await requestCall({
                                                                    year: car.year,
                                                                    make: car.make,
                                                                    model: car.model,
                                                                    zipcode: parseInt(zipCode, 10),
                                                                    dealer_name: car.dealer.name || '',
                                                                    msrp: car.msrp,
                                                                    listing_price: car.price,
                                                                    stock_number: car.stockNumber,
                                                                    phone_number: '+14695963483',
                                                                    vin: car.vin,
                                                                });
                                                            } finally {
                                                                setCallLoadingStates((prev) => ({ ...prev, [car.vin]: false }));
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {results.length === 0 && (
                    <div className="py-24 text-center text-slate-700">
                        <p className="text-lg">Search to find listings — results will appear here.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
