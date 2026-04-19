export type BusinessType = 'hair_salon' | 'barber' | 'unisex';
export type BusinessStatus = 'active' | 'unverified' | 'closed' | 'duplicate' | 'excluded';
export type AuState = 'VIC' | 'TAS' | 'SA' | 'NSW' | 'QLD' | 'WA' | 'NT' | 'ACT';
export type BookingPlatform = 'fresha' | 'kitomba' | 'shortcuts' | 'timely' | 'other' | 'none';
export type ImportSource = 'google_places' | 'manual' | 'claimed' | 'csv_import';
export type ImportDecision = 'accepted' | 'rejected_category' | 'rejected_duplicate' | 'needs_review';
export type TerritoryStatus = 'pending' | 'imported' | 'verified' | 'live';
export type UserRole = 'owner' | 'admin';
export type MediaType = 'cover' | 'gallery' | 'logo';

export interface GooglePhotoRef {
  name: string;
  widthPx?: number;
  heightPx?: number;
}

export interface GoogleHours {
  weekdayDescriptions: string[];
  periods: unknown[];
}

export interface Region {
  id: string;
  name: string;
  state: AuState;
  slug: string;
  created_at: string;
}

export interface Suburb {
  id: string;
  name: string;
  region_id: string;
  state: AuState;
  slug: string;
  postcode: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  business_type: BusinessType;
  address_line1: string;
  suburb: string;
  state: AuState;
  postcode: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website_url: string | null;
  booking_url: string | null;
  booking_platform: BookingPlatform;
  description: string | null;
  google_place_id: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  google_business_status: string | null;
  google_photos: GooglePhotoRef[] | null;
  google_hours: GoogleHours | null;
  google_last_checked: string | null;
  region_id: string | null;
  suburb_id: string | null;
  confidence_score: number | null;
  verification_flags: string[] | null;
  true_local_found: boolean | null;
  yellow_pages_found: boolean | null;
  website_alive: boolean | null;
  status: BusinessStatus;
  is_claimed: boolean;
  claimed_by: string | null;
  featured_until: string | null;
  ai_description: string | null;
  specialties: string[] | null;
  content_source: string | null;
  content_generated_at: string | null;
  scraped_services: string[] | null;
  scraped_about: string | null;
  scraped_at: string | null;
  walk_ins_welcome: boolean | null;
  walk_ins_source: string | null;
  preferred_scissor_supplier_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessMedia {
  id: string;
  business_id: string;
  storage_path: string;
  media_type: MediaType;
  sort_order: number;
  uploaded_at: string;
}

export interface OpeningHours {
  id: string;
  business_id: string;
  day_of_week: number; // 0 = Sunday
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

export interface Territory {
  id: string;
  name: string;
  state: AuState;
  import_status: TerritoryStatus;
  raw_count: number;
  live_count: number;
  last_imported_at: string | null;
  created_at: string;
}

export interface AppUser {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      businesses: { Row: Business; Insert: Partial<Business>; Update: Partial<Business> };
      business_media: { Row: BusinessMedia; Insert: Partial<BusinessMedia>; Update: Partial<BusinessMedia> };
      opening_hours: { Row: OpeningHours; Insert: Partial<OpeningHours>; Update: Partial<OpeningHours> };
      territories: { Row: Territory; Insert: Partial<Territory>; Update: Partial<Territory> };
      users: { Row: AppUser; Insert: Partial<AppUser>; Update: Partial<AppUser> };
    };
  };
}
