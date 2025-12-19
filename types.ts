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

export type GiftSuggestion = Omit<Gift, 'id' | 'image'> & { imagePrompt: string };