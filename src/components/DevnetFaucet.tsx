import { useWallet } from '@solana/wallet-adapter-react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function DevnetFaucet() {
  const { publicKey } = useWallet();

  const faucetUrls = [
    {
      name: 'Solana Faucet',
      url: `https://faucet.solana.com/?address=${publicKey?.toString() || ''}`,
    },
    {
      name: 'QuickNode Faucet',
      url: `https://faucet.quicknode.com/solana/devnet?address=${publicKey?.toString() || ''}`,
    },
    {
      name: 'SolFaucet',
      url: `https://solfaucet.com/?address=${publicKey?.toString() || ''}`,
    },
  ];

  if (!publicKey) {
    return null;
  }

  return (
    <Card className="mb-4 border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="text-lg">Get Free Devnet SOL</CardTitle>
        <CardDescription>
          You need devnet SOL to make payments. Get free test SOL from these
          faucets:
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm font-mono text-slate-600 break-all">
            {publicKey.toString()}
          </div>
          <div className="flex flex-wrap gap-2">
            {faucetUrls.map((faucet) => (
              <Button
                key={faucet.name}
                variant="outline"
                size="sm"
                onClick={() => window.open(faucet.url, '_blank')}
                className="text-xs"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                {faucet.name}
              </Button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            💡 Copy your address above and request SOL from any faucet. You'll
            receive free test SOL in a few seconds!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
