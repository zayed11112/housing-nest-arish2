export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      booking_requests: {
        Row: {
          alternative_phone: string | null
          batch: string
          created_at: string
          faculty: string
          full_name: string
          id: string
          phone: string
          property_id: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          alternative_phone?: string | null
          batch: string
          created_at?: string
          faculty: string
          full_name: string
          id?: string
          phone: string
          property_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          alternative_phone?: string | null
          batch?: string
          created_at?: string
          faculty?: string
          full_name?: string
          id?: string
          phone?: string
          property_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          message_text: string | null
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          message_text?: string | null
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          message_text?: string | null
          image_url?: string | null
          created_at?: string
        }
        Relationships: [
           {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users" // Assuming relation to auth.users
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users" // Assuming relation to auth.users
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
          status: string
          role: string
          faculty: string | null // Added based on BookingRequestForm prefill
          batch: string | null   // Added based on BookingRequestForm prefill
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          status?: string
          role?: string
          faculty?: string | null
          batch?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          status?: string
          role?: string
          faculty?: string | null
          batch?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          amenities: string[] | null
          area_type: string | null
          available: boolean | null
          bathrooms: number | null
          beds: number | null
          created_at: string
          created_by: string | null
          description: string | null
          discount: number | null
          housing_category: string | null
          id: string
          images: string[] | null
          location: string
          name: string
          price: number
          property_type: string
          residential_unit_type: string | null
          rooms: number
          size: number | null
          special_property_type: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amenities?: string[] | null
          area_type?: string | null
          available?: boolean | null
          bathrooms?: number | null
          beds?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount?: number | null
          housing_category?: string | null
          id?: string
          images?: string[] | null
          location: string
          name: string
          price: number
          property_type: string
          residential_unit_type?: string | null
          rooms: number
          size?: number | null
          special_property_type?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          amenities?: string[] | null
          area_type?: string | null
          available?: boolean | null
          bathrooms?: number | null
          beds?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount?: number | null
          housing_category?: string | null
          id?: string
          images?: string[] | null
          location?: string
          name?: string
          price?: number
          property_type?: string
          residential_unit_type?: string | null
          rooms?: number
          size?: number | null
          special_property_type?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          id: string
          key: string
          value: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_distinct_chat_partners: {
        Args: {
          admin_id: string // Corrected argument name to match SQL definition
        }
        Returns: {
            partner_id: string
            last_message_time: string
            partner_full_name: string
            partner_avatar_url: string
          }[]
      }
    }
    Enums: {
      booking_status: "pending" | "approved" | "rejected" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Export individual row types for convenience
export type PropertiesRow = Database["public"]["Tables"]["properties"]["Row"]
export type BookingRequestsRow = Database["public"]["Tables"]["booking_requests"]["Row"]
export type FavoritesRow = Database["public"]["Tables"]["favorites"]["Row"]
export type MessagesRow = Database["public"]["Tables"]["messages"]["Row"]
export type ProfilesRow = Database["public"]["Tables"]["profiles"]["Row"]
export type SettingsRow = Database["public"]["Tables"]["settings"]["Row"]

// Export Enums if needed
export type BookingStatus = Database["public"]["Enums"]["booking_status"]
