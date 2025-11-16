# CarMommy

## Inspiration

One of our team members recently went to purchase a new car, and ran into a problem that nearly everyone faces: conflicting and constantly shifting prices from whatever dealership they went to visit. This caused him to have to waste countless hours negotiating and attempting to talk the price down, before finally settling on a reasonable price. After learning about this ordeal, we realized how much easier and fairer car-buying could become just by using AI to help in the process!

## What it does

Negotiating prices is something that nearly everyone dreads. That's where CarMommy steps in. CarMommy is an AI-powered car buying agent that will work on behalf of a user to negotiate fair prices across multiple dealerships. 

CarMommy searches through thousands of car listings by scraping Carfax to find the best offers in dealerships near you. It dispatches AI voice agents (powered by ElevenLabs) to call car dealerships and handle all the tedious number crunching (listing price, MSRP, etc) so you don't have to do the tedious work yourself. Additionally, it generates cinematic showcase videos of selected vehicles using Veo 3.1, Google's cutting-edge video generation model, automatically selecting the best exterior photos and creating professional presentations. Lastly, it also processes secure payments through the Solana Blockchain.

All of this happens automatically as users sit back and watch the best deals come to them!

## Architecture
<img width="5672" height="3069" alt="Untitled-2025-11-15-2043" src="https://github.com/user-attachments/assets/2c74f111-02b4-462c-a286-bd1056c923bc" />

## Features

### Car Search and Discovery
- Search for new vehicles by make, model, zip code, and search radius
- View detailed listings with images, specifications, pricing, and dealer information
- Filter and sort results by price, discount percentage, and other criteria
- Direct links to original listings on Carfax

### AI-Powered Dealer Calls
- Automated phone calls to dealers using AI voice agents
- Customizable voice selection from ElevenLabs voice library
- Real-time call status tracking (pending, completed, quoted, confirmed)
- Price negotiation tracking with confirmed quotes
- Call history and transcript summaries

### AI Video Generation
- Generate cinematic showcase videos from car images using Google Gemini
- Automatic selection of best exterior images for video creation
- Professional transitions and effects
- Videos stored and accessible for each vehicle listing

### Voice Cloning
- Record and clone your voice using ElevenLabs voice cloning technology
- Minimum 10-second recording requirement for quality voice synthesis
- Use cloned voices for AI dealer calls
- Voice preview and management

### Blockchain Payments
- Solana wallet integration for secure payments
- Pay-per-service model (0.001 SOL per service)
- Payment verification system to prevent double-spending
- Support for multiple Solana wallet providers
- Real-time wallet balance display

## Tech Stack

### Frontend
- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **shadcn/ui** - High-quality React components
- **React Router** - Client-side routing
- **Sonner** - Toast notifications

### Backend
- **Convex** - Serverless backend with real-time database
  - Database schema for calls, videos, and payments
  - Serverless functions for API integrations
  - Real-time queries and mutations

### Integrations
- **Carfax API** - Vehicle listing data
- **ElevenLabs API** - Voice synthesis and cloning
- **Google Gemini API** - AI video generation
- **Solana Web3.js** - Blockchain payment processing

### Development Tools
- **Biome** - Fast linter and formatter
- **TypeScript** - Static type checking
- **npm-run-all** - Parallel script execution

## How we built it

We built CarMommy using a fast, scalable stack: we used React, Typescript, and Vite for the front-end, and Convex for our backend to handle server logic and data. For the UI and design, we relied on Tailwind and Shad/CN UI to make it clean and responsive. For the voice agent capabilities, we used the Elevenlabs Agents Platform to enable automated phone calls to dealerships, and integrated Gemini API to access Google's powerful generative AI capabilities (Veo 3.1) to make AI-created videos of cars and also used it for email post processing (Gemini 2.5 Flash)! Lastly, we also used Solana to handle secure payments and made a web scraper to scrape Carfax for real-time car data to display on the website.

## Challenges we ran into

Creating a conversational AI voice agent that could naturally negotiate with real car dealerships was our most challenging task. We needed an AI agent that could hit multiple precise and complicated requirements. We needed the agent to understand nuanced car-buying conversations, handle pushback from the salesperson, extract pricing information from free-form responses, and maintain a professional yet friendly tone. This required extensive prompt engineering and testing with the ElevenLabs API. We went through dozens of iterations to find the right balance: our end goal was an AI Agent that would be supportive like a "car mommy" should be, without being too pushy or overwhelming such that they would fail to close deals in the first place. The agent needed to know when to push for better deals, when to accept reasonable offers, and how to gracefully handle rejection or unclear responses from dealership staff. Additionally, parsing the varied formats of dealer responses and extracting confirmed prices from unstructured email text required sophisticated AI prompting with Gemini and utilization of Gemini's structured output feature to ensure accuracy and uniformity.

One of our biggest hurdles was that there were no existing APIs we could build off of to ingest real-time car listing information. We had to develop our own custom scraping solution from scratch. We built a robust web scraper to aggregate car listings from Carfax's website to tackle this challenge. Additionally, in order to maintain accuracy, we implemented extensive error handling to deal with complicated HTML structures. 

Processing thousands of car listings, coordinating multi-step AI workflows, and handling long-running async operations initially caused significant performance issues. We worked to improve performance by carefully designing our database queries to handle real-time updates as AI agents completed dealership calls, while ensuring the UI remained responsive for the users to interact with other features on CarMommy. We also had to optimize image processing pipelines, encoding images to base64 multiple times for different AI models in order to avoid performance bottlenecks or memory issues.

## Accomplishments that we're proud of

Something we're proud of is that we were able to integrate a lot of tracks and challenges into this project: using the voice agent technologies from ElevenLabs, using Solana for payments, and using Gemini API for video generation and email post-processing. Also, we're just generally proud of the overall project that we made, since this has the potential for great social impact, as many people could benefit from this!

## What we learned

All of us were completely new to Solana, so integrating it into our project was completely foreign at first, but eventually we were able to! Additionally, this was one of our team member's first hackathon, so he learned a bunch about the entire app development process, like TypeScript, React, front-end design, Git, etc. Lastly, all of us learned a lot about how to use the agent technologies from Elevenlabs, which are genuinely so cool!

## What's next for CarMommy

After the hackathon, there are several possible venues that we could expand into, but the most likely is to just flesh out the whole project and make it feel like a true personal car-buying assistant that you can depend on! Additionally, some features that we are thinking of adding are capabilities to track price changes over time and to be able to alert users when great deals pop up.

## Prerequisites

- Node.js 18+ and npm
- Convex account and project
- Solana wallet (Phantom, Solflare, etc.)
- API keys for:
  - ElevenLabs (for voice synthesis and cloning)
  - Google Gemini (for video generation)
  - Carfax (for vehicle listings)

## Project Structure

```
emoryhacks25/
├── convex/                 # Backend (Convex)
│   ├── _generated/        # Auto-generated Convex types
│   ├── carfax.ts          # Carfax API integration
│   ├── elevenlabs.ts      # ElevenLabs database operations
│   ├── elevenlabsActions.ts # ElevenLabs API actions
│   ├── gemini.ts          # Google Gemini video generation
│   ├── schema.ts          # Database schema definitions
│   ├── solana.ts          # Solana wallet queries
│   └── solanaPayment.ts   # Payment verification
├── src/
│   ├── _components/        # Feature components
│   │   └── VoiceCloning.tsx
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── WalletBalance.tsx
│   │   └── DevnetFaucet.tsx
│   ├── contexts/         # React contexts
│   │   └── SolanaWalletProvider.tsx
│   ├── data/             # Static data
│   │   └── carData.ts    # Car makes and models
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   │   ├── solanaPayment.ts
│   │   └── utils.ts
│   ├── pages/           # Page components
│   │   └── index.tsx    # Main application page
│   ├── index.css       # Global styles
│   └── main.tsx        # Application entry point
├── public/              # Static assets
│   └── images/         # Images and logos
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Database Schema

### Calls Table
Tracks AI dealer calls with the following fields:
- `callSid` - Unique call identifier
- `conversation_id` - Conversation tracking ID
- `year`, `make`, `model` - Vehicle information
- `zipcode` - Search location
- `dealer_name` - Dealer information
- `msrp`, `listing_price` - Pricing information
- `stock_number`, `vin` - Vehicle identifiers
- `phone_number` - Dealer contact
- `status` - Call status (pending, completed, failed, quoted, confirmed_quote)
- `transcript_summary` - AI-generated call summary
- `call_successful` - Boolean success indicator
- `confirmed_price` - Negotiated price if available

### Videos Table
Stores generated car showcase videos:
- `storageId` - Convex storage reference
- `vin` - Vehicle identification number

### Payments Table
Tracks Solana payment transactions:
- `signature` - Transaction signature
- `amount` - Payment amount in SOL
- `merchantAddress` - Payment recipient address

## Usage

### Searching for Cars

1. Select a car make from the dropdown
2. Choose a model for the selected make
3. Enter your zip code (5 digits)
4. Select search radius (10-200 miles)
5. Choose an AI voice for dealer calls
6. Click "Search Cars"

Results are sorted by discount percentage, showing the best deals first.

### Making AI Dealer Calls

1. Connect your Solana wallet
2. Ensure you have sufficient SOL balance (0.001 SOL per call)
3. Click "Call Dealer" on any car listing
4. Approve the payment transaction
5. The AI will call the dealer and negotiate on your behalf
6. Track call status in real-time
7. View confirmed quotes when available

### Generating Car Videos

1. Connect your Solana wallet
2. Click "Generate Video" on a car listing with images
3. Approve the payment transaction (0.001 SOL)
4. Wait for video generation (may take a few minutes)
5. View the generated showcase video

### Cloning Your Voice

1. Expand the "Clone Your Voice" accordion
2. Enter a name for your voice
3. Click "Start Recording" and speak for at least 10 seconds
4. Click "Stop Recording" when finished
5. Review the recording preview
6. Click "Upload Voice" to create the cloned voice
7. Use your cloned voice for dealer calls by selecting it in the voice dropdown

## Payment System

The application uses Solana devnet for payments. Each premium feature (AI calls, video generation) costs 0.001 SOL.

### Payment Flow

1. User initiates a paid action
2. Frontend requests payment via Solana wallet
3. User approves transaction in wallet
4. Backend verifies payment on Solana blockchain
5. Payment signature is checked against database to prevent reuse
6. Service is activated upon successful verification

### Getting Test SOL

For development and testing, use the Solana devnet faucet to get test SOL:
- Visit a Solana devnet faucet
- Enter your wallet address
- Request test SOL

## API Integrations

### Carfax API
- Endpoint: `https://helix.carfax.com/search/v2/vehicles`
- Used for fetching vehicle listings based on search criteria
- Returns vehicle details, images, pricing, and dealer information

### ElevenLabs API
- Voice synthesis for AI dealer calls
- Voice cloning for custom voice creation
- Conversation AI for automated phone calls
- Requires API key, agent ID, and phone number ID

### Google Gemini API
- Video generation using Veo 3.1 model
- Image analysis and selection
- Video storage and retrieval
- Requires API key with video generation permissions
