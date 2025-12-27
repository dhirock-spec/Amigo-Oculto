export interface Gift {
  id: string;
  title: string;
  description: string;
  image: string; // Base64 or URL
  isAiGenerated?: boolean;
}

export interface Participant {
  id: string;
  name: string;
  avatar: string; // Base64 or URL
  interests: string;
  wishes: Gift[];
}

export interface FoodItem {
  id: string;
  name: string;
  caption: string;
  image: string;
  contributorName: string;
  contributorAvatar: string;
}

export interface Vote {
  id: string; // Voter Participant ID
  voterName: string;
  guessId: string; // Guessed Participant ID
  guessName: string;
}

export interface MusicRequest {
  id: string;
  audioUrl?: string; // Optional direct URL for playback
  title: string;
  artist: string;
  thumbnail?: string;
  requesterName: string;
  requesterId: string;
  createdAt: number;
}

export type GiftSuggestion = Omit<Gift, 'id' | 'image'> & { imagePrompt: string };