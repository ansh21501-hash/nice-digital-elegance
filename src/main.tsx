import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "./styles.css";
import App from "./App";
import { ThemeProvider } from "@/components/theme-provider";
import { BookingProvider } from "@/components/site/booking";
import { Toaster } from "@/components/ui/sonner";
import { __setQueryClient } from "@/compat/tanstack-router";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 0, refetchOnWindowFocus: false } },
});
__setQueryClient(queryClient);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BrowserRouter>
            <BookingProvider>
              <App />
              <Toaster position="top-center" />
            </BookingProvider>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>,
);
