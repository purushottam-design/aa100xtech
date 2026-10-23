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
  public: {
    Tables: {
      access_requests: {
        Row: {
          company: string | null
          company_email: string | null
          created_at: string
          created_user_id: string | null
          email: string
          first_name: string | null
          full_name: string
          id: string
          last_name: string | null
          message: string | null
          middle_name: string | null
          personal_email: string | null
          phone: string
          requested_role: Database["public"]["Enums"]["app_role"]
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          telegram_number: string | null
          whatsapp_number: string | null
        }
        Insert: {
          company?: string | null
          company_email?: string | null
          created_at?: string
          created_user_id?: string | null
          email: string
          first_name?: string | null
          full_name: string
          id?: string
          last_name?: string | null
          message?: string | null
          middle_name?: string | null
          personal_email?: string | null
          phone: string
          requested_role: Database["public"]["Enums"]["app_role"]
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          telegram_number?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          company?: string | null
          company_email?: string | null
          created_at?: string
          created_user_id?: string | null
          email?: string
          first_name?: string | null
          full_name?: string
          id?: string
          last_name?: string | null
          message?: string | null
          middle_name?: string | null
          personal_email?: string | null
          phone?: string
          requested_role?: Database["public"]["Enums"]["app_role"]
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          telegram_number?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      admin_2fa: {
        Row: {
          confirmed_at: string | null
          created_at: string
          enabled: boolean
          recovery_codes: string[]
          secret: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          enabled?: boolean
          recovery_codes?: string[]
          secret: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          enabled?: boolean
          recovery_codes?: string[]
          secret?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_activity_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          description: string | null
          id: string
          ip_address: string | null
          module: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          module: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          module?: string
        }
        Relationships: []
      }
      admin_login_history: {
        Row: {
          browser: string | null
          device: string | null
          email: string | null
          id: string
          ip_address: string | null
          location: string | null
          logged_in_at: string
          logged_out_at: string | null
          status: string
          suspicious: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          device?: string | null
          email?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          logged_in_at?: string
          logged_out_at?: string | null
          status?: string
          suspicious?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          device?: string | null
          email?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          logged_in_at?: string
          logged_out_at?: string | null
          status?: string
          suspicious?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_notification_reads: {
        Row: {
          id: string
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "admin_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link_url: string | null
          permission: string | null
          severity: string
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link_url?: string | null
          permission?: string | null
          severity?: string
          title: string
          type: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link_url?: string | null
          permission?: string | null
          severity?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      admin_permissions: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          permission: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_sessions: {
        Row: {
          browser: string | null
          device: string | null
          email: string | null
          id: string
          ip_address: string | null
          last_seen_at: string
          location: string | null
          platform: string | null
          revoked_at: string | null
          revoked_by: string | null
          started_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          device?: string | null
          email?: string | null
          id?: string
          ip_address?: string | null
          last_seen_at?: string
          location?: string | null
          platform?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          started_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          device?: string | null
          email?: string | null
          id?: string
          ip_address?: string | null
          last_seen_at?: string
          location?: string | null
          platform?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          started_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      affiliate_clicks: {
        Row: {
          affiliate_id: string
          catalog_item_id: string | null
          coupon_code_id: string | null
          created_at: string
          device: string | null
          id: string
          ip_hash: string | null
          is_duplicate: boolean
          referral_link_id: string | null
          source: string | null
        }
        Insert: {
          affiliate_id: string
          catalog_item_id?: string | null
          coupon_code_id?: string | null
          created_at?: string
          device?: string | null
          id?: string
          ip_hash?: string | null
          is_duplicate?: boolean
          referral_link_id?: string | null
          source?: string | null
        }
        Update: {
          affiliate_id?: string
          catalog_item_id?: string | null
          coupon_code_id?: string | null
          created_at?: string
          device?: string | null
          id?: string
          ip_hash?: string | null
          is_duplicate?: boolean
          referral_link_id?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_coupon_code_id_fkey"
            columns: ["coupon_code_id"]
            isOneToOne: false
            referencedRelation: "coupon_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_referral_link_id_fkey"
            columns: ["referral_link_id"]
            isOneToOne: false
            referencedRelation: "referral_links"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          affiliate_code: string
          audience_note: string | null
          company_name: string | null
          country: string | null
          created_at: string
          custom_commission_type: string | null
          custom_commission_value: number | null
          email: string
          entity_type: string
          full_name: string
          id: string
          kyc_info: Json
          min_payout_threshold: number
          payout_details: Json
          payout_method: string | null
          phone: string | null
          status: string
          tier: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          affiliate_code: string
          audience_note?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          custom_commission_type?: string | null
          custom_commission_value?: number | null
          email: string
          entity_type?: string
          full_name: string
          id?: string
          kyc_info?: Json
          min_payout_threshold?: number
          payout_details?: Json
          payout_method?: string | null
          phone?: string | null
          status?: string
          tier?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          affiliate_code?: string
          audience_note?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          custom_commission_type?: string | null
          custom_commission_value?: number | null
          email?: string
          entity_type?: string
          full_name?: string
          id?: string
          kyc_info?: Json
          min_payout_threshold?: number
          payout_details?: Json
          payout_method?: string | null
          phone?: string | null
          status?: string
          tier?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      candidate_submissions: {
        Row: {
          availability: string | null
          created_at: string
          deliverables: string | null
          email: string
          expected_cost: string | null
          file_path: string | null
          full_name: string
          hours_needed: string | null
          id: string
          phone: string | null
          portfolio_url: string | null
          role_applied: string | null
          task_title: string | null
        }
        Insert: {
          availability?: string | null
          created_at?: string
          deliverables?: string | null
          email: string
          expected_cost?: string | null
          file_path?: string | null
          full_name: string
          hours_needed?: string | null
          id?: string
          phone?: string | null
          portfolio_url?: string | null
          role_applied?: string | null
          task_title?: string | null
        }
        Update: {
          availability?: string | null
          created_at?: string
          deliverables?: string | null
          email?: string
          expected_cost?: string | null
          file_path?: string | null
          full_name?: string
          hours_needed?: string | null
          id?: string
          phone?: string | null
          portfolio_url?: string | null
          role_applied?: string | null
          task_title?: string | null
        }
        Relationships: []
      }
      catalog_items: {
        Row: {
          active: boolean
          category: string | null
          cookie_duration_days: number
          created_at: string
          default_commission_type: string
          default_commission_value: number
          description: string | null
          id: string
          landing_url: string
          name: string
          recurring: boolean
          slug: string
          tiers: Json
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          cookie_duration_days?: number
          created_at?: string
          default_commission_type?: string
          default_commission_value?: number
          description?: string | null
          id?: string
          landing_url: string
          name: string
          recurring?: boolean
          slug: string
          tiers?: Json
          type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          cookie_duration_days?: number
          created_at?: string
          default_commission_type?: string
          default_commission_value?: number
          description?: string | null
          id?: string
          landing_url?: string
          name?: string
          recurring?: boolean
          slug?: string
          tiers?: Json
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      consultation_bookings: {
        Row: {
          amount: number
          booking_id: string
          booking_status: string
          company_name: string | null
          consultation_plan: string
          consultation_type: string
          country: string
          created_at: string
          currency: string
          customer_name: string
          duration: string
          email: string
          id: string
          meeting_platform: string
          payment_status: string
          phone: string
          plan_id: string
          preferred_date: string
          preferred_time: string
          project_description: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          service: string
          timezone: string
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          booking_status?: string
          company_name?: string | null
          consultation_plan: string
          consultation_type: string
          country: string
          created_at?: string
          currency?: string
          customer_name: string
          duration: string
          email: string
          id?: string
          meeting_platform: string
          payment_status?: string
          phone: string
          plan_id: string
          preferred_date: string
          preferred_time: string
          project_description: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          service: string
          timezone: string
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          booking_status?: string
          company_name?: string | null
          consultation_plan?: string
          consultation_type?: string
          country?: string
          created_at?: string
          currency?: string
          customer_name?: string
          duration?: string
          email?: string
          id?: string
          meeting_platform?: string
          payment_status?: string
          phone?: string
          plan_id?: string
          preferred_date?: string
          preferred_time?: string
          project_description?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          service?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          service: string | null
          status: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          service?: string | null
          status?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          service?: string | null
          status?: string
        }
        Relationships: []
      }
      content_blocks: {
        Row: {
          active: boolean
          block_type: string
          body: string | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          link_label: string | null
          link_url: string | null
          placement: string
          position: number
          published_at: string | null
          slug: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          block_type?: string
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          link_label?: string | null
          link_url?: string | null
          placement?: string
          position?: number
          published_at?: string | null
          slug: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          block_type?: string
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          link_label?: string | null
          link_url?: string | null
          placement?: string
          position?: number
          published_at?: string | null
          slug?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversions: {
        Row: {
          affiliate_id: string
          attribution: string
          catalog_item_id: string | null
          commission_earned: number
          coupon_code_id: string | null
          created_at: string
          currency: string
          event_type: string
          id: string
          is_recurring: boolean
          order_id: string
          order_value: number
          payout_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          attribution?: string
          catalog_item_id?: string | null
          commission_earned?: number
          coupon_code_id?: string | null
          created_at?: string
          currency?: string
          event_type?: string
          id?: string
          is_recurring?: boolean
          order_id: string
          order_value?: number
          payout_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          attribution?: string
          catalog_item_id?: string | null
          commission_earned?: number
          coupon_code_id?: string | null
          created_at?: string
          currency?: string
          event_type?: string
          id?: string
          is_recurring?: boolean
          order_id?: string
          order_value?: number
          payout_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversions_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversions_coupon_code_id_fkey"
            columns: ["coupon_code_id"]
            isOneToOne: false
            referencedRelation: "coupon_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_codes: {
        Row: {
          active: boolean
          affiliate_id: string
          catalog_item_id: string | null
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          id: string
        }
        Insert: {
          active?: boolean
          affiliate_id: string
          catalog_item_id?: string | null
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
        }
        Update: {
          active?: boolean
          affiliate_id?: string
          catalog_item_id?: string | null
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_codes_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_codes_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          active: boolean
          answer: string
          category: string | null
          created_at: string
          created_by: string | null
          id: string
          position: number
          question: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          answer: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          position?: number
          question: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          answer?: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          position?: number
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          company: string | null
          created_at: string
          currency: string
          email: string | null
          full_name: string
          id: string
          interest: string | null
          last_contacted_at: string | null
          note: string | null
          phone: string | null
          region: string | null
          source: string
          status: string
          updated_at: string
          value: number
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          full_name: string
          id?: string
          interest?: string | null
          last_contacted_at?: string | null
          note?: string | null
          phone?: string | null
          region?: string | null
          source?: string
          status?: string
          updated_at?: string
          value?: number
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          full_name?: string
          id?: string
          interest?: string | null
          last_contacted_at?: string | null
          note?: string | null
          phone?: string | null
          region?: string | null
          source?: string
          status?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          active: boolean
          body: string
          channel: string
          created_at: string
          id: string
          key: string
          name: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          body: string
          channel?: string
          created_at?: string
          id?: string
          key: string
          name: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          body?: string
          channel?: string
          created_at?: string
          id?: string
          key?: string
          name?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          audience: string
          body: string
          channel: string
          created_at: string
          created_by: string | null
          id: string
          link_url: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          body: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          link_url?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          body?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          link_url?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          id: string
          item_name: string
          notes: string | null
          order_no: string
          payment_reference: string | null
          payment_status: string
          product_id: string | null
          quantity: number
          refund_amount: number
          refund_reason: string | null
          refunded_at: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          item_name: string
          notes?: string | null
          order_no: string
          payment_reference?: string | null
          payment_status?: string
          product_id?: string | null
          quantity?: number
          refund_amount?: number
          refund_reason?: string | null
          refunded_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          item_name?: string
          notes?: string | null
          order_no?: string
          payment_reference?: string | null
          payment_status?: string
          product_id?: string | null
          quantity?: number
          refund_amount?: number
          refund_reason?: string | null
          refunded_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_applications: {
        Row: {
          affiliate_platforms: string | null
          country: string | null
          created_at: string
          email: string
          followers: string | null
          full_name: string
          handle: string | null
          id: string
          motivation: string | null
          niche: string | null
          phone: string | null
          plan_id: string | null
          plan_name: string | null
          platforms: string | null
          referrer: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_level: string | null
        }
        Insert: {
          affiliate_platforms?: string | null
          country?: string | null
          created_at?: string
          email: string
          followers?: string | null
          full_name: string
          handle?: string | null
          id?: string
          motivation?: string | null
          niche?: string | null
          phone?: string | null
          plan_id?: string | null
          plan_name?: string | null
          platforms?: string | null
          referrer?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_level?: string | null
        }
        Update: {
          affiliate_platforms?: string | null
          country?: string | null
          created_at?: string
          email?: string
          followers?: string | null
          full_name?: string
          handle?: string | null
          id?: string
          motivation?: string | null
          niche?: string | null
          phone?: string | null
          plan_id?: string | null
          plan_name?: string | null
          platforms?: string | null
          referrer?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_level?: string | null
        }
        Relationships: []
      }
      payouts: {
        Row: {
          affiliate_id: string
          amount: number
          created_at: string
          currency: string
          id: string
          method: string | null
          note: string | null
          paid_at: string | null
          reference: string | null
          requested_at: string
          status: string
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          amount: number
          created_at?: string
          currency?: string
          id?: string
          method?: string | null
          note?: string | null
          paid_at?: string | null
          reference?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          method?: string | null
          note?: string | null
          paid_at?: string | null
          reference?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          position: number
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          position?: number
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          position?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          id: string
          image_url: string | null
          kind: string
          name: string
          position: number
          price: number
          published_at: string | null
          slug: string
          status: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          kind?: string
          name: string
          position?: number
          price?: number
          published_at?: string | null
          slug: string
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          kind?: string
          name?: string
          position?: number
          price?: number
          published_at?: string | null
          slug?: string
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          department: string | null
          department_id: string | null
          email: string
          employee_id: string | null
          employee_of_month_for: string | null
          full_name: string
          id: string
          is_active: boolean
          job_title: string | null
          joined_at: string
          last_activity_at: string | null
          last_login_at: string | null
          must_change_password: boolean
          phone: string | null
          status: string
          target_label: string | null
          target_percent: number
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          department_id?: string | null
          email: string
          employee_id?: string | null
          employee_of_month_for?: string | null
          full_name?: string
          id: string
          is_active?: boolean
          job_title?: string | null
          joined_at?: string
          last_activity_at?: string | null
          last_login_at?: string | null
          must_change_password?: boolean
          phone?: string | null
          status?: string
          target_label?: string | null
          target_percent?: number
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          department_id?: string | null
          email?: string
          employee_id?: string | null
          employee_of_month_for?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          job_title?: string | null
          joined_at?: string
          last_activity_at?: string | null
          last_login_at?: string | null
          must_change_password?: boolean
          phone?: string | null
          status?: string
          target_label?: string | null
          target_percent?: number
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      push_devices: {
        Row: {
          created_at: string
          device_token: string
          enabled: boolean
          id: string
          last_seen_at: string
          platform: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_token: string
          enabled?: boolean
          id?: string
          last_seen_at?: string
          platform?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_token?: string
          enabled?: boolean
          id?: string
          last_seen_at?: string
          platform?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referral_links: {
        Row: {
          active: boolean
          affiliate_id: string
          catalog_item_id: string
          created_at: string
          id: string
          unique_slug: string
        }
        Insert: {
          active?: boolean
          affiliate_id: string
          catalog_item_id: string
          created_at?: string
          id?: string
          unique_slug: string
        }
        Update: {
          active?: boolean
          affiliate_id?: string
          catalog_item_id?: string
          created_at?: string
          id?: string
          unique_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_links_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_links_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_email: string | null
          author_name: string
          body: string | null
          created_at: string
          id: string
          product_id: string | null
          rating: number
          status: string
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          author_email?: string | null
          author_name: string
          body?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
          rating?: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          author_email?: string | null
          author_name?: string
          body?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
          rating?: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission: string
          role_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission: string
          role_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_system: boolean
          key: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          key: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          key?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          id: string
          last_reply_at: string | null
          priority: string
          requester_email: string
          requester_id: string | null
          requester_name: string
          status: string
          subject: string
          ticket_no: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          id?: string
          last_reply_at?: string | null
          priority?: string
          requester_email: string
          requester_id?: string | null
          requester_name: string
          status?: string
          subject: string
          ticket_no?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          id?: string
          last_reply_at?: string | null
          priority?: string
          requester_email?: string
          requester_id?: string | null
          requester_name?: string
          status?: string
          subject?: string
          ticket_no?: string
          updated_at?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          author_email: string | null
          author_id: string | null
          author_name: string | null
          body: string
          created_at: string
          id: string
          is_internal: boolean
          ticket_id: string
        }
        Insert: {
          author_email?: string | null
          author_id?: string | null
          author_name?: string | null
          body: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id: string
        }
        Update: {
          author_email?: string | null
          author_id?: string | null
          author_name?: string | null
          body?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role:
        | "supreme_admin"
        | "employee"
        | "customer"
        | "job_seeker"
        | "partner"
        | "company_admin"
        | "interview_admin"
        | "marketing_admin"
        | "business_admin"
        | "manager"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "supreme_admin",
        "employee",
        "customer",
        "job_seeker",
        "partner",
        "company_admin",
        "interview_admin",
        "marketing_admin",
        "business_admin",
        "manager",
      ],
    },
  },
} as const
