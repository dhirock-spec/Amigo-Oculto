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

export type GiftSuggestion = Omit<Gift, 'id' | 'image'> & { imagePrompt: string };
