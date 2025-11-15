import { v } from 'convex/values';
import { action } from './_generated/server';

interface CarfaxListing {
  year: number;
  msrp: number;
  currentPrice: number;
  images?: {
    large?: string[];
  };
  dealer?: {
    name?: string;
    phone?: string;
    address?: string;
    latitude?: string;
    longitude?: string;
  };
  vdpUrl: string;
  exteriorColor: string;
  trim: string;
  vin: string;
  stockNumber: string;
  model: string;
}

interface CarfaxResponse {
  listings: CarfaxListing[];
}

interface FilteredListing {
  year: number;
  msrp: number;
  price: number;
  images: string[];
  dealer: {
    name: string | undefined;
    phone: string | undefined;
    address: string | undefined;
    latitude: string | undefined;
    longitude: string | undefined;
  };
  listingUrl: string;
  color: string;
  trim: string;
  vin: string;
  stockNumber: string;
  model: string;
}

export const getCarfax = action({
  args: {
    zipCode: v.string(),
    make: v.string(),
    model: v.string(),
    radius: v.number(),
  },
  handler: async (_ctx, args): Promise<FilteredListing[]> => {
    const carFaxData = await fetch(`
        https://helix.carfax.com/search/v2/vehicles?zip=${args.zipCode}&radius=${args.radius}&sort=BEST&make=${args.make}&model=${args.model}&certified=false&vehicleCondition=NEW&rows=24&mpgCombinedMin=0&dynamicRadius=false&fetchImageLimit=6&tpPositions=1,2,3`);
    const carFaxDataJson = (await carFaxData.json()) as CarfaxResponse;

    // Filter out listings with price = 0 and map to extract only the needed fields
    const filteredListings: FilteredListing[] = carFaxDataJson.listings
      .filter((listing: CarfaxListing) => listing.currentPrice !== 0)
      .map((listing: CarfaxListing) => ({
        year: listing.year,
        msrp: listing.msrp,
        price: listing.currentPrice,
        images: listing.images?.large || [],
        dealer: {
          name: listing.dealer?.name,
          phone: listing.dealer?.phone,
          address: listing.dealer?.address,
          latitude: listing.dealer?.latitude,
          longitude: listing.dealer?.longitude,
        },
        listingUrl: listing.vdpUrl,
        color: listing.exteriorColor,
        trim: listing.trim,
        vin: listing.vin,
        stockNumber: listing.stockNumber,
        model: listing.model,
      }));

    return filteredListings;
  },
});
