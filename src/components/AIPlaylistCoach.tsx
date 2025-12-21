import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppealProfile } from "@/lib/appeal-analysis";

interface BpmIssue {
  position: number;
  fromTrack: string;
  toTrack: string;
  fromBPM: number;
  toBPM: number;
  bpmChange: number;
}

interface AIPlaylistCoachProps {
  playlistName: string;
  trackCount: number;
  flowScore: number;
  appealProfile: AppealProfile | null;
  bpmIssues: BpmIssue[];
}

export function AIPlaylistCoach({
  playlistName,
  trackCount,
  flowScore,
  appealProfile,
  bpmIssues
}: AIPlaylistCoachProps) {
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateInsights = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const playlistData = {
        name: playlistName,
        trackCount,
        flowScore,
        appealScore: appealProfile?.overallScore || 0,
        distribution: appealProfile?.distribution || {},
        bpmIssues: bpmIssues.map(issue => ({
          position: issue.position,
          fromTrack: issue.fromTrack,
          toTrack: issue.toTrack,
          fromBPM: issue.fromBPM,
          toBPM: issue.toBPM
        })),
        undergroundGems: appealProfile?.undergroundGems || [],
        popularTracks: appealProfile?.mainstreamHits || []
      };

      const { data, error: fnError } = await supabase.functions.invoke('playlist-ai-coach', {
        body: { playlistData }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setInsights(data.insights);
      setHasGenerated(true);
    } catch (err) {
      console.error("Error generating AI insights:", err);
      setError(err instanceof Error ? err.message : "Failed to generate insights");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (appealProfile && !hasGenerated) {
      generateInsights();
    }
  }, [appealProfile]);

  const formatInsights = (text: string) => {
    // Convert markdown-style formatting to JSX
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // Bold headers
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <h4 key={index} className="font-bold text-foreground mt-4 mb-2 first:mt-0">
            {line.replace(/\*\*/g, '')}
          </h4>
        );
      }
      // Inline bold
      const boldParts = line.split(/\*\*(.*?)\*\*/g);
      if (boldParts.length > 1) {
        return (
          <p key={index} className="text-muted-foreground mb-2">
            {boldParts.map((part, i) => 
              i % 2 === 1 ? <strong key={i} className="text-foreground">{part}</strong> : part
            )}
          </p>
        );
      }
      // Regular line
      if (line.trim()) {
        return (
          <p key={index} className="text-muted-foreground mb-2">
            {line}
          </p>
        );
      }
      return null;
    });
  };

  return (
    <Card className="bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-indigo-500/10 border-violet-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-violet-400" />
          AI Playlist Coach
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center gap-3 py-8">
            <RefreshCw className="h-5 w-5 animate-spin text-violet-400" />
            <span className="text-muted-foreground">Analyzing your playlist...</span>
          </div>
        )}

        {error && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateInsights}
              className="border-violet-500/30 hover:bg-violet-500/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {insights && !isLoading && (
          <div className="space-y-4">
            <div className="prose prose-sm prose-invert max-w-none">
              {formatInsights(insights)}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateInsights}
              className="border-violet-500/30 hover:bg-violet-500/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Analysis
            </Button>
          </div>
        )}

        {!insights && !isLoading && !error && (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              Get AI-powered recommendations for your playlist
            </p>
            <Button 
              onClick={generateInsights}
              className="bg-violet-600 hover:bg-violet-700"
            >
              <Bot className="h-4 w-4 mr-2" />
              Generate AI Insights
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
