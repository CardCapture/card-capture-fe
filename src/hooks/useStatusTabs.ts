import { useState, useCallback } from "react";
import type { ProspectCard } from "@/types/card";

export function useStatusTabs(
  cards: ProspectCard[],
  determineCardStatus: (card: ProspectCard) => string
) {
  const [selectedTab, setSelectedTab] = useState<string>("needs_review");

  const getStatusCount = useCallback(
    (status: string) => {
      if (!cards) return 0;
      return cards.filter((card) => {
        const c = card as ProspectCard & { deleted?: boolean };
        return determineCardStatus(c) === status && !c.deleted;
      }).length;
    },
    [cards, determineCardStatus]
  );

  return {
    selectedTab,
    setSelectedTab,
    getStatusCount,
  };
}
