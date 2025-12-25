import { Brain, SlidersHorizontal, ArrowRight, BarChart3, Sparkles, Target, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface ActionCardsProps {
  onNavigateIntelligence: () => void;
  onNavigateCuration: () => void;
}

const ActionCards = ({ onNavigateIntelligence, onNavigateCuration }: ActionCardsProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      {/* Intelligence Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-card/90 via-card/80 to-primary/5 border-primary/20 h-full hover:border-primary/40 transition-colors">
          <CardContent className="p-6 lg:p-8 flex flex-col h-full">
            <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            
            <h3 className="font-display text-xl font-bold text-foreground mb-2">
              🧬 Dive Deeper
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Explore your complete music intelligence with detailed analytics, charts, and insights.
            </p>
            
            <ul className="space-y-2 mb-6 flex-1">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="w-4 h-4 text-primary" />
                Audio Evolution Over Time
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                Top Genres & Artists
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="w-4 h-4 text-primary" />
                Discovery Statistics
              </li>
            </ul>
            
            <Button 
              onClick={onNavigateIntelligence} 
              className="w-full gap-2 group"
            >
              Go to Intelligence
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Curation Lab Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="bg-gradient-to-br from-card/90 via-card/80 to-chart-purple/5 border-chart-purple/20 h-full hover:border-chart-purple/40 transition-colors">
          <CardContent className="p-6 lg:p-8 flex flex-col h-full">
            <div className="p-3 bg-chart-purple/10 rounded-xl w-fit mb-4">
              <SlidersHorizontal className="w-8 h-8 text-chart-purple" />
            </div>
            
            <h3 className="font-display text-xl font-bold text-foreground mb-2">
              🎨 Create Playlists
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Use AI-powered tools to discover tracks and build perfect playlists for any mood or event.
            </p>
            
            <ul className="space-y-2 mb-6 flex-1">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Search className="w-4 h-4 text-chart-purple" />
                Smart Discovery Engine
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 text-chart-purple" />
                Context Generator
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="w-4 h-4 text-chart-purple" />
                Track Suggestions
              </li>
            </ul>
            
            <Button 
              onClick={onNavigateCuration} 
              variant="outline"
              className="w-full gap-2 group border-chart-purple/30 hover:border-chart-purple/50 hover:bg-chart-purple/5"
            >
              Go to Curation Lab
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ActionCards;
