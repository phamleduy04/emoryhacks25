import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useEffect, useState } from 'react';

export function WalletBalance() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicKey || !connection) {
      setBalance(null);
      setLoading(false);
      return;
    }

    const fetchBalance = async () => {
      try {
        const balance = await connection.getBalance(publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();

    // Refresh balance every 5 seconds
    const interval = setInterval(fetchBalance, 5000);

    return () => clearInterval(interval);
  }, [publicKey, connection]);

  if (!publicKey || loading) {
    return null;
  }

  if (balance === null) {
    return (
      <div className="text-xs text-slate-500">Balance: Unable to fetch</div>
    );
  }

  const isLowBalance = balance < 0.01; // Less than 0.01 SOL

  return (
    <div
      className={`text-xs ${
        isLowBalance ? 'text-orange-600 font-semibold' : 'text-slate-600'
      }`}
    >
      Balance: {balance.toFixed(4)} SOL
      {isLowBalance && ' (Low balance!)'}
    </div>
  );
}
