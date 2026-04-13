import type { FC } from "react";

// Statically imported so Next.js bundles and compiles all content files
import ParkingLot         from "./parking-lot-lld-design";
import RideSharing        from "./ride-sharing-lld-design";
import MovieTicket        from "./movie-ticket-booking-lld";
import Elevator           from "./elevator-system-lld-design";
import UrlShortener       from "./url-shortener-lld-design";
import ChatApp            from "./chat-application-lld-design";
import FoodDelivery       from "./food-delivery-lld-design";
import Library            from "./library-management-lld-design";
import ATM                from "./atm-machine-lld-design";
import Notification       from "./notification-system-lld-design";
import LRUCache           from "./lru-cache-lld-design";
import PaymentGateway     from "./payment-gateway-lld-design";
import RateLimiter        from "./rate-limiter-lld-design";
import ExpenseSplitter    from "./expense-splitter-lld-design";
import SocialFeed         from "./social-media-feed-lld";
import JobScheduler       from "./job-scheduler-lld-design";
import HotelBooking       from "./hotel-booking-lld-design";
import Inventory          from "./inventory-management-lld-design";
import EventTicketing     from "./event-ticketing-lld-design";
import Logger             from "./logger-framework-lld-design";
import SolidPrinciples    from "./solid-principles-lld-interview";
import DesignPatterns     from "./design-patterns-lld-interview";
import CrackLLD           from "./how-to-crack-lld-interview";

export const BLOG_CONTENT: Record<string, FC> = {
  "parking-lot-lld-design":          ParkingLot,
  "ride-sharing-lld-design":         RideSharing,
  "movie-ticket-booking-lld":        MovieTicket,
  "elevator-system-lld-design":      Elevator,
  "url-shortener-lld-design":        UrlShortener,
  "chat-application-lld-design":     ChatApp,
  "food-delivery-lld-design":        FoodDelivery,
  "library-management-lld-design":   Library,
  "atm-machine-lld-design":          ATM,
  "notification-system-lld-design":  Notification,
  "lru-cache-lld-design":            LRUCache,
  "payment-gateway-lld-design":      PaymentGateway,
  "rate-limiter-lld-design":         RateLimiter,
  "expense-splitter-lld-design":     ExpenseSplitter,
  "social-media-feed-lld":           SocialFeed,
  "job-scheduler-lld-design":        JobScheduler,
  "hotel-booking-lld-design":        HotelBooking,
  "inventory-management-lld-design": Inventory,
  "event-ticketing-lld-design":      EventTicketing,
  "logger-framework-lld-design":     Logger,
  "solid-principles-lld-interview":  SolidPrinciples,
  "design-patterns-lld-interview":   DesignPatterns,
  "how-to-crack-lld-interview":      CrackLLD,
};
