
export type KitListItem = {
  token: string;
  artist_name: string;
  recipient_name: string;
  recipient_org: string | null;
  created_at: Date;
  revoked_at: Date | null;
  view_count: number;
  last_viewed_at: Date | null;
};
