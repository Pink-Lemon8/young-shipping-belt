"use client";
import {
  Users,
  SquarePen,
  LayoutGrid,
  LucideIcon,
  Box,
  PillBottleIcon,
  Package,
  Factory,
  PillIcon,
  HeartPulseIcon,
  BarChart,
  Paperclip,
  AlertTriangle,
  Truck,
  ArrowRight,
  X,
  Calculator,
  Search,
  Eye,
  FileText,
} from "lucide-react";

export type Item = {
  title: string;
  url: string;
  isActive?: boolean;
  icon?: LucideIcon;
  subItems?: Item[];
};

export type Group = {
  title: string;
  url?: string;
  icon?: any;
  isActive?: boolean;
  items?: Item[];
};

export const globalItems: Item[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutGrid },
];

export const coordinatorItems: Item[] = [
  {
    title: "Process View",
    url: "/process-view",
    icon: Eye,
  },
  {
    title: "Order List",
    url: "/order-list",
    icon: Package,
  },
  { title: "Search Lot Number", url: "/check-lot", icon: Search },
  { title: "Get Order Slip", url: "/order-slip", icon: FileText },
];

export const adminItems: Item[] = [
  { title: "Stats", url: "/stats", icon: BarChart },
];
export const managementItems: Item[] = [
  { title: "Users", url: "/users", icon: Users },
];
