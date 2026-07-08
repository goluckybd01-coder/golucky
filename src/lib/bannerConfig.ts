// Banner configuration types and utilities
export type LinkType = "internal" | "external";

export interface BannerItem {
  id: string;
  title: string;
  image: string;
  link: string;
  linkType: LinkType;
  enabled: boolean;
  order: number;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

export interface WelcomeBannerConfig {
  enabled: boolean;
  image: string;
  durationSeconds: number;
}

export interface BannerConfig {
  homeTopSlider: BannerItem[];
  activityBanners: BannerItem[];
  welcomeBanner: WelcomeBannerConfig;
}

const STORAGE_KEY = "golucky_banner_config";
const ADMIN_AUTH_KEY = "golucky_admin_auth";

// Internal route options
export const INTERNAL_ROUTES = [
  { value: "/", label: "Home" },
  { value: "/promotion", label: "Promotion" },
  { value: "/activity", label: "Activity" },
  { value: "/wallet", label: "Wallet" },
];

// Default banner configuration
const defaultConfig: BannerConfig = {
  homeTopSlider: [
    { id: "1", title: "Daily Recharge Bonus", image: "/assets/images/banners/daily-recharge-bonus.png", link: "/promotion", linkType: "internal", enabled: true, order: 1 },
    { id: "2", title: "Extra Deposit Cashback", image: "/assets/images/banners/extra-deposit-cashback.png", link: "/promotion", linkType: "internal", enabled: true, order: 2 },
    { id: "3", title: "Come Back Bonus", image: "/assets/images/banners/comeback-bonus.png", link: "/promotion", linkType: "internal", enabled: true, order: 3 },
    { id: "4", title: "Lucky Spin Bonus", image: "/assets/images/banners/lucky-spin-bonus.png", link: "/promotion", linkType: "internal", enabled: true, order: 4 },
    { id: "5", title: "Festival Special Bonus", image: "/assets/images/banners/festival-special-bonus.png", link: "/promotion", linkType: "internal", enabled: true, order: 5 },
    { id: "6", title: "Referral Bonus", image: "/assets/images/banners/referral-bonus.png", link: "/promotion", linkType: "internal", enabled: true, order: 6 },
    { id: "7", title: "Limited Time Offer", image: "/assets/images/banners/limited-time-offer.png", link: "/promotion", linkType: "internal", enabled: true, order: 7 },
  ],
  activityBanners: [
    { id: "a1", title: "5% Recharge Bonus", image: "/assets/images/banners/banner-bonus.png", link: "/activity", linkType: "internal", enabled: true, order: 1 },
    { id: "a2", title: "Weekly Bonus", image: "/assets/images/banners/banner-bonus.png", link: "/activity", linkType: "internal", enabled: true, order: 2 },
    { id: "a3", title: "VIP Rewards", image: "/assets/images/banners/banner-bonus.png", link: "/activity", linkType: "internal", enabled: true, order: 3 },
  ],
  welcomeBanner: {
    enabled: true,
    image: "/assets/images/welcome/welcome.png",
    durationSeconds: 3,
  },
};

// Check if banner is within schedule
export const isBannerScheduleActive = (banner: BannerItem): boolean => {
  const now = new Date();
  
  if (banner.startDate) {
    const start = new Date(banner.startDate);
    if (now < start) return false;
  }
  
  if (banner.endDate) {
    const end = new Date(banner.endDate);
    if (now > end) return false;
  }
  
  return true;
};

// Get banner schedule status
export const getBannerStatus = (banner: BannerItem): "active" | "upcoming" | "expired" | "disabled" => {
  if (!banner.enabled) return "disabled";
  
  const now = new Date();
  
  if (banner.startDate) {
    const start = new Date(banner.startDate);
    if (now < start) return "upcoming";
  }
  
  if (banner.endDate) {
    const end = new Date(banner.endDate);
    if (now > end) return "expired";
  }
  
  return "active";
};

// Get banner configuration from localStorage
export const getBannerConfig = (): BannerConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate old config without linkType
      const migrateItem = (item: BannerItem): BannerItem => ({
        ...item,
        linkType: item.linkType || "internal",
      });
      return {
        ...parsed,
        homeTopSlider: parsed.homeTopSlider?.map(migrateItem) || defaultConfig.homeTopSlider,
        activityBanners: parsed.activityBanners?.map(migrateItem) || defaultConfig.activityBanners,
        welcomeBanner: parsed.welcomeBanner || defaultConfig.welcomeBanner,
      };
    }
  } catch (error) {
    console.error("Error reading banner config:", error);
  }
  return defaultConfig;
};

// Save banner configuration to localStorage
export const saveBannerConfig = (config: BannerConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error("Error saving banner config:", error);
  }
};

// Get visible home slider banners (enabled + schedule valid)
export const getHomeSliderBanners = (): BannerItem[] => {
  const config = getBannerConfig();
  return config.homeTopSlider
    .filter((b) => b.enabled && isBannerScheduleActive(b))
    .sort((a, b) => a.order - b.order);
};

// Get visible activity banners (enabled + schedule valid)
export const getActivityBanners = (): BannerItem[] => {
  const config = getBannerConfig();
  return config.activityBanners
    .filter((b) => b.enabled && isBannerScheduleActive(b))
    .sort((a, b) => a.order - b.order);
};

// Get welcome banner config
export const getWelcomeBannerConfig = (): WelcomeBannerConfig => {
  const config = getBannerConfig();
  return config.welcomeBanner;
};

// Admin authentication - delegates to the centralized admin auth store,
// which validates the live Supabase session + staff_accounts membership.
// Never trust localStorage flags alone for admin access.
import { adminAuthStore } from '@/lib/adminAuthStore';

export const isAdminAuthenticated = (): boolean => {
  const state = adminAuthStore.getState();
  return Boolean(state.session && state.staffAccount);
};

export const adminLogout = (): void => {
  // Clear all admin-related localStorage
  localStorage.removeItem('admin_staff_role');
  localStorage.removeItem('admin_staff_name');
  localStorage.removeItem('admin_super_verified');
  localStorage.removeItem('pending_admin_otp');
  localStorage.removeItem('pending_admin_email');
};

// Generate unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
