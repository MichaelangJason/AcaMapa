import { MessageType } from "@/utils/enums";

export interface Message {
  role: MessageType;
  content: string; // message content
  options?: string[]; // options for the message
}

export interface MessageChunk {
  content: string;
  metadata: {
    thread_id: string;
  };
  options?: string[];
}

export interface AppliablePlan {
  terms: {
    [key: string]: {
      id: string;
      name: string;
      "course_ids": string[];
      "total_credits": number;
    }
  },
  "total_credits": number;
  "notes"?: {
    [key: string]: any;
  }
}