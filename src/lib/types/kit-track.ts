
export type KitTrack = {
  id: string;
  blob_url: string;
  filename: string;
  mime_type: string;
  size_bytes: string; // BIGINT comes back as string
  position: number;
};
