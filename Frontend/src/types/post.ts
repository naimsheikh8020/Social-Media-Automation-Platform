export interface Post {
  _id: string;
  user: string;
  content: string;
  platforms: string[];
  scheduledFor: string;
  mediaFile: string | null;
  status: "scheduled" | "published" | "failed";
  createdAt: string;
  updatedAt: string;
  mediaType: "image" | "video" | null;
}