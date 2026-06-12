"use client";
import { useEffect } from "react";
import { useLocation } from "@/compat/router";
import { analyticsEnabled, initializeAnalytics, trackPageView } from "@/lib/analytics";

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (!analyticsEnabled) return;
    initializeAnalytics();
  }, []);

  useEffect(() => {
    if (!analyticsEnabled) return;
    trackPageView(`${location.pathname}${location.search}${location.hash}`);
  }, [location.hash, location.pathname, location.search]);

  return null;
};

export default AnalyticsTracker;
