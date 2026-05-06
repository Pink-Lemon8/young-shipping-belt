"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Medal,
  Award,
  Package,
  TrendingUp,
  Zap,
  Star,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserNav } from "@/components/layout/user-nav";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { refreshLeaderboardData } from "./action";

type LeaderboardEntry = {
  rank: number;
  userId: string | null;
  userName: string;
  userEmail: string | null;
  beltCode: string | null;
  count: number;
};

type LeaderboardContentProps = {
  stage1Data: LeaderboardEntry[];
  stage2Data: LeaderboardEntry[];
  stage3Data: LeaderboardEntry[];
  totalCompletedToday: number;
  currentUserId?: string | null;
};

export default function LeaderboardContent({
  stage1Data: initialStage1Data,
  stage2Data: initialStage2Data,
  stage3Data: initialStage3Data,
  totalCompletedToday: initialTotalCompleted,
  currentUserId,
}: LeaderboardContentProps) {
  const [glitchActive, setGlitchActive] = useState(false);
  const [stage1Data, setStage1Data] = useState(initialStage1Data);
  const [stage2Data, setStage2Data] = useState(initialStage2Data);
  const [stage3Data, setStage3Data] = useState(initialStage3Data);
  const [totalCompletedToday, setTotalCompletedToday] = useState(
    initialTotalCompleted
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    // Random VHS glitch effect
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.95) {
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 150);
      }
    }, 3000);

    return () => clearInterval(glitchInterval);
  }, []);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const refreshData = async () => {
      setIsRefreshing(true);
      const result = await refreshLeaderboardData();

      if (result.success && result.data) {
        setStage1Data(result.data.stage1Data);
        setStage2Data(result.data.stage2Data);
        setStage3Data(result.data.stage3Data);
        setTotalCompletedToday(result.data.totalCompletedToday);
        setLastRefresh(new Date());
      }

      setIsRefreshing(false);
    };

    const intervalId = setInterval(refreshData, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    const result = await refreshLeaderboardData();

    if (result.success && result.data) {
      setStage1Data(result.data.stage1Data);
      setStage2Data(result.data.stage2Data);
      setStage3Data(result.data.stage3Data);
      setTotalCompletedToday(result.data.totalCompletedToday);
      setLastRefresh(new Date());
    }

    setIsRefreshing(false);
  };

  const totalProcessed =
    stage1Data.reduce((sum, entry) => sum + entry.count, 0) +
    stage2Data.reduce((sum, entry) => sum + entry.count, 0) +
    stage3Data.reduce((sum, entry) => sum + entry.count, 0);

  const topPlayer = [...stage1Data, ...stage2Data, ...stage3Data].sort(
    (a, b) => b.count - a.count
  )[0];

  const tickerMessages = [
    `★ TOTAL ORDERS TODAY: ${totalProcessed} ★`,
    topPlayer
      ? `★ TOP PERFORMER: ${topPlayer.userName.toUpperCase()} - ${topPlayer.count} ORDERS ★`
      : "",
    `★ STAGE 1 LEADERS: ${stage1Data
      .slice(0, 3)
      .map((e) => e.userName.toUpperCase())
      .join(" • ")} ★`,
    `★ STAGE 2 LEADERS: ${stage2Data
      .slice(0, 3)
      .map((e) => e.userName.toUpperCase())
      .join(" • ")} ★`,
    `★ STAGE 3 LEADERS: ${stage3Data
      .slice(0, 3)
      .map((e) => e.userName.toUpperCase())
      .join(" • ")} ★`,
    `★ KEEP PUSHING! EVERY ORDER COUNTS! ★`,
  ]
    .filter(Boolean)
    .join("   |||   ");

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <Trophy className="h-6 w-6 text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)] animate-pulse" />
        );
      case 2:
        return (
          <Medal className="h-6 w-6 text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.8)]" />
        );
      case 3:
        return (
          <Award className="h-6 w-6 text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]" />
        );
      default:
        return (
          <span
            className="text-lg font-black text-purple-400 drop-shadow-[0_0_4px_rgba(192,132,252,0.6)]"
            style={{ fontFamily: "monospace" }}
          >
            #{rank}
          </span>
        );
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1)
      return "bg-gradient-to-br from-yellow-500 via-yellow-400 to-yellow-600 border-4 border-yellow-300 shadow-[0_0_20px_rgba(253,224,71,0.6)]";
    if (rank === 2)
      return "bg-gradient-to-br from-gray-400 via-gray-300 to-gray-500 border-4 border-gray-200 shadow-[0_0_20px_rgba(209,213,219,0.5)]";
    if (rank === 3)
      return "bg-gradient-to-br from-orange-500 via-orange-400 to-orange-600 border-4 border-orange-300 shadow-[0_0_20px_rgba(251,146,60,0.5)]";
    return "bg-gradient-to-br from-purple-900 to-indigo-900 border-4 border-purple-500";
  };

  const renderLeaderboard = (
    data: LeaderboardEntry[],
    stageName: string,
    stageColor: string
  ) => {
    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-gradient-to-b from-purple-950 to-black border-6 border-purple-600 rounded-lg shadow-[0_0_20px_rgba(168,85,247,0.4)]">
          <Package className="h-16 w-16 text-purple-500 mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
          <p
            className="text-xl font-black text-cyan-400 mb-1 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]"
            style={{ fontFamily: "monospace" }}
          >
            NO PLAYERS
          </p>
          <p
            className="text-sm text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]"
            style={{ fontFamily: "monospace" }}
          >
            INSERT COIN!
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {data.map((entry) => (
          <div
            key={`${entry.userId}-${entry.rank}`}
            className={cn(
              "relative bg-gradient-to-r from-black via-purple-950 to-black border-4 rounded-lg overflow-hidden transition-all",
              entry.userId === currentUserId &&
                "border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-pulse",
              entry.rank <= 3
                ? "border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.6)]"
                : "border-purple-600"
            )}
          >
            {entry.rank <= 3 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-500/10 to-transparent animate-pulse" />
            )}
            <div className="relative p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-lg flex-shrink-0",
                      getRankBadge(entry.rank)
                    )}
                  >
                    {getRankIcon(entry.rank)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p
                        className="font-black text-lg text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] tracking-wide truncate"
                        style={{ fontFamily: "monospace" }}
                      >
                        {entry.userName.toUpperCase()}
                      </p>
                      {entry.userId === currentUserId && (
                        <Star className="h-4 w-4 text-yellow-400 flex-shrink-0 animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                      )}
                    </div>
                    {entry.beltCode && (
                      <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold border-2 border-purple-400 px-2 py-0.5">
                        <Zap className="h-2.5 w-2.5 mr-1" />
                        {entry.beltCode}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  <div className="bg-black border-3 border-green-400 rounded px-3 py-1.5 shadow-[0_0_15px_rgba(74,222,128,0.6)]">
                    <p
                      className="text-2xl font-black text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.9)] tracking-wider leading-none"
                      style={{ fontFamily: "monospace" }}
                    >
                      {entry.count.toString().padStart(3, "0")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-black relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="fixed inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-cyan-900/20" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 255, 0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px, 80px 80px",
            backgroundPosition: "0 0, 0 0",
            animation: "gridScroll 30s linear infinite",
            perspective: "1000px",
            transformStyle: "preserve-3d",
            transform: "rotateX(60deg) translateZ(-200px)",
            willChange: "background-position",
          }}
        />
      </div>

      {/* CRT Scanlines */}
      <div className="fixed inset-0 z-40 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(0, 255, 255, 0.3) 0px, transparent 1px, transparent 2px, rgba(0, 255, 255, 0.3) 3px)",
            willChange: "transform",
          }}
        />
      </div>

      {/* VHS Glitch Effect */}
      {glitchActive && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"
            style={{
              animation: "glitch 0.15s ease-in-out",
              mixBlendMode: "screen",
            }}
          />
        </div>
      )}

      {/* Vignette Effect - Subtle */}
      <div
        className="fixed inset-0 z-30 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.3) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-20">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b-8 border-pink-500 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 shadow-[0_0_30px_rgba(236,72,153,0.6)] backdrop-blur-sm">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className="mr-2 bg-black border-4 border-cyan-400 hover:bg-purple-950 hover:border-pink-400 shadow-[0_0_15px_rgba(34,211,238,0.6)]"
                >
                  <ArrowLeft className="h-5 w-5 text-cyan-400" />
                </Button>
              </Link>
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 shadow-[0_0_25px_rgba(236,72,153,0.8)] border-4 border-yellow-300 animate-pulse">
                <Trophy className="h-8 w-8 text-black" />
              </div>
              <div>
                <h1
                  className="text-3xl font-black text-cyan-400 retro-text tracking-wider"
                  style={{ fontFamily: "monospace" }}
                >
                  HIGH SCORES
                </h1>
                <p
                  className="text-sm text-pink-400 font-bold drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]"
                  style={{ fontFamily: "monospace" }}
                >
                  [ TODAY'S CHAMPIONS ]
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="bg-black border-4 border-cyan-400 hover:bg-purple-950 hover:border-pink-400 shadow-[0_0_15px_rgba(34,211,238,0.6)] text-cyan-400 hover:text-pink-400 transition-all"
              >
                <RefreshCw
                  className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")}
                />
                <span style={{ fontFamily: "monospace" }} className="font-bold">
                  REFRESH
                </span>
              </Button>
              <UserNav />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pb-16">
          <div className="mx-auto max-w-[98vw] px-4 py-6">
            <div className="grid grid-cols-3 gap-6">
              {/* Stage 1 */}
              <div className="bg-gradient-to-b from-black to-purple-950 border-8 border-cyan-500 rounded-xl p-6 shadow-[0_0_40px_rgba(34,211,238,0.6)] relative overflow-hidden">
                {/* Diagonal scan lines for each panel */}
                <div
                  className="absolute inset-0 opacity-[0.02] pointer-events-none"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, rgba(0, 255, 255, 0.5) 0px, transparent 1px, transparent 2px, rgba(0, 255, 255, 0.5) 3px)",
                  }}
                />
                <div className="mb-6 relative">
                  <div className="flex flex-col items-center gap-3 mb-3">
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_20px_rgba(34,211,238,0.8)] border-4 border-cyan-300 relative">
                      <div className="absolute inset-0 rounded-lg animate-pulse bg-cyan-400/20" />
                      <Package className="h-10 w-10 text-black relative z-10" />
                    </div>
                    <h2
                      className="text-3xl font-black text-cyan-400 retro-text tracking-wider text-center"
                      style={{ fontFamily: "monospace" }}
                    >
                      STAGE 1
                    </h2>
                  </div>
                  <p
                    className="text-sm text-purple-300 text-center font-bold drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]"
                    style={{ fontFamily: "monospace" }}
                  >
                    &gt;&gt; STAGE 1 → 2 &lt;&lt;
                  </p>
                </div>
                {renderLeaderboard(stage1Data, "Stage 1", "text-cyan-600")}
              </div>

              {/* Stage 2 */}
              <div className="bg-gradient-to-b from-black to-purple-950 border-8 border-pink-500 rounded-xl p-6 shadow-[0_0_40px_rgba(236,72,153,0.6)] relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-[0.02] pointer-events-none"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, rgba(255, 0, 255, 0.5) 0px, transparent 1px, transparent 2px, rgba(255, 0, 255, 0.5) 3px)",
                  }}
                />
                <div className="mb-6 relative">
                  <div className="flex flex-col items-center gap-3 mb-3">
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gradient-to-br from-pink-400 to-purple-600 shadow-[0_0_20px_rgba(236,72,153,0.8)] border-4 border-pink-300 relative">
                      <div className="absolute inset-0 rounded-lg animate-pulse bg-pink-400/20" />
                      <Package className="h-10 w-10 text-black relative z-10" />
                    </div>
                    <h2
                      className="text-3xl font-black text-pink-400 retro-text tracking-wider text-center"
                      style={{ fontFamily: "monospace" }}
                    >
                      STAGE 2
                    </h2>
                  </div>
                  <p
                    className="text-sm text-purple-300 text-center font-bold drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]"
                    style={{ fontFamily: "monospace" }}
                  >
                    &gt;&gt; STAGE 2 → 3 &lt;&lt;
                  </p>
                </div>
                {renderLeaderboard(stage2Data, "Stage 2", "text-pink-600")}
              </div>

              {/* Stage 3 */}
              <div className="bg-gradient-to-b from-black to-purple-950 border-8 border-yellow-500 rounded-xl p-6 shadow-[0_0_40px_rgba(251,191,36,0.6)] relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-[0.02] pointer-events-none"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, rgba(255, 255, 0, 0.5) 0px, transparent 1px, transparent 2px, rgba(255, 255, 0, 0.5) 3px)",
                  }}
                />
                <div className="mb-6 relative">
                  <div className="flex flex-col items-center gap-3 mb-3">
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 shadow-[0_0_20px_rgba(251,191,36,0.8)] border-4 border-yellow-300 relative">
                      <div className="absolute inset-0 rounded-lg animate-pulse bg-yellow-400/20" />
                      <Trophy className="h-10 w-10 text-black relative z-10 animate-pulse" />
                    </div>
                    <h2
                      className="text-3xl font-black text-yellow-400 retro-text tracking-wider text-center"
                      style={{ fontFamily: "monospace" }}
                    >
                      STAGE 3
                    </h2>
                  </div>
                  <p
                    className="text-sm text-purple-300 text-center font-bold drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]"
                    style={{ fontFamily: "monospace" }}
                  >
                    ★★ FINAL STAGE ★★
                  </p>
                </div>
                {renderLeaderboard(stage3Data, "Stage 3", "text-yellow-600")}
              </div>
            </div>

            {/* Total Completed Orders Today */}
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-black via-purple-950 to-black border-8 border-green-500 rounded-xl p-8 shadow-[0_0_50px_rgba(34,197,94,0.6)] relative overflow-hidden">
                {/* Animated background */}
                <div
                  className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, rgba(34, 197, 94, 0.5) 0px, transparent 1px, transparent 2px, rgba(34, 197, 94, 0.5) 3px)",
                  }}
                />

                {/* Corner decorations */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-green-400" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-green-400" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-green-400" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-green-400" />

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 shadow-[0_0_25px_rgba(34,197,94,0.8)] border-4 border-green-300 relative">
                      <div className="absolute inset-0 rounded-lg animate-pulse bg-green-400/20" />
                      <Package className="h-8 w-8 text-black relative z-10" />
                    </div>
                    <div>
                      <h3
                        className="text-2xl font-black text-green-400 retro-text tracking-wider"
                        style={{ fontFamily: "monospace" }}
                      >
                        TOTAL COMPLETED
                      </h3>
                      <p
                        className="text-sm text-purple-300 font-bold drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]"
                        style={{ fontFamily: "monospace" }}
                      >
                        ★ ORDERS PUSHED TO CAGE TODAY ★
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Digital counter display */}
                    <div className="bg-black border-4 border-green-400 rounded-lg px-8 py-4 shadow-[0_0_20px_rgba(34,197,94,0.8)] relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/10 to-transparent animate-pulse" />
                      <div className="flex items-baseline gap-2 relative">
                        <span
                          className="text-6xl font-black text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.9)] tracking-wider leading-none"
                          style={{ fontFamily: "monospace" }}
                        >
                          {totalCompletedToday.toString().padStart(4, "0")}
                        </span>
                        <span
                          className="text-lg font-bold text-green-300 mb-2"
                          style={{ fontFamily: "monospace" }}
                        >
                          ORDERS
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Retro Ticker Tape */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-900 via-pink-900 to-purple-900 border-t-4 border-cyan-400 overflow-hidden h-12">
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative flex items-center h-full text-cyan-400 font-black text-lg whitespace-nowrap"
            style={{
              fontFamily: "monospace",
              animation: "ticker 30s linear infinite",
            }}
          >
            <span className="px-8 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
              {tickerMessages}
            </span>
            <span className="px-8 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
              {tickerMessages}
            </span>
          </div>
        </div>

        {/* Custom Animations */}
        <style jsx global>{`
          @keyframes ticker {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }

          @keyframes gridScroll {
            0% {
              background-position:
                0 0,
                0 0;
            }
            100% {
              background-position:
                0 80px,
                80px 0;
            }
          }

          /* Scanline animation disabled to reduce flickering */

          @keyframes glitch {
            0% {
              transform: translate(0);
            }
            20% {
              transform: translate(-5px, 5px);
            }
            40% {
              transform: translate(-5px, -5px);
            }
            60% {
              transform: translate(5px, 5px);
            }
            80% {
              transform: translate(5px, -5px);
            }
            100% {
              transform: translate(0);
            }
          }

          @keyframes chromatic {
            0%,
            100% {
              text-shadow:
                -1px 0 0 #ff00ff,
                1px 0 0 #00ffff,
                0 0 20px currentColor;
            }
            50% {
              text-shadow:
                1px 0 0 #ff00ff,
                -1px 0 0 #00ffff,
                0 0 25px currentColor;
            }
          }

          .retro-text {
            animation: chromatic 4s ease-in-out infinite;
            will-change: text-shadow;
          }

          /* Phosphor glow effect - DISABLED to prevent flickering */
          /* @keyframes phosphorGlow {
          0%, 100% {
            filter: brightness(1) contrast(1);
          }
          50% {
            filter: brightness(1.05) contrast(1.02);
          }
        }

        @media (min-width: 768px) {
          .crt-container {
            animation: phosphorGlow 5s ease-in-out infinite alternate;
          }
        } */
        `}</style>
      </div>
    </div>
  );
}
