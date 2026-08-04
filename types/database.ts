export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_date: string | null
          body: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          deal_id: string | null
          description: string | null
          id: string
          property_id: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          activity_date?: string | null
          body?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          id?: string
          property_id?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          activity_date?: string | null
          body?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          id?: string
          property_id?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          assigned_to: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          deal_id: string | null
          description: string | null
          end_time: string | null
          event_type: string
          id: string
          property_id: string | null
          start_time: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          end_time?: string | null
          event_type?: string
          id?: string
          property_id?: string | null
          start_time: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          end_time?: string | null
          event_type?: string
          id?: string
          property_id?: string | null
          start_time?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_distributions: {
        Row: {
          amount: number
          commission_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          paid_date: string | null
          percentage: number | null
          role: string
          status: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          commission_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_date?: string | null
          percentage?: number | null
          role: string
          status?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          commission_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_date?: string | null
          percentage?: number | null
          role?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_distributions_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_distributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          advisor_id: string | null
          amount: number
          commission_basis: string | null
          commission_percentage: number | null
          commission_type: string
          contact_id: string | null
          created_at: string | null
          deal_id: string | null
          due_date: string | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          notes: string | null
          payment_date: string | null
          payment_mode: string | null
          payment_reference: string | null
          property_id: string | null
          received_date: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          advisor_id?: string | null
          amount?: number
          commission_basis?: string | null
          commission_percentage?: number | null
          commission_type?: string
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_mode?: string | null
          payment_reference?: string | null
          property_id?: string | null
          received_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          advisor_id?: string | null
          amount?: number
          commission_basis?: string | null
          commission_percentage?: number | null
          commission_type?: string
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_mode?: string | null
          payment_reference?: string | null
          property_id?: string | null
          received_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      communications_templates: {
        Row: {
          body: string
          category: Database["public"]["Enums"]["communication_category"]
          channel: Database["public"]["Enums"]["communication_channel"]
          created_at: string
          created_by: string | null
          id: string
          slug: string
          status: Database["public"]["Enums"]["communication_status"]
          subject: string | null
          tags: string[] | null
          title: string
          updated_at: string
          usage_count: number
          variables: Json
        }
        Insert: {
          body: string
          category: Database["public"]["Enums"]["communication_category"]
          channel?: Database["public"]["Enums"]["communication_channel"]
          created_at?: string
          created_by?: string | null
          id?: string
          slug: string
          status?: Database["public"]["Enums"]["communication_status"]
          subject?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          usage_count?: number
          variables?: Json
        }
        Update: {
          body?: string
          category?: Database["public"]["Enums"]["communication_category"]
          channel?: Database["public"]["Enums"]["communication_channel"]
          created_at?: string
          created_by?: string | null
          id?: string
          slug?: string
          status?: Database["public"]["Enums"]["communication_status"]
          subject?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          usage_count?: number
          variables?: Json
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          advisor_id: string | null
          bathrooms: number | null
          bedrooms: Database["public"]["Enums"]["bedroom_count"] | null
          budget_max: number | null
          budget_min: number | null
          city: string | null
          co_buyer: string | null
          country: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          email: string | null
          financing: Database["public"]["Enums"]["financing_type"] | null
          first_name: string
          full_name: string | null
          housing_lead_id: string | null
          id: string
          is_private: boolean | null
          last_contacted_at: string | null
          last_name: string | null
          lead_source: string | null
          lead_stage: Database["public"]["Enums"]["lead_stage"]
          lead_temperature: Database["public"]["Enums"]["lead_temperature"]
          locations: string[] | null
          max_area: number | null
          min_area: number | null
          must_have: string[] | null
          next_follow_up_at: string | null
          nice_to_have: string[] | null
          notes: string | null
          owner_id: string | null
          phone: string
          plot_size: number | null
          preferred_language: string | null
          private_notes: string | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          purpose: Database["public"]["Enums"]["purchase_purpose"] | null
          referral_source: string | null
          relationship_types: string[] | null
          resident: Database["public"]["Enums"]["resident_status"] | null
          spouse_name: string | null
          timeline: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          advisor_id?: string | null
          bathrooms?: number | null
          bedrooms?: Database["public"]["Enums"]["bedroom_count"] | null
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          co_buyer?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          email?: string | null
          financing?: Database["public"]["Enums"]["financing_type"] | null
          first_name: string
          full_name?: string | null
          housing_lead_id?: string | null
          id?: string
          is_private?: boolean | null
          last_contacted_at?: string | null
          last_name?: string | null
          lead_source?: string | null
          lead_stage?: Database["public"]["Enums"]["lead_stage"]
          lead_temperature?: Database["public"]["Enums"]["lead_temperature"]
          locations?: string[] | null
          max_area?: number | null
          min_area?: number | null
          must_have?: string[] | null
          next_follow_up_at?: string | null
          nice_to_have?: string[] | null
          notes?: string | null
          owner_id?: string | null
          phone: string
          plot_size?: number | null
          preferred_language?: string | null
          private_notes?: string | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          purpose?: Database["public"]["Enums"]["purchase_purpose"] | null
          referral_source?: string | null
          relationship_types?: string[] | null
          resident?: Database["public"]["Enums"]["resident_status"] | null
          spouse_name?: string | null
          timeline?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          advisor_id?: string | null
          bathrooms?: number | null
          bedrooms?: Database["public"]["Enums"]["bedroom_count"] | null
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          co_buyer?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          email?: string | null
          financing?: Database["public"]["Enums"]["financing_type"] | null
          first_name?: string
          full_name?: string | null
          housing_lead_id?: string | null
          id?: string
          is_private?: boolean | null
          last_contacted_at?: string | null
          last_name?: string | null
          lead_source?: string | null
          lead_stage?: Database["public"]["Enums"]["lead_stage"]
          lead_temperature?: Database["public"]["Enums"]["lead_temperature"]
          locations?: string[] | null
          max_area?: number | null
          min_area?: number | null
          must_have?: string[] | null
          next_follow_up_at?: string | null
          nice_to_have?: string[] | null
          notes?: string | null
          owner_id?: string | null
          phone?: string
          plot_size?: number | null
          preferred_language?: string | null
          private_notes?: string | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          purpose?: Database["public"]["Enums"]["purchase_purpose"] | null
          referral_source?: string | null
          relationship_types?: string[] | null
          resident?: Database["public"]["Enums"]["resident_status"] | null
          spouse_name?: string | null
          timeline?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          advisor: string | null
          advisor_id: string | null
          closed_at: string | null
          closing_price: number | null
          commission_amount: number | null
          commission_percentage: number | null
          contact_id: string | null
          created_at: string | null
          expected_close_date: string | null
          final_commission: number | null
          housing_lead_id: string | null
          id: string
          last_activity: string | null
          lost_notes: string | null
          lost_reason: string | null
          name: string | null
          notes: string | null
          priority: string | null
          probability: number | null
          property_id: string | null
          property_price: number | null
          stage: string | null
          tasks: Json | null
          updated_at: string | null
          whatsapp_conversation_id: string | null
        }
        Insert: {
          advisor?: string | null
          advisor_id?: string | null
          closed_at?: string | null
          closing_price?: number | null
          commission_amount?: number | null
          commission_percentage?: number | null
          contact_id?: string | null
          created_at?: string | null
          expected_close_date?: string | null
          final_commission?: number | null
          housing_lead_id?: string | null
          id?: string
          last_activity?: string | null
          lost_notes?: string | null
          lost_reason?: string | null
          name?: string | null
          notes?: string | null
          priority?: string | null
          probability?: number | null
          property_id?: string | null
          property_price?: number | null
          stage?: string | null
          tasks?: Json | null
          updated_at?: string | null
          whatsapp_conversation_id?: string | null
        }
        Update: {
          advisor?: string | null
          advisor_id?: string | null
          closed_at?: string | null
          closing_price?: number | null
          commission_amount?: number | null
          commission_percentage?: number | null
          contact_id?: string | null
          created_at?: string | null
          expected_close_date?: string | null
          final_commission?: number | null
          housing_lead_id?: string | null
          id?: string
          last_activity?: string | null
          lost_notes?: string | null
          lost_reason?: string | null
          name?: string | null
          notes?: string | null
          priority?: string | null
          probability?: number | null
          property_id?: string | null
          property_price?: number | null
          stage?: string | null
          tasks?: Json | null
          updated_at?: string | null
          whatsapp_conversation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_whatsapp_conversation_id_fkey"
            columns: ["whatsapp_conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          created_by: string | null
          date: string
          description: string | null
          id: string
          notes: string | null
          payment_method: string | null
          status: string | null
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string | null
          created_by?: string | null
          date: string
          description?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          status?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          contact_id: string | null
          content: string
          created_at: string | null
          created_by: string | null
          deal_id: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          contact_id?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          contact_id?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
          whatsapp: string | null
          whatsapp_connected: boolean | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          updated_at?: string
          whatsapp?: string | null
          whatsapp_connected?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
          whatsapp?: string | null
          whatsapp_connected?: boolean | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          advisor: string | null
          amenities: Json | null
          bathrooms: number | null
          bedrooms: number | null
          built_up_area: number | null
          buyer_matches: Json | null
          carpet_area: number | null
          cover_image: string | null
          created_at: string | null
          description: string | null
          developer: string | null
          development_stage: string | null
          furnishing: string | null
          google_map_link: string | null
          housing_last_synced_at: string | null
          housing_listing_id: string | null
          housing_sync_error: string | null
          housing_sync_status: string | null
          id: string
          last_shared: string | null
          listing_type: string | null
          locality: string | null
          location: string | null
          name: string
          note: string | null
          plot_area: number | null
          price: Json | null
          property_type: string | null
          public_link: string | null
          slug: string
          specifications: Json | null
          status: string | null
          tags: string[] | null
          transaction_type: string | null
          updated_at: string | null
        }
        Insert: {
          advisor?: string | null
          amenities?: Json | null
          bathrooms?: number | null
          bedrooms?: number | null
          built_up_area?: number | null
          buyer_matches?: Json | null
          carpet_area?: number | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          developer?: string | null
          development_stage?: string | null
          furnishing?: string | null
          google_map_link?: string | null
          housing_last_synced_at?: string | null
          housing_listing_id?: string | null
          housing_sync_error?: string | null
          housing_sync_status?: string | null
          id?: string
          last_shared?: string | null
          listing_type?: string | null
          locality?: string | null
          location?: string | null
          name: string
          note?: string | null
          plot_area?: number | null
          price?: Json | null
          property_type?: string | null
          public_link?: string | null
          slug: string
          specifications?: Json | null
          status?: string | null
          tags?: string[] | null
          transaction_type?: string | null
          updated_at?: string | null
        }
        Update: {
          advisor?: string | null
          amenities?: Json | null
          bathrooms?: number | null
          bedrooms?: number | null
          built_up_area?: number | null
          buyer_matches?: Json | null
          carpet_area?: number | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          developer?: string | null
          development_stage?: string | null
          furnishing?: string | null
          google_map_link?: string | null
          housing_last_synced_at?: string | null
          housing_listing_id?: string | null
          housing_sync_error?: string | null
          housing_sync_status?: string | null
          id?: string
          last_shared?: string | null
          listing_type?: string | null
          locality?: string | null
          location?: string | null
          name?: string
          note?: string | null
          plot_area?: number | null
          price?: Json | null
          property_type?: string | null
          public_link?: string | null
          slug?: string
          specifications?: Json | null
          status?: string | null
          tags?: string[] | null
          transaction_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      property_documents: {
        Row: {
          category: string | null
          created_at: string | null
          file_type: string | null
          file_url: string
          id: string
          name: string
          property_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          name: string
          property_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          name?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_images: {
        Row: {
          created_at: string | null
          id: string
          is_cover: boolean | null
          media_type: string | null
          property_id: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_cover?: boolean | null
          media_type?: string | null
          property_id?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_cover?: boolean | null
          media_type?: string | null
          property_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_shares: {
        Row: {
          buyer_feedback: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          deal_id: string | null
          id: string
          notes: string | null
          property_id: string | null
          shared_at: string | null
          status: string | null
          whatsapp_conversation_id: string | null
        }
        Insert: {
          buyer_feedback?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          id?: string
          notes?: string | null
          property_id?: string | null
          shared_at?: string | null
          status?: string | null
          whatsapp_conversation_id?: string | null
        }
        Update: {
          buyer_feedback?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          id?: string
          notes?: string | null
          property_id?: string | null
          shared_at?: string | null
          status?: string | null
          whatsapp_conversation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_shares_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_shares_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_shares_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      site_visits: {
        Row: {
          advisor_id: string | null
          buyer_feedback: string | null
          contact_id: string | null
          created_at: string | null
          deal_id: string | null
          id: string
          notes: string | null
          property_id: string | null
          scheduled_date: string
          scheduled_time: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          advisor_id?: string | null
          buyer_feedback?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          id?: string
          notes?: string | null
          property_id?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          advisor_id?: string | null
          buyer_feedback?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          id?: string
          notes?: string | null
          property_id?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_visits_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_visits_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_visits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          deal_id: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          bedrooms: number | null
          budget: string | null
          contact_id: string | null
          contact_name: string | null
          created_at: string | null
          id: string
          last_message: string | null
          last_message_at: string | null
          lead_type: string | null
          location: string | null
          owner_id: string
          phone_number: string
          property_type: string | null
          qualification: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          bedrooms?: number | null
          budget?: string | null
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          lead_type?: string | null
          location?: string | null
          owner_id: string
          phone_number: string
          property_type?: string | null
          qualification?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          bedrooms?: number | null
          budget?: string | null
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          lead_type?: string | null
          location?: string | null
          owner_id?: string
          phone_number?: string
          property_type?: string | null
          qualification?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          conversation_id: string
          created_at: string | null
          direction: string
          id: string
          message: string
          message_type: string | null
          sent_by: string | null
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          direction: string
          id?: string
          message: string
          message_type?: string | null
          sent_by?: string | null
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          direction?: string
          id?: string
          message?: string
          message_type?: string | null
          sent_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      bedroom_count: "1" | "2" | "3" | "4" | "5+"
      communication_category:
        | "buyer"
        | "seller"
        | "developer"
        | "broker"
        | "internal"
        | "marketing"
        | "legal"
        | "finance"
      communication_channel: "whatsapp" | "email"
      communication_status: "draft" | "active" | "archived"
      financing_type: "cash" | "loan" | "undecided"
      lead_stage:
        | "new"
        | "contacted"
        | "qualified"
        | "viewing"
        | "negotiating"
        | "won"
        | "lost"
        | "active"
        | "inactive"
      lead_temperature: "cold" | "warm" | "hot"
      property_type: "apartment" | "villa" | "plot" | "penthouse" | "commercial"
      purchase_purpose:
        | "primary_residence"
        | "holiday_home"
        | "investment"
        | "retirement"
      resident_status: "resident" | "nri" | "foreigner"
      user_role: "admin" | "sales"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      bedroom_count: ["1", "2", "3", "4", "5+"],
      communication_category: [
        "buyer",
        "seller",
        "developer",
        "broker",
        "internal",
        "marketing",
        "legal",
        "finance",
      ],
      communication_channel: ["whatsapp", "email"],
      communication_status: ["draft", "active", "archived"],
      financing_type: ["cash", "loan", "undecided"],
      lead_stage: [
        "new",
        "contacted",
        "qualified",
        "viewing",
        "negotiating",
        "won",
        "lost",
        "active",
        "inactive",
      ],
      lead_temperature: ["cold", "warm", "hot"],
      property_type: ["apartment", "villa", "plot", "penthouse", "commercial"],
      purchase_purpose: [
        "primary_residence",
        "holiday_home",
        "investment",
        "retirement",
      ],
      resident_status: ["resident", "nri", "foreigner"],
      user_role: ["admin", "sales"],
    },
  },
} as const
