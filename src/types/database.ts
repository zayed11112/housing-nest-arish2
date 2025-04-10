export interface PropertiesRow {
  id: string;
  name: string;
  location: string;
  rooms: number;
  bathrooms: number;
  size: number;
  beds: number;
  price: number;
  discount: number | null;
  property_type: string;
  status: string;
  amenities: string[];
  images: string[];
  description: string;
  available: boolean;
  residential_unit_type: string | null;
  housing_category: string | null;
  area_type: string | null;
  special_property_type: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}