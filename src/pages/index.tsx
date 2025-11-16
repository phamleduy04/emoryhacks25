// index.tsx (paste this over your current file)
'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import type { Connection } from '@solana/web3.js';
import { useAction, useQuery } from 'convex/react';
import { ExternalLink, Phone, Video } from 'lucide-react';
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
    if (existingCall?.status === 'confirmed_quote')
      return 'Email Quote Received';
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
    if (existingCall?.status === 'confirmed_quote')
      return 'flex-1 bg-indigo-600 hover:bg-indigo-600';
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
      {existingCall?.status === 'confirmed_quote' &&
        existingCall?.confirmed_price && (
          <div className="text-center">
            <p className="text-sm font-semibold text-indigo-600">
              Email Quote: ${existingCall.confirmed_price.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500">Received via email</p>
          </div>
        )}
    </div>
  );
}

// Component to handle video generation button with payment
function GenerateVideoButton({
  car,
  wallet,
  connection,
  merchantAddress,
}: {
  car: FilteredListing;
  wallet: ReturnType<typeof useWallet>;
  connection: Connection;
  merchantAddress: string | undefined;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const generateVideo = useAction(api.gemini.generateVideo);
  const existingVideo = useQuery(api.gemini.getVideoByVin, {
    vin: car.vin,
  });

  const isDisabled =
    isGenerating || existingVideo !== null || !wallet.connected;

  const getButtonText = () => {
    if (isGenerating) return 'Generating...';
    if (!wallet.connected) return 'Connect Wallet';
    if (existingVideo) return 'Video Ready';
    return `Generate Video (${PAYMENT_AMOUNT_SOL} SOL)`;
  };

  const getButtonClass = () => {
    if (!wallet.connected) return 'flex-1 bg-gray-500 hover:bg-gray-600';
    if (existingVideo) return 'flex-1 bg-gray-600 hover:bg-gray-600';
    return 'flex-1 bg-purple-600 hover:bg-purple-700';
  };

  const handleGenerateVideo = async () => {
    if (!wallet.connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!merchantAddress) {
      toast.error('Merchant address not configured');
      return;
    }

    if (!car.images || car.images.length === 0) {
      toast.error('No images available for video generation');
      return;
    }

    setIsGenerating(true);
    try {
      // Send payment first
      toast.info('Sending payment...');
      await sendPayment(merchantAddress, wallet, connection);
      toast.success('Payment sent! Generating video...');

      // Then generate video
      toast.info('Generating video... This may take a few minutes.');
      await generateVideo({
        vin: car.vin,
        images: car.images,
      });
      toast.success('Video generated successfully!');
    } catch (error) {
      console.error('Payment or video generation error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to process payment or generate video',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const videoUrl = existingVideo?.url || null;

  return (
    <div className="flex flex-col gap-2">
      <Button
        className={getButtonClass()}
        onClick={handleGenerateVideo}
        disabled={isDisabled}
      >
        <Video className="w-4 h-4 mr-2" />
        {getButtonText()}
      </Button>
      {videoUrl && (
        <div className="mt-2">
          <video
            src={videoUrl}
            controls
            className="w-full rounded-lg"
            style={{ maxHeight: '300px' }}
          >
            <track kind="captions" />
            Your browser does not support the video tag.
          </video>
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
    const newErrors = { make: '', model: '', zipCode: '' };
    if (!make) newErrors.make = 'Please select a make';
    if (!model) newErrors.model = 'Please select a model';
    if (!zipCode) newErrors.zipCode = 'Please enter a zip code';
    else if (!/^\d{5}$/.test(zipCode))
      newErrors.zipCode = 'Please enter a valid 5-digit zip code';

    setErrors(newErrors);
    return !newErrors.make && !newErrors.model && !newErrors.zipCode;
  };

  const handleSearch = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const listings = await getCarfax({
        zipCode,
        make,
        model,
        radius: radius[0],
      });

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
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto",
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
        <div className="absolute top-8 right-8 z-40 flex items-center gap-4">
          {wallet.connected && wallet.publicKey && (
            <div className="flex flex-col items-end bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
              <div className="text-sm text-slate-600">
                {wallet.publicKey.toString().slice(0, 4)}...
                {wallet.publicKey.toString().slice(-4)}
              </div>
              <WalletBalance />
            </div>
          )}
          <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !shadow-lg" />
          <img
            src="/images/logo.png"
            alt="CarMommy logo"
            className="w-28 h-auto drop-shadow-2xl brightness-110 contrast-110"
            style={{
              filter:
                'brightness(1.2) contrast(1.1) drop-shadow(0 10px 25px rgba(0,0,0,0.3))',
            }}
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
                      <Label
                        htmlFor="make"
                        className="text-sm font-semibold text-gray-800 mb-1.5 block"
                      >
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
                      {errors.make && (
                        <p className="text-xs text-red-500 mt-1.5 font-medium">
                          {errors.make}
                        </p>
                      )}
                    </div>

                    {/* MODEL */}
                    <div className="w-full">
                      <Label
                        htmlFor="model"
                        className="text-sm font-semibold text-gray-800 mb-1.5 block"
                      >
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
                          <SelectValue
                            placeholder={
                              make ? 'Select a model' : 'Select a make first'
                            }
                          />
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
                      {errors.model && (
                        <p className="text-xs text-red-500 mt-1.5 font-medium">
                          {errors.model}
                        </p>
                      )}
                    </div>

                    {/* SEARCH RADIUS */}
                    <div className="w-full">
                      <Label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                        Search Radius
                      </Label>
                      <Select
                        value={radius[0].toString()}
                        onValueChange={(value) =>
                          setRadius([parseInt(value, 10)])
                        }
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
                      <Label
                        htmlFor="zipCode"
                        className="text-sm font-semibold text-gray-800 mb-1.5 block"
                      >
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
                      {errors.zipCode && (
                        <p className="text-xs text-red-500 mt-1.5 font-medium">
                          {errors.zipCode}
                        </p>
                      )}
                    </div>

                    {/* Voice Selection */}
                    <div className="w-full">
                      <Label
                        htmlFor="voice"
                        className="text-sm font-semibold text-gray-800 mb-1.5 block"
                      >
                        AI Voice for Calls
                      </Label>
                      <Select
                        value={selectedVoiceId}
                        onValueChange={setSelectedVoiceId}
                        disabled={isLoadingVoices || voices.length === 0}
                      >
                        <SelectTrigger
                          id="voice"
                          className="w-full h-12 rounded-lg border-2 border-gray-300 bg-white hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
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
                              <SelectItem
                                key={voice.voiceId}
                                value={voice.voiceId}
                              >
                                {voice.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleSearch}
                      disabled={isLoading || !make || !model || !zipCode}
                      className="w-full mt-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            role="img"
                            aria-label="Loading"
                          >
                            <title>Loading</title>
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
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

      {/* Voice Cloning Card - visible after hero section */}
      <div className="max-w-7xl mx-auto px-6 pt-8 relative z-20 bg-slate-50">
        <div className="mb-8">
          <VoiceCloning />
        </div>
      </div>

      {/* RESULTS below hero */}
      <main className="max-w-7xl mx-auto px-6 pb-8 relative z-20 bg-slate-50">
        {results.length > 0 && (
          <div id="results-section" className="space-y-4">
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
                        {car.images.map((image: string, imageIndex: number) => (
                          <CarouselItem key={image}>
                            <img
                              src={image}
                              alt={`${car.year} ${car.model} - ${imageIndex + 1}`}
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
                              className="flex-1 cursor-pointer"
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
                        <div className="mt-4">
                          <GenerateVideoButton
                            car={car}
                            wallet={wallet}
                            connection={connection}
                            merchantAddress={merchantAddress}
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
            <p className="text-lg">
              Search to find listings — results will appear here.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
