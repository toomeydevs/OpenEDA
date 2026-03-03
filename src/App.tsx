import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "@/context/DataContext";
import { ThemeProvider } from "next-themes";
import AppLayout from "@/components/AppLayout";
import UploadPage from "@/pages/UploadPage";
import DataOverviewPage from "@/pages/DataOverviewPage";
import VisualizationPage from "@/pages/VisualizationPage";
import ReportPage from "@/pages/ReportPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <DataProvider>
          <HashRouter>
            <AppLayout>
              <Routes>
                <Route path="/" element={<UploadPage />} />
                <Route path="/overview" element={<DataOverviewPage />} />
                <Route path="/visualize" element={<VisualizationPage />} />
                <Route path="/report" element={<ReportPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </HashRouter>
        </DataProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
