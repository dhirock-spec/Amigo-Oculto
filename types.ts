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

export interface SecretMessage {
  id: string;
  senderName: string; // Can be "Anônimo"
  recipientId: string;
  recipientName: string;
  content: string;
  createdAt: number;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
}

export interface PollOption {
  id: string;
  pollId: string;
  name: string;
  votes: number;
}

export interface PollVote {
  id: string;
  pollId: string;
  optionId: string;
  participantId: string;
  participantName: string;
  optionName: string;
}

export type GiftSuggestion = Omit<Gift, 'id' | 'image'> & { imagePrompt: string };