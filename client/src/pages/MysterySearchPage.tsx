import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import MysterySearchGame from "@/components/MysterySearchGame";

export default function MysterySearchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
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
            🔍 Mystery Search Game
          </h1>
          
          <div className="w-32"></div> {/* Spacer for centering */}
        </div>

        {/* Game Component */}
        <div className="max-w-4xl mx-auto">
          <MysterySearchGame />
        </div>

        {/* Game Instructions */}
        <div className="max-w-4xl mx-auto mt-8 bg-white/10 backdrop-blur rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-4">How to Play</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">🎯 Game Rules</h3>
              <ul className="space-y-2 text-sm">
                <li>• Register for $1.00 before the game starts</li>
                <li>• Each round runs for exactly 3 days</li>
                <li>• Find the complete 12-word seed phrase to win</li>
                <li>• Winner takes the entire prize pool</li>
                <li>• Only registered users can submit guesses</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">🧩 Clue System</h3>
              <ul className="space-y-2 text-sm">
                <li>• Words 1 and 10 revealed immediately</li>
                <li>• After 24h: Word 4 revealed</li>
                <li>• Every 4h after: More words revealed</li>
                <li>• Wrong guess = 1 minute cooldown</li>
                <li>• All words revealed if no winner after 3 days</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}