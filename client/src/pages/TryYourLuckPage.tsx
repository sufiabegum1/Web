import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import TryYourLuckGame from "@/components/TryYourLuckGame";

export default function TryYourLuckPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/game-zone">
            <Button variant="ghost" className="text-white hover:bg-white/10" data-testid="button-back-to-games">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Game Zone
            </Button>
          </Link>
          
          <h1 className="text-4xl font-bold text-white text-center">
            🎲 Try Your Luck Game
          </h1>
          
          <div className="w-32"></div> {/* Spacer for centering */}
        </div>

        {/* Game Component */}
        <div className="max-w-4xl mx-auto">
          <TryYourLuckGame />
        </div>

        {/* Game Instructions */}
        <div className="max-w-4xl mx-auto mt-8 bg-white/10 backdrop-blur rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-4">How to Play</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">🎯 Game Rules</h3>
              <ul className="space-y-2 text-sm">
                <li>• Free to play - just lock $1.00 from your balance</li>
                <li>• Each round runs for 3 days</li>
                <li>• One random winner takes the entire prize pool</li>
                <li>• Choose between Standard or Lock Until Win</li>
                <li>• Fair random selection for winners</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">🔒 Lock Options</h3>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Standard (3 days):</strong> Get refund if you don't win</li>
                <li>• <strong>Lock Until Win:</strong> Money stays locked across rounds</li>
                <li>• Can request unlock for "Until Win" funds</li>
                <li>• Unlock takes effect after current round ends</li>
                <li>• Winner gets prize pool regardless of lock type</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
            <h3 className="text-lg font-semibold mb-2 text-yellow-300">💡 Strategy Tips</h3>
            <p className="text-sm">
              "Lock Until Win" increases your chances over multiple rounds, but "Standard" gives you safety with guaranteed refunds. 
              Choose based on your risk tolerance and how lucky you're feeling!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}