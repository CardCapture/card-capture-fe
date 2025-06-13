export interface Event {
  id: string;
  name: string;
  description: string | null;
  date: string;
  status: string;
  created_at: string;
  updated_at: string;
  school_id: string;
  slate_event_id?: string | null;
}

export type EventWithStats = Event & {
  stats: {
    total_cards: number;
    needs_review: number;
    ready_for_export: number;
    exported: number;
    archived: number;
  };
}; 