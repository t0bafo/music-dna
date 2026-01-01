import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { InstallPrompt } from "@/components/InstallPrompt";
import { NativeAppProvider } from "@/components/NativeAppProvider";

import Landing from "./pages/Landing";
import Callback from "./pages/Callback";
import Home from "./pages/Home";
import PlaylistDetail from "./pages/PlaylistDetail";
import MusicIntelligence from "./pages/MusicIntelligence";
import Crates from "./pages/Crates";
import CrateDetail from "./pages/CrateDetail";
import CrateShare from "./pages/CrateShare";
import Studio from "./pages/Studio";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="dark" storageKey="music-dna-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <NativeAppProvider>
              <Toaster />
              <Sonner />
              <InstallPrompt />
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/callback" element={<Callback />} />
                <Route path="/home" element={<Home />} />
                <Route path="/dashboard" element={<Navigate to="/home" replace />} />
                <Route path="/playlist/:playlistId" element={<PlaylistDetail />} />
                <Route path="/intelligence" element={<MusicIntelligence />} />
                <Route path="/crates" element={<Crates />} />
                <Route path="/crates/:crateId" element={<CrateDetail />} />
                <Route path="/crates/:crateId/share" element={<CrateShare />} />
                <Route path="/curation" element={<Studio />} />
                <Route path="/studio" element={<Studio />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </NativeAppProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
