"use client";
import { useMemo } from "react";

export type TimeOfDay = "morning" | "afternoon" | "evening";
export type Season = "spring" | "summer" | "autumn" | "winter";

export interface Atmosphere {
  timeOfDay: TimeOfDay;
  season: Season;
  /** A calm, narrative greeting phrase */
  greeting: string;
  /** A short atmospheric line for the hero */
  headline: string;
  /** A secondary descriptive line */
  tagline: string;
}

function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h < 5) return "evening";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function getSeason(): Season {
  const m = new Date().getMonth(); // 0-indexed
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
}

const GREETINGS: Record<TimeOfDay, Record<Season, string>> = {
  morning: {
    spring: "A fresh spring morning for your collection.",
    summer: "A warm morning with your plants.",
    autumn: "A crisp autumn morning.",
    winter: "A quiet winter morning.",
  },
  afternoon: {
    spring: "A gentle spring afternoon.",
    summer: "A slow summer afternoon.",
    autumn: "A clear autumn afternoon.",
    winter: "A calm winter afternoon.",
  },
  evening: {
    spring: "A quiet evening for your collection.",
    summer: "A long summer evening.",
    autumn: "An amber autumn evening.",
    winter: "A still winter evening.",
  },
};

const HEADLINES: Record<TimeOfDay, string> = {
  morning: "Your plants are waking up.",
  afternoon: "Your plants are thriving.",
  evening: "A quiet evening for your plants.",
};

const TAGLINES: Record<Season, string> = {
  spring: "New growth is beginning.",
  summer: "The growing season is here.",
  autumn: "A season of rest and renewal.",
  winter: "A time for quiet care.",
};

export function useAtmosphere(): Atmosphere {
  return useMemo(() => {
    const timeOfDay = getTimeOfDay();
    const season = getSeason();
    return {
      timeOfDay,
      season,
      greeting: GREETINGS[timeOfDay][season],
      headline: HEADLINES[timeOfDay],
      tagline: TAGLINES[season],
    };
  }, []);
}
