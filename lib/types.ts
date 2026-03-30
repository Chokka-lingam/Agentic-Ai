export type TravelType = "solo" | "couple" | "family" | "friends";

export type Profile = {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
};

export type ProfileSummary = Pick<Profile, "id" | "email" | "username" | "full_name" | "avatar_url">;

export type ProfileFormValues = Pick<Profile, "username" | "full_name" | "avatar_url" | "bio">;

export type CommunityMessage = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  channel_slug: string;
  profile: Pick<Profile, "id" | "username" | "full_name" | "avatar_url"> | null;
};

export type TravelChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export type TravelChatRequest = {
  message: string;
  history?: TravelChatMessage[];
};

export type TravelChatResponse = {
  answer: string;
};

export type TravelRequest = {
  destination: string;
  startDate: string;
  endDate: string;
  budgetRange: string;
  travelType: TravelType;
  interests: string[];
};

export type PlannerTaskType = "transport" | "stay" | "activities" | "budget";
export type PlannerTaskPriority = "high" | "medium" | "low";
export type PlannerTaskStatus = "pending" | "complete" | "failed";

export type PlannerTask = {
  id: string;
  type: PlannerTaskType;
  priority: PlannerTaskPriority;
  status: PlannerTaskStatus;
  notes?: string;
};

export type PlannerResponse = {
  tasks: PlannerTask[];
};

export type DailyPlan = {
  day: number;
  date: string;
  activities: string[];
  food: string[];
  transport: string;
  estimated_cost: string;
};

export type TravelResponse = {
  summary: string;
  map_locations: string[];
  daily_plan: DailyPlan[];
  hotel_recommendations: string[];
  local_food_spots: string[];
  transportation_overview: string[];
  cost_breakdown: {
    accommodation: string;
    food: string;
    transport: string;
    activities: string;
    misc: string;
  };
  total_estimated_budget: string;
  packing_list: string[];
  travel_tips: string[];
  safety_notes: string[];
};

export type ApiErrorResponse = {
  error: string;
  issues?: unknown;
  requestId?: string;
};

export type GeocodeLocation = {
  name: string;
  latitude: number;
  longitude: number;
  description: string;
};

export type GeocodeResponse = {
  locations: GeocodeLocation[];
};

export type StoredItinerary = {
  id: string;
  createdAt: string;
  updatedAt: string;
  input: TravelRequest;
  plan: TravelResponse;
};

export type ItineraryListItem = {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelType: TravelType;
  totalEstimatedBudget: string;
  createdAt: string;
  updatedAt: string;
};
