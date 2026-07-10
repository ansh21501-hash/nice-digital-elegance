import { Routes, Route as RRRoute, Outlet, Link } from "react-router-dom";
import { RouteRenderer } from "@/compat/tanstack-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { OffersPopup } from "@/components/site/OffersPopup";

import { Route as IndexRoute } from "@/routes/index";
import { Route as AboutRoute } from "@/routes/about";
import { Route as RoomsRoute } from "@/routes/rooms";
import { Route as ServicesRoute } from "@/routes/services";
import { Route as VenueRoute } from "@/routes/venue";
import { Route as MenuRoute } from "@/routes/menu";
import { Route as ContactRoute } from "@/routes/contact";
import { Route as BookRoute } from "@/routes/book";
import { Route as AuthRoute } from "@/routes/auth";
import { Route as ResetRoute } from "@/routes/reset-password";

import { Route as AdminGateRoute } from "@/routes/_authenticated/admin";
import { Route as AdminIndexRoute } from "@/routes/_authenticated/admin.index";
import { Route as AdminBookingsRoute } from "@/routes/_authenticated/admin.bookings";
import { Route as AdminRoomsRoute } from "@/routes/_authenticated/admin.rooms";
import { Route as AdminMenuRoute } from "@/routes/_authenticated/admin.menu";
import { Route as AdminOffersRoute } from "@/routes/_authenticated/admin.offers";
import { Route as AdminEnquiriesRoute } from "@/routes/_authenticated/admin.enquiries";
import { Route as AdminEventsRoute } from "@/routes/_authenticated/admin.events";
import { Route as AdminServicesRoute } from "@/routes/_authenticated/admin.services";
import { Route as AdminCmsRoute } from "@/routes/_authenticated/admin.cms";
import { Route as AdminEmailsRoute } from "@/routes/_authenticated/admin.emails";

function SiteLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <OffersPopup />
    </>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <RRRoute element={<SiteLayout />}>
        <RRRoute path="/" element={<RouteRenderer route={IndexRoute} />} />
        <RRRoute path="/about" element={<RouteRenderer route={AboutRoute} />} />
        <RRRoute path="/rooms" element={<RouteRenderer route={RoomsRoute} />} />
        <RRRoute path="/services" element={<RouteRenderer route={ServicesRoute} />} />
        <RRRoute path="/venue" element={<RouteRenderer route={VenueRoute} />} />
        <RRRoute path="/menu" element={<RouteRenderer route={MenuRoute} />} />
        <RRRoute path="/contact" element={<RouteRenderer route={ContactRoute} />} />
        <RRRoute path="/book" element={<RouteRenderer route={BookRoute} />} />
      </RRRoute>

      <RRRoute path="/auth" element={<RouteRenderer route={AuthRoute} />} />
      <RRRoute path="/reset-password" element={<RouteRenderer route={ResetRoute} />} />

      <RRRoute path="/admin" element={<RouteRenderer route={AdminGateRoute} />}>
        <RRRoute index element={<RouteRenderer route={AdminIndexRoute} />} />
        <RRRoute path="bookings" element={<RouteRenderer route={AdminBookingsRoute} />} />
        <RRRoute path="rooms" element={<RouteRenderer route={AdminRoomsRoute} />} />
        <RRRoute path="menu" element={<RouteRenderer route={AdminMenuRoute} />} />
        <RRRoute path="offers" element={<RouteRenderer route={AdminOffersRoute} />} />
        <RRRoute path="enquiries" element={<RouteRenderer route={AdminEnquiriesRoute} />} />
        <RRRoute path="events" element={<RouteRenderer route={AdminEventsRoute} />} />
        <RRRoute path="services" element={<RouteRenderer route={AdminServicesRoute} />} />
        <RRRoute path="cms" element={<RouteRenderer route={AdminCmsRoute} />} />
        <RRRoute path="emails" element={<RouteRenderer route={AdminEmailsRoute} />} />
      </RRRoute>

      <RRRoute path="*" element={<NotFound />} />
    </Routes>
  );
}
