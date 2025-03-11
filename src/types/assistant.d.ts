import { MessageType } from "@/utils/enums";

export interface Message {
  role: MessageType;
  content: string; // message content
}