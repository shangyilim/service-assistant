import { BusinessInfo } from "@/app/api/types";

export interface AgentSessionState {
  userId: string;
  phoneNumber?: string;
  name?: string;
  businessInfo?: BusinessInfo;
}
