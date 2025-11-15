'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import type { Connection } from '@solana/web3.js';
import { useAction, useQuery } from 'convex/react';
import { ExternalLink, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { VoiceCloning } from '@/_components/VoiceCloning';
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
import { WalletBalance } from '@/components/WalletBalance';
import { carModels, otherMakes, popularMakes } from '@/data/carData';
import { PAYMENT_AMOUNT_SOL, sendPayment } from '@/lib/solanaPayment';
import { api } from '../../convex/_generated/api';
import type { FilteredListing } from '../../convex/carfax';

// Component to handle call dealer button with database check and payment
function CallDealerButton({
  car,
  isLoading,
  onCallRequest,
  wallet,
  connection,
  merchantAddress,
}: {
  car: FilteredListing;
  isLoading: boolean;
  onCallRequest: (paymentSignature: string) => Promise<void>;
  wallet: ReturnType<typeof useWallet>;
  connection: Connection;
  merchantAddress: string | undefined;
}) {
  const existingCall = useQuery(api.elevenlabs.checkExistingCall, {
    vin: car.vin,
  });

  const isDisabled = isLoading || existingCall !== null || !wallet.connected;

  const getButtonText = () => {
    if (isLoading) return 'Processing...';
    if (!wallet.connected) return 'Connect Wallet';
    if (existingCall?.status === 'pending') return 'Call Pending';
    if (existingCall?.status === 'completed') return 'Already Called';
    if (existingCall?.status === 'quoted') return 'Verbal Offer Received';
    return `Call Dealer (${PAYMENT_AMOUNT_SOL} SOL)`;
  };

  const getButtonClass = () => {
    if (!wallet.connected) return 'flex-1 bg-gray-500 hover:bg-gray-600';
    if (existingCall?.status === 'pending')
      return 'flex-1 bg-yellow-600 hover:bg-yellow-600';
    if (existingCall?.status === 'completed')
      return 'flex-1 bg-gray-600 hover:bg-gray-600';
    if (existingCall?.status === 'quoted')
      return 'flex-1 bg-green-600 hover:bg-green-600';
    return 'flex-1 bg-blue-600 hover:bg-blue-700';
  };

  const handleClick = async () => {
    if (!wallet.connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!merchantAddress) {
      toast.error('Merchant address not configured');
      return;
    }

    try {
      // Send payment first
      toast.info('Sending payment...');
      const signature = await sendPayment(merchantAddress, wallet, connection);
      toast.success('Payment sent! Verifying...');

      // Then call the dealer
      await onCallRequest(signature);
      toast.success('Call requested successfully!');
    } catch (error) {
      console.error('Payment or call error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to process payment',
      );
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-2">
      <Button
        className={getButtonClass()}
        onClick={handleClick}
        disabled={isDisabled}
      >
        <Phone className="w-4 h-4 mr-2" />
        {getButtonText()}
      </Button>
      {existingCall?.status === 'quoted' && existingCall?.confirmed_price && (
        <div className="text-center">
          <p className="text-sm font-semibold text-purple-600">
            Negotiated Price: ${existingCall.confirmed_price.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [make, setMake] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [zipCode, setZipCode] = useState<string>('');
  const [radius, setRadius] = useState<number[]>([50]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<FilteredListing[]>([]);
  const [callLoadingStates, setCallLoadingStates] = useState<
    Record<string, boolean>
  >({});
  const [errors, setErrors] = useState({
    make: '',
    model: '',
    zipCode: '',
  });
  const [voices, setVoices] = useState<
    Array<{ name: string; voiceId: string }>
  >([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);

  // Solana wallet hooks
  const wallet = useWallet();
  const { connection } = useConnection();

  // Convex actions and queries
  const getCarfax = useAction(api.carfax.getCarfax);
  const requestCall = useAction(api.elevenlabsActions.requestCall);
  const getVoices = useAction(api.elevenlabsActions.getVoices);

  // Fetch voices on component mount
  useEffect(() => {
    const fetchVoices = async () => {
      setIsLoadingVoices(true);
      try {
        const voicesList = await getVoices();
        setVoices(voicesList);
        // Set first voice as default if available
        if (voicesList.length > 0) {
          setSelectedVoiceId(voicesList[0].voiceId);
        }
      } catch (error) {
        console.error('Error fetching voices:', error);
      } finally {
        setIsLoadingVoices(false);
      }
    };

    fetchVoices();
  }, [getVoices]);
  const merchantAddress = useQuery(api.solana.getMerchantAddress);

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
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">CarMommy</h1>
          </div>
          <div className="flex items-center gap-4">
            {wallet.connected && wallet.publicKey && (
              <div className="flex flex-col items-end">
                <div className="text-sm text-slate-600">
                  {wallet.publicKey.toString().slice(0, 4)}...
                  {wallet.publicKey.toString().slice(-4)}
                </div>
                <WalletBalance />
              </div>
            )}
            <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
          </div>
        </div>

        {/* Voice Cloning Card */}
        <div className="mb-8">
          <VoiceCloning />
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

              {/* Voice Selection */}
              <div className="space-y-2">
                <Label htmlFor="voice">AI Voice for Calls</Label>
                <Select
                  value={selectedVoiceId}
                  onValueChange={setSelectedVoiceId}
                  disabled={isLoadingVoices || voices.length === 0}
                >
                  <SelectTrigger id="voice">
                    <SelectValue
                      placeholder={
                        isLoadingVoices
                          ? 'Loading voices...'
                          : voices.length === 0
                            ? 'No voices available'
                            : 'Select a voice'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Available Voices</SelectLabel>
                      {voices.map((voice) => (
                        <SelectItem key={voice.voiceId} value={voice.voiceId}>
                          {voice.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
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
              {results.map((car) => (
                <Card
                  key={car.vin}
                  className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                >
                  {car.images && car.images.length > 0 && (
                    <Carousel className="w-full">
                      <CarouselContent>
                        {car.images.map((image: string) => (
                          <CarouselItem key={image}>
                            <img
                              src={image}
                              alt={`${car.year} ${car.model} view`}
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
                        <div className="flex gap-2 mt-4">
                          {car.listingUrl && (
                            <Button
                              className="flex-1"
                              onClick={() =>
                                window.open(car.listingUrl, '_blank')
                              }
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          )}
                          <CallDealerButton
                            car={car}
                            isLoading={callLoadingStates[car.vin] || false}
                            wallet={wallet}
                            connection={connection}
                            merchantAddress={merchantAddress}
                            onCallRequest={async (paymentSignature: string) => {
                              setCallLoadingStates((prev) => ({
                                ...prev,
                                [car.vin]: true,
                              }));
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
                                  voice_id: selectedVoiceId,
                                  paymentSignature,
                                });
                              } finally {
                                setCallLoadingStates((prev) => ({
                                  ...prev,
                                  [car.vin]: false,
                                }));
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
      </div>
    </div>
  );
}
