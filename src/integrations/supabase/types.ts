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
      achievements: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string
          description_bn: string | null
          icon: string
          id: string
          is_hidden: boolean | null
          name: string
          name_bn: string | null
          requirement_type: string
          requirement_value: number
          reward_amount: number | null
          sort_order: number | null
          tier: string
        }
        Insert: {
          category?: string
          code: string
          created_at?: string
          description: string
          description_bn?: string | null
          icon?: string
          id?: string
          is_hidden?: boolean | null
          name: string
          name_bn?: string | null
          requirement_type: string
          requirement_value?: number
          reward_amount?: number | null
          sort_order?: number | null
          tier?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string
          description_bn?: string | null
          icon?: string
          id?: string
          is_hidden?: boolean | null
          name?: string
          name_bn?: string | null
          requirement_type?: string
          requirement_value?: number
          reward_amount?: number | null
          sort_order?: number | null
          tier?: string
        }
        Relationships: []
      }
      activity_task_claims: {
        Row: {
          claim_date: string
          created_at: string
          id: string
          reward_amount: number
          task_id: string
          task_type: string
          user_id: string
        }
        Insert: {
          claim_date?: string
          created_at?: string
          id?: string
          reward_amount?: number
          task_id: string
          task_type: string
          user_id: string
        }
        Update: {
          claim_date?: string
          created_at?: string
          id?: string
          reward_amount?: number
          task_id?: string
          task_type?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_account_locks: {
        Row: {
          created_at: string | null
          email: string
          id: string
          lock_reason: string | null
          locked_until: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          lock_reason?: string | null
          locked_until: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          lock_reason?: string | null
          locked_until?: string
        }
        Relationships: []
      }
      admin_auth_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          email: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          email: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          email?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_cms_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          items_snapshot: Json
          note: string | null
          section_id: string
          snapshot: Json
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          items_snapshot?: Json
          note?: string | null
          section_id: string
          snapshot: Json
          version_number: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          items_snapshot?: Json
          note?: string | null
          section_id?: string
          snapshot?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "admin_cms_versions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "admin_page_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_crash_audit_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          round_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          round_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          round_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_crash_audit_logs_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "crash_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_feature_flags: {
        Row: {
          created_at: string | null
          description: string | null
          flag_name: string
          flag_value: boolean | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          flag_name: string
          flag_value?: boolean | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          flag_name?: string
          flag_value?: boolean | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_goal_streaks: {
        Row: {
          admin_id: string
          best_streak: number
          created_at: string
          current_streak: number
          id: string
          last_goal_met_date: string | null
          total_goals_met: number
          updated_at: string
        }
        Insert: {
          admin_id: string
          best_streak?: number
          created_at?: string
          current_streak?: number
          id?: string
          last_goal_met_date?: string | null
          total_goals_met?: number
          updated_at?: string
        }
        Update: {
          admin_id?: string
          best_streak?: number
          created_at?: string
          current_streak?: number
          id?: string
          last_goal_met_date?: string | null
          total_goals_met?: number
          updated_at?: string
        }
        Relationships: []
      }
      admin_media_library: {
        Row: {
          created_at: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          tags: string[]
          title: string | null
          updated_at: string
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          tags?: string[]
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          tags?: string[]
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
          url?: string
        }
        Relationships: []
      }
      admin_notification_history: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          escalation_count: number
          id: string
          is_read: boolean
          last_escalated_at: string | null
          message: string | null
          metadata: Json | null
          notification_type: string
          priority: string
          read_at: string | null
          recipients: string[] | null
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          escalation_count?: number
          id?: string
          is_read?: boolean
          last_escalated_at?: string | null
          message?: string | null
          metadata?: Json | null
          notification_type: string
          priority?: string
          read_at?: string | null
          recipients?: string[] | null
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          escalation_count?: number
          id?: string
          is_read?: boolean
          last_escalated_at?: string | null
          message?: string | null
          metadata?: Json | null
          notification_type?: string
          priority?: string
          read_at?: string | null
          recipients?: string[] | null
          title?: string
        }
        Relationships: []
      }
      admin_otp_challenges: {
        Row: {
          attempts: number
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          otp_hash: string
          user_id: string
        }
        Insert: {
          attempts?: number
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          otp_hash: string
          user_id: string
        }
        Update: {
          attempts?: number
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          otp_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_page_sections: {
        Row: {
          agent_only: boolean
          badge: string | null
          bangladesh_only: boolean
          category: string | null
          created_at: string
          created_by: string | null
          cta_label: string | null
          cta_link: string | null
          description: string | null
          display_order: number
          ends_at: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_published: boolean
          metadata: Json
          non_agent_only: boolean
          page_key: string
          section_key: string
          starts_at: string | null
          status: string
          subtitle: string | null
          title: string | null
          updated_at: string
          updated_by: string | null
          vip_only: boolean
        }
        Insert: {
          agent_only?: boolean
          badge?: string | null
          bangladesh_only?: boolean
          category?: string | null
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          cta_link?: string | null
          description?: string | null
          display_order?: number
          ends_at?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          metadata?: Json
          non_agent_only?: boolean
          page_key: string
          section_key: string
          starts_at?: string | null
          status?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
          updated_by?: string | null
          vip_only?: boolean
        }
        Update: {
          agent_only?: boolean
          badge?: string | null
          bangladesh_only?: boolean
          category?: string | null
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          cta_link?: string | null
          description?: string | null
          display_order?: number
          ends_at?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          metadata?: Json
          non_agent_only?: boolean
          page_key?: string
          section_key?: string
          starts_at?: string | null
          status?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
          updated_by?: string | null
          vip_only?: boolean
        }
        Relationships: []
      }
      admin_publish_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          page_key: string | null
          payload: Json
          section_id: string | null
          target_version: number | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          page_key?: string | null
          payload?: Json
          section_id?: string | null
          target_version?: number | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          page_key?: string | null
          payload?: Json
          section_id?: string | null
          target_version?: number | null
        }
        Relationships: []
      }
      admin_section_items: {
        Row: {
          agent_only: boolean
          badge: string | null
          category: string | null
          created_at: string
          created_by: string | null
          cta_label: string | null
          cta_link: string | null
          description: string | null
          display_order: number
          ends_at: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_published: boolean
          metadata: Json
          section_id: string
          starts_at: string | null
          status: string
          subtitle: string | null
          title: string | null
          updated_at: string
          updated_by: string | null
          vip_only: boolean
        }
        Insert: {
          agent_only?: boolean
          badge?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          cta_link?: string | null
          description?: string | null
          display_order?: number
          ends_at?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          metadata?: Json
          section_id: string
          starts_at?: string | null
          status?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
          updated_by?: string | null
          vip_only?: boolean
        }
        Update: {
          agent_only?: boolean
          badge?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          cta_link?: string | null
          description?: string | null
          display_order?: number
          ends_at?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          metadata?: Json
          section_id?: string
          starts_at?: string | null
          status?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
          updated_by?: string | null
          vip_only?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "admin_section_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "admin_page_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_settings: {
        Row: {
          created_at: string
          daily_processing_goal: number
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_processing_goal?: number
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_processing_goal?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_trading_settings: {
        Row: {
          forced_trade_result: string
          global_volatility: number
          id: number
          max_bet: number
          min_bet: number
          payout_multiplier: number
          trading_paused: boolean
          update_speed_ms: number
          updated_at: string
          updated_by: string | null
          win_rate: number
        }
        Insert: {
          forced_trade_result?: string
          global_volatility?: number
          id?: number
          max_bet?: number
          min_bet?: number
          payout_multiplier?: number
          trading_paused?: boolean
          update_speed_ms?: number
          updated_at?: string
          updated_by?: string | null
          win_rate?: number
        }
        Update: {
          forced_trade_result?: string
          global_volatility?: number
          id?: number
          max_bet?: number
          min_bet?: number
          payout_multiplier?: number
          trading_paused?: boolean
          update_speed_ms?: number
          updated_at?: string
          updated_by?: string | null
          win_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "admin_trading_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      agent_activity_logs: {
        Row: {
          action_type: string
          agent_user_id: string
          created_at: string | null
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          performed_by: string
          reason: string | null
        }
        Insert: {
          action_type: string
          agent_user_id: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          performed_by: string
          reason?: string | null
        }
        Update: {
          action_type?: string
          agent_user_id?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          performed_by?: string
          reason?: string | null
        }
        Relationships: []
      }
      agent_announcements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_pinned: boolean
          message: string
          priority: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_pinned?: boolean
          message: string
          priority?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_pinned?: boolean
          message?: string
          priority?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_application_payments: {
        Row: {
          admin_note: string | null
          amount_usdt: number
          application_id: string | null
          created_at: string
          device_info: string | null
          id: string
          ip_address: string | null
          network: string
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_url: string | null
          status: string
          txid: string
          updated_at: string
          user_id: string
          wallet_address_used: string
        }
        Insert: {
          admin_note?: string | null
          amount_usdt: number
          application_id?: string | null
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: string | null
          network?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          status?: string
          txid: string
          updated_at?: string
          user_id: string
          wallet_address_used: string
        }
        Update: {
          admin_note?: string | null
          amount_usdt?: number
          application_id?: string | null
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: string | null
          network?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          status?: string
          txid?: string
          updated_at?: string
          user_id?: string
          wallet_address_used?: string
        }
        Relationships: []
      }
      agent_applications: {
        Row: {
          admin_note: string | null
          created_at: string | null
          deposit_method: string
          deposit_proof_url: string | null
          deposit_tx_ref: string | null
          id: string
          payment_id: string | null
          payment_verified: boolean
          required_deposit: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          submitted_at: string | null
          tier_requested: Database["public"]["Enums"]["agent_tier"]
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string | null
          deposit_method: string
          deposit_proof_url?: string | null
          deposit_tx_ref?: string | null
          id?: string
          payment_id?: string | null
          payment_verified?: boolean
          required_deposit: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_at?: string | null
          tier_requested: Database["public"]["Enums"]["agent_tier"]
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string | null
          deposit_method?: string
          deposit_proof_url?: string | null
          deposit_tx_ref?: string | null
          id?: string
          payment_id?: string | null
          payment_verified?: boolean
          required_deposit?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_at?: string | null
          tier_requested?: Database["public"]["Enums"]["agent_tier"]
          user_id?: string
        }
        Relationships: []
      }
      agent_commissions: {
        Row: {
          agent_user_id: string
          commission_amount: number
          commission_rate: number
          commission_type: string
          created_at: string | null
          credited_at: string | null
          id: string
          is_credited: boolean | null
          reference_id: string | null
          referred_user_id: string
          source_amount: number
          status: string
        }
        Insert: {
          agent_user_id: string
          commission_amount: number
          commission_rate: number
          commission_type: string
          created_at?: string | null
          credited_at?: string | null
          id?: string
          is_credited?: boolean | null
          reference_id?: string | null
          referred_user_id: string
          source_amount: number
          status?: string
        }
        Update: {
          agent_user_id?: string
          commission_amount?: number
          commission_rate?: number
          commission_type?: string
          created_at?: string | null
          credited_at?: string | null
          id?: string
          is_credited?: boolean | null
          reference_id?: string | null
          referred_user_id?: string
          source_amount?: number
          status?: string
        }
        Relationships: []
      }
      agent_milestone_rewards: {
        Row: {
          agent_user_id: string
          bonus_amount: number
          claimed_at: string | null
          commission_earned: number
          created_at: string
          id: string
          milestone_key: string
          milestone_level: number
          milestone_type: string
          referral_count: number
        }
        Insert: {
          agent_user_id: string
          bonus_amount?: number
          claimed_at?: string | null
          commission_earned?: number
          created_at?: string
          id?: string
          milestone_key: string
          milestone_level: number
          milestone_type: string
          referral_count: number
        }
        Update: {
          agent_user_id?: string
          bonus_amount?: number
          claimed_at?: string | null
          commission_earned?: number
          created_at?: string
          id?: string
          milestone_key?: string
          milestone_level?: number
          milestone_type?: string
          referral_count?: number
        }
        Relationships: []
      }
      agent_payment_settings: {
        Row: {
          application_fee_usdt: number
          id: string
          is_active: boolean
          is_agent_application_enabled: boolean
          is_usdt_payment_enabled: boolean
          maintenance_mode: boolean
          payment_instructions: string | null
          qr_code_url: string | null
          updated_at: string
          updated_by: string | null
          usdt_network: string
          usdt_wallet_address: string
        }
        Insert: {
          application_fee_usdt?: number
          id?: string
          is_active?: boolean
          is_agent_application_enabled?: boolean
          is_usdt_payment_enabled?: boolean
          maintenance_mode?: boolean
          payment_instructions?: string | null
          qr_code_url?: string | null
          updated_at?: string
          updated_by?: string | null
          usdt_network?: string
          usdt_wallet_address?: string
        }
        Update: {
          application_fee_usdt?: number
          id?: string
          is_active?: boolean
          is_agent_application_enabled?: boolean
          is_usdt_payment_enabled?: boolean
          maintenance_mode?: boolean
          payment_instructions?: string | null
          qr_code_url?: string | null
          updated_at?: string
          updated_by?: string | null
          usdt_network?: string
          usdt_wallet_address?: string
        }
        Relationships: []
      }
      agent_referrals: {
        Row: {
          agent_code: string
          agent_user_id: string
          commission_earned: number | null
          created_at: string | null
          first_deposit_amount: number | null
          first_deposit_at: string | null
          id: string
          is_active: boolean | null
          last_activity_at: string | null
          referred_user_id: string
          registration_bonus_paid: boolean | null
          source: string | null
          total_betting_volume: number | null
          total_deposit_volume: number | null
        }
        Insert: {
          agent_code: string
          agent_user_id: string
          commission_earned?: number | null
          created_at?: string | null
          first_deposit_amount?: number | null
          first_deposit_at?: string | null
          id?: string
          is_active?: boolean | null
          last_activity_at?: string | null
          referred_user_id: string
          registration_bonus_paid?: boolean | null
          source?: string | null
          total_betting_volume?: number | null
          total_deposit_volume?: number | null
        }
        Update: {
          agent_code?: string
          agent_user_id?: string
          commission_earned?: number | null
          created_at?: string | null
          first_deposit_amount?: number | null
          first_deposit_at?: string | null
          id?: string
          is_active?: boolean | null
          last_activity_at?: string | null
          referred_user_id?: string
          registration_bonus_paid?: boolean | null
          source?: string | null
          total_betting_volume?: number | null
          total_deposit_volume?: number | null
        }
        Relationships: []
      }
      agent_salary_records: {
        Row: {
          active_referral_count: number
          admin_notes: string | null
          agent_tier: string
          agent_user_id: string
          base_salary: number
          claimed_at: string | null
          created_at: string
          id: string
          paid_at: string | null
          referral_bonus: number
          salary_month: string
          status: string
          total_salary: number
        }
        Insert: {
          active_referral_count?: number
          admin_notes?: string | null
          agent_tier: string
          agent_user_id: string
          base_salary?: number
          claimed_at?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          referral_bonus?: number
          salary_month: string
          status?: string
          total_salary?: number
        }
        Update: {
          active_referral_count?: number
          admin_notes?: string | null
          agent_tier?: string
          agent_user_id?: string
          base_salary?: number
          claimed_at?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          referral_bonus?: number
          salary_month?: string
          status?: string
          total_salary?: number
        }
        Relationships: []
      }
      agent_sessions: {
        Row: {
          agent_user_id: string
          created_at: string
          device_info: string | null
          id: string
          ip_address: string | null
          is_active: boolean
          last_active_at: string
          login_at: string
          updated_at: string
        }
        Insert: {
          agent_user_id: string
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_active_at?: string
          login_at?: string
          updated_at?: string
        }
        Update: {
          agent_user_id?: string
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_active_at?: string
          login_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_settings: {
        Row: {
          anti_abuse_enabled: boolean | null
          aviator_fee_percent: number | null
          crash_fee_percent: number | null
          created_at: string | null
          fived_fee_percent: number | null
          id: string
          k3_fee_percent: number | null
          min_deposit_for_commission: number | null
          mines_fee_percent: number | null
          registration_bonus_agent: number | null
          registration_bonus_enabled: boolean | null
          registration_bonus_user: number | null
          salary_enabled: boolean | null
          trxwin_fee_percent: number | null
          updated_at: string | null
          wingo_fee_percent: number | null
        }
        Insert: {
          anti_abuse_enabled?: boolean | null
          aviator_fee_percent?: number | null
          crash_fee_percent?: number | null
          created_at?: string | null
          fived_fee_percent?: number | null
          id?: string
          k3_fee_percent?: number | null
          min_deposit_for_commission?: number | null
          mines_fee_percent?: number | null
          registration_bonus_agent?: number | null
          registration_bonus_enabled?: boolean | null
          registration_bonus_user?: number | null
          salary_enabled?: boolean | null
          trxwin_fee_percent?: number | null
          updated_at?: string | null
          wingo_fee_percent?: number | null
        }
        Update: {
          anti_abuse_enabled?: boolean | null
          aviator_fee_percent?: number | null
          crash_fee_percent?: number | null
          created_at?: string | null
          fived_fee_percent?: number | null
          id?: string
          k3_fee_percent?: number | null
          min_deposit_for_commission?: number | null
          mines_fee_percent?: number | null
          registration_bonus_agent?: number | null
          registration_bonus_enabled?: boolean | null
          registration_bonus_user?: number | null
          salary_enabled?: boolean | null
          trxwin_fee_percent?: number | null
          updated_at?: string | null
          wingo_fee_percent?: number | null
        }
        Relationships: []
      }
      ai_predictions: {
        Row: {
          accuracy_score: number | null
          actual_result: number[] | null
          created_at: string
          game_type: string
          id: string
          overall_insight: string | null
          position: string | null
          predictions: Json
          stats_snapshot: Json | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          accuracy_score?: number | null
          actual_result?: number[] | null
          created_at?: string
          game_type: string
          id?: string
          overall_insight?: string | null
          position?: string | null
          predictions: Json
          stats_snapshot?: Json | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          accuracy_score?: number | null
          actual_result?: number[] | null
          created_at?: string
          game_type?: string
          id?: string
          overall_insight?: string | null
          position?: string | null
          predictions?: Json
          stats_snapshot?: Json | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      api_game_control_audit: {
        Row: {
          action: string
          actor: string | null
          after: Json | null
          before: Json | null
          created_at: string
          id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      api_game_control_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          snapshot: Json
          target_id: string
          target_type: string
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          snapshot: Json
          target_id: string
          target_type: string
          version_number: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          snapshot?: Json
          target_id?: string
          target_type?: string
          version_number?: number
        }
        Relationships: []
      }
      api_game_providers: {
        Row: {
          api_key_encrypted: string | null
          api_url: string | null
          callback_url: string | null
          category: string
          commission_rate: number | null
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number
          id: string
          is_enabled: boolean | null
          is_test_mode: boolean | null
          last_modified_by: string | null
          last_sync_at: string | null
          last_sync_error: string | null
          last_sync_status: string | null
          logo_url: string | null
          maintenance_mode: boolean
          max_bet: number | null
          min_bet: number | null
          provider_code: string
          provider_name: string
          secret_key_encrypted: string | null
          supported_currencies: string[] | null
          updated_at: string
        }
        Insert: {
          api_key_encrypted?: string | null
          api_url?: string | null
          callback_url?: string | null
          category?: string
          commission_rate?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_enabled?: boolean | null
          is_test_mode?: boolean | null
          last_modified_by?: string | null
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          logo_url?: string | null
          maintenance_mode?: boolean
          max_bet?: number | null
          min_bet?: number | null
          provider_code: string
          provider_name: string
          secret_key_encrypted?: string | null
          supported_currencies?: string[] | null
          updated_at?: string
        }
        Update: {
          api_key_encrypted?: string | null
          api_url?: string | null
          callback_url?: string | null
          category?: string
          commission_rate?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_enabled?: boolean | null
          is_test_mode?: boolean | null
          last_modified_by?: string | null
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          logo_url?: string | null
          maintenance_mode?: boolean
          max_bet?: number | null
          min_bet?: number | null
          provider_code?: string
          provider_name?: string
          secret_key_encrypted?: string | null
          supported_currencies?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      api_game_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          balance_before: number | null
          created_at: string
          external_ref: string | null
          game_id: string | null
          id: string
          metadata: Json | null
          provider_id: string
          round_id: string | null
          status: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string
          external_ref?: string | null
          game_id?: string | null
          id?: string
          metadata?: Json | null
          provider_id: string
          round_id?: string | null
          status?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string
          external_ref?: string | null
          game_id?: string | null
          id?: string
          metadata?: Json | null
          provider_id?: string
          round_id?: string | null
          status?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_game_transactions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "api_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_game_transactions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "api_game_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      api_games: {
        Row: {
          agent_only: boolean
          category: string | null
          commission_override: number | null
          created_at: string
          demo_url: string | null
          game_code: string
          game_name: string
          game_type: string | null
          id: string
          is_enabled: boolean | null
          is_featured: boolean | null
          is_new: boolean | null
          launch_url: string | null
          maintenance_mode: boolean
          max_bet: number | null
          metadata: Json | null
          min_bet: number | null
          provider_id: string
          rtp_percent: number | null
          sort_order: number | null
          thumbnail_url: string | null
          updated_at: string
          vip_only: boolean
        }
        Insert: {
          agent_only?: boolean
          category?: string | null
          commission_override?: number | null
          created_at?: string
          demo_url?: string | null
          game_code: string
          game_name: string
          game_type?: string | null
          id?: string
          is_enabled?: boolean | null
          is_featured?: boolean | null
          is_new?: boolean | null
          launch_url?: string | null
          maintenance_mode?: boolean
          max_bet?: number | null
          metadata?: Json | null
          min_bet?: number | null
          provider_id: string
          rtp_percent?: number | null
          sort_order?: number | null
          thumbnail_url?: string | null
          updated_at?: string
          vip_only?: boolean
        }
        Update: {
          agent_only?: boolean
          category?: string | null
          commission_override?: number | null
          created_at?: string
          demo_url?: string | null
          game_code?: string
          game_name?: string
          game_type?: string | null
          id?: string
          is_enabled?: boolean | null
          is_featured?: boolean | null
          is_new?: boolean | null
          launch_url?: string | null
          maintenance_mode?: boolean
          max_bet?: number | null
          metadata?: Json | null
          min_bet?: number | null
          provider_id?: string
          rtp_percent?: number | null
          sort_order?: number | null
          thumbnail_url?: string | null
          updated_at?: string
          vip_only?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "api_games_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "api_game_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      app_settings_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_value: string
          old_value: string | null
          setting_key: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_value: string
          old_value?: string | null
          setting_key: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_value?: string
          old_value?: string | null
          setting_key?: string
        }
        Relationships: []
      }
      auth_error_reports: {
        Row: {
          created_at: string
          diagnostics: Json | null
          email: string
          failure_kind: string | null
          id: string
          message: string
          name: string
          page_url: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          diagnostics?: Json | null
          email: string
          failure_kind?: string | null
          id?: string
          message: string
          name: string
          page_url?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          diagnostics?: Json | null
          email?: string
          failure_kind?: string | null
          id?: string
          message?: string
          name?: string
          page_url?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      aviator_bets: {
        Row: {
          auto_cashout_multiplier: number | null
          balance_after: number | null
          balance_before: number
          bet_amount: number
          cashout_multiplier: number | null
          cashout_time: string | null
          created_at: string
          fee_amount: number | null
          final_amount: number | null
          id: string
          outcome: string | null
          placed_at: string
          round_id: string
          settled_at: string | null
          user_id: string
          win_amount: number | null
        }
        Insert: {
          auto_cashout_multiplier?: number | null
          balance_after?: number | null
          balance_before: number
          bet_amount: number
          cashout_multiplier?: number | null
          cashout_time?: string | null
          created_at?: string
          fee_amount?: number | null
          final_amount?: number | null
          id?: string
          outcome?: string | null
          placed_at?: string
          round_id: string
          settled_at?: string | null
          user_id: string
          win_amount?: number | null
        }
        Update: {
          auto_cashout_multiplier?: number | null
          balance_after?: number | null
          balance_before?: number
          bet_amount?: number
          cashout_multiplier?: number | null
          cashout_time?: string | null
          created_at?: string
          fee_amount?: number | null
          final_amount?: number | null
          id?: string
          outcome?: string | null
          placed_at?: string
          round_id?: string
          settled_at?: string | null
          user_id?: string
          win_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "aviator_bets_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "aviator_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      aviator_rounds: {
        Row: {
          bet_close_time: string
          client_seed: string | null
          crash_multiplier: number
          crashed_at: string | null
          created_at: string
          id: string
          nonce: number
          phase: string
          player_count: number
          round_number: number
          running_start_time: string | null
          seed_hash: string
          server_seed: string
          start_time: string
          status: string
          total_bets: number
          total_payouts: number
        }
        Insert: {
          bet_close_time: string
          client_seed?: string | null
          crash_multiplier: number
          crashed_at?: string | null
          created_at?: string
          id?: string
          nonce?: number
          phase?: string
          player_count?: number
          round_number?: number
          running_start_time?: string | null
          seed_hash: string
          server_seed: string
          start_time?: string
          status?: string
          total_bets?: number
          total_payouts?: number
        }
        Update: {
          bet_close_time?: string
          client_seed?: string | null
          crash_multiplier?: number
          crashed_at?: string | null
          created_at?: string
          id?: string
          nonce?: number
          phase?: string
          player_count?: number
          round_number?: number
          running_start_time?: string | null
          seed_hash?: string
          server_seed?: string
          start_time?: string
          status?: string
          total_bets?: number
          total_payouts?: number
        }
        Relationships: []
      }
      banners: {
        Row: {
          banner_type: string
          click_count: number | null
          created_at: string | null
          created_by: string | null
          display_order: number | null
          end_date: string | null
          id: string
          image_url: string
          is_enabled: boolean | null
          link: string | null
          link_type: string | null
          start_date: string | null
          target_audience: string
          target_countries: string[]
          target_vip_min: number
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          banner_type: string
          click_count?: number | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          image_url: string
          is_enabled?: boolean | null
          link?: string | null
          link_type?: string | null
          start_date?: string | null
          target_audience?: string
          target_countries?: string[]
          target_vip_min?: number
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          banner_type?: string
          click_count?: number | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          image_url?: string
          is_enabled?: boolean | null
          link?: string | null
          link_type?: string | null
          start_date?: string | null
          target_audience?: string
          target_countries?: string[]
          target_vip_min?: number
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      blocked_ips: {
        Row: {
          blocked_by: string | null
          blocked_until: string | null
          created_at: string
          id: string
          ip_address: string
          reason: string | null
        }
        Insert: {
          blocked_by?: string | null
          blocked_until?: string | null
          created_at?: string
          id?: string
          ip_address: string
          reason?: string | null
        }
        Update: {
          blocked_by?: string | null
          blocked_until?: string | null
          created_at?: string
          id?: string
          ip_address?: string
          reason?: string | null
        }
        Relationships: []
      }
      cashback_records: {
        Row: {
          base_cashback: number
          bet_count: number
          claimed_at: string | null
          created_at: string
          expires_at: string | null
          final_cashback: number
          id: string
          net_loss: number
          period_end: string
          period_start: string
          period_type: string
          status: string
          total_bets: number
          total_wins: number
          user_id: string
          vip_level: number
          vip_multiplier: number
        }
        Insert: {
          base_cashback?: number
          bet_count?: number
          claimed_at?: string | null
          created_at?: string
          expires_at?: string | null
          final_cashback?: number
          id?: string
          net_loss?: number
          period_end: string
          period_start: string
          period_type: string
          status?: string
          total_bets?: number
          total_wins?: number
          user_id: string
          vip_level?: number
          vip_multiplier?: number
        }
        Update: {
          base_cashback?: number
          bet_count?: number
          claimed_at?: string | null
          created_at?: string
          expires_at?: string | null
          final_cashback?: number
          id?: string
          net_loss?: number
          period_end?: string
          period_start?: string
          period_type?: string
          status?: string
          total_bets?: number
          total_wins?: number
          user_id?: string
          vip_level?: number
          vip_multiplier?: number
        }
        Relationships: []
      }
      cashback_settings: {
        Row: {
          cashback_percent: number
          created_at: string
          game_rates: Json | null
          id: string
          is_enabled: boolean | null
          max_cashback: number
          min_bets_required: number
          min_loss_amount: number
          period_type: string
          updated_at: string
          vip_multipliers: Json | null
        }
        Insert: {
          cashback_percent?: number
          created_at?: string
          game_rates?: Json | null
          id?: string
          is_enabled?: boolean | null
          max_cashback?: number
          min_bets_required?: number
          min_loss_amount?: number
          period_type?: string
          updated_at?: string
          vip_multipliers?: Json | null
        }
        Update: {
          cashback_percent?: number
          created_at?: string
          game_rates?: Json | null
          id?: string
          is_enabled?: boolean | null
          max_cashback?: number
          min_bets_required?: number
          min_loss_amount?: number
          period_type?: string
          updated_at?: string
          vip_multipliers?: Json | null
        }
        Relationships: []
      }
      challenges: {
        Row: {
          bonus_multiplier: number | null
          category: string
          challenge_type: string
          code: string
          created_at: string
          description: string
          description_bn: string | null
          icon: string
          id: string
          is_active: boolean | null
          name: string
          name_bn: string | null
          requirement_type: string
          requirement_value: number
          reward_amount: number
          sort_order: number | null
        }
        Insert: {
          bonus_multiplier?: number | null
          category?: string
          challenge_type: string
          code: string
          created_at?: string
          description: string
          description_bn?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          name: string
          name_bn?: string | null
          requirement_type: string
          requirement_value?: number
          reward_amount?: number
          sort_order?: number | null
        }
        Update: {
          bonus_multiplier?: number | null
          category?: string
          challenge_type?: string
          code?: string
          created_at?: string
          description?: string
          description_bn?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
          name_bn?: string | null
          requirement_type?: string
          requirement_value?: number
          reward_amount?: number
          sort_order?: number | null
        }
        Relationships: []
      }
      chat_events: {
        Row: {
          chat_id: string
          created_at: string
          event_type: Database["public"]["Enums"]["chat_event_type"]
          id: string
          meta_json: Json | null
        }
        Insert: {
          chat_id: string
          created_at?: string
          event_type: Database["public"]["Enums"]["chat_event_type"]
          id?: string
          meta_json?: Json | null
        }
        Update: {
          chat_id?: string
          created_at?: string
          event_type?: Database["public"]["Enums"]["chat_event_type"]
          id?: string
          meta_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_events_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "support_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachment_url: string | null
          chat_id: string
          created_at: string
          id: string
          message: string
          sender_id: string
          sender_type: Database["public"]["Enums"]["sender_type"]
        }
        Insert: {
          attachment_url?: string | null
          chat_id: string
          created_at?: string
          id?: string
          message: string
          sender_id: string
          sender_type: Database["public"]["Enums"]["sender_type"]
        }
        Update: {
          attachment_url?: string | null
          chat_id?: string
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          sender_type?: Database["public"]["Enums"]["sender_type"]
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "support_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_adjustment_logs: {
        Row: {
          adjusted_by: string
          adjustment_type: string
          agent_user_id: string
          amount: number
          balance_after: number
          balance_before: number
          created_at: string | null
          game_type: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          reason: string
          reference_id: string | null
          source_user_id: string | null
        }
        Insert: {
          adjusted_by: string
          adjustment_type: string
          agent_user_id: string
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string | null
          game_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          reason: string
          reference_id?: string | null
          source_user_id?: string | null
        }
        Update: {
          adjusted_by?: string
          adjustment_type?: string
          agent_user_id?: string
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string | null
          game_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          reason?: string
          reference_id?: string | null
          source_user_id?: string | null
        }
        Relationships: []
      }
      crash_bets: {
        Row: {
          auto_cashout_multiplier: number | null
          balance_after: number | null
          balance_before: number
          bet_amount: number
          cashout_multiplier: number | null
          cashout_time: string | null
          created_at: string
          fee_amount: number | null
          final_amount: number | null
          id: string
          outcome: string | null
          placed_at: string
          round_id: string
          settled_at: string | null
          user_id: string
          win_amount: number | null
        }
        Insert: {
          auto_cashout_multiplier?: number | null
          balance_after?: number | null
          balance_before: number
          bet_amount: number
          cashout_multiplier?: number | null
          cashout_time?: string | null
          created_at?: string
          fee_amount?: number | null
          final_amount?: number | null
          id?: string
          outcome?: string | null
          placed_at?: string
          round_id: string
          settled_at?: string | null
          user_id: string
          win_amount?: number | null
        }
        Update: {
          auto_cashout_multiplier?: number | null
          balance_after?: number | null
          balance_before?: number
          bet_amount?: number
          cashout_multiplier?: number | null
          cashout_time?: string | null
          created_at?: string
          fee_amount?: number | null
          final_amount?: number | null
          id?: string
          outcome?: string | null
          placed_at?: string
          round_id?: string
          settled_at?: string | null
          user_id?: string
          win_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crash_bets_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "crash_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      crash_rounds: {
        Row: {
          bet_close_time: string
          client_seed: string | null
          crash_multiplier: number
          crashed_at: string | null
          created_at: string
          end_time: string | null
          id: string
          locking_end_time: string | null
          next_round_at: string | null
          phase: string
          player_count: number
          round_number: number
          running_start_time: string | null
          seed_hash: string
          server_seed: string | null
          start_time: string
          status: string
          total_bets: number
          total_payouts: number
        }
        Insert: {
          bet_close_time: string
          client_seed?: string | null
          crash_multiplier: number
          crashed_at?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          locking_end_time?: string | null
          next_round_at?: string | null
          phase?: string
          player_count?: number
          round_number: number
          running_start_time?: string | null
          seed_hash: string
          server_seed?: string | null
          start_time: string
          status?: string
          total_bets?: number
          total_payouts?: number
        }
        Update: {
          bet_close_time?: string
          client_seed?: string | null
          crash_multiplier?: number
          crashed_at?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          locking_end_time?: string | null
          next_round_at?: string | null
          phase?: string
          player_count?: number
          round_number?: number
          running_start_time?: string | null
          seed_hash?: string
          server_seed?: string | null
          start_time?: string
          status?: string
          total_bets?: number
          total_payouts?: number
        }
        Relationships: []
      }
      crash_settings: {
        Row: {
          bucket_early_prob: number
          bucket_high_prob: number
          bucket_mid_prob: number
          bucket_ultra_prob: number
          created_at: string
          enabled: boolean
          id: string
          jackpot_chance: number
          jackpot_enabled: boolean
          jackpot_max_multiplier: number
          manual_force_enabled: boolean
          manual_force_value: number | null
          max_bet: number
          max_cap: number
          min_bet: number
          mode: string
          risk_guard_enabled: boolean
          risk_guard_threshold: number
          round_bet_window_seconds: number
          round_duration_max_seconds: number
          round_duration_min_seconds: number
          rtp_target: number
          updated_at: string
        }
        Insert: {
          bucket_early_prob?: number
          bucket_high_prob?: number
          bucket_mid_prob?: number
          bucket_ultra_prob?: number
          created_at?: string
          enabled?: boolean
          id?: string
          jackpot_chance?: number
          jackpot_enabled?: boolean
          jackpot_max_multiplier?: number
          manual_force_enabled?: boolean
          manual_force_value?: number | null
          max_bet?: number
          max_cap?: number
          min_bet?: number
          mode?: string
          risk_guard_enabled?: boolean
          risk_guard_threshold?: number
          round_bet_window_seconds?: number
          round_duration_max_seconds?: number
          round_duration_min_seconds?: number
          rtp_target?: number
          updated_at?: string
        }
        Update: {
          bucket_early_prob?: number
          bucket_high_prob?: number
          bucket_mid_prob?: number
          bucket_ultra_prob?: number
          created_at?: string
          enabled?: boolean
          id?: string
          jackpot_chance?: number
          jackpot_enabled?: boolean
          jackpot_max_multiplier?: number
          manual_force_enabled?: boolean
          manual_force_value?: number | null
          max_bet?: number
          max_cap?: number
          min_bet?: number
          mode?: string
          risk_guard_enabled?: boolean
          risk_guard_threshold?: number
          round_bet_window_seconds?: number
          round_duration_max_seconds?: number
          round_duration_min_seconds?: number
          rtp_target?: number
          updated_at?: string
        }
        Relationships: []
      }
      crypto_deposits: {
        Row: {
          amount: number
          amount_bdt: number | null
          block_timestamp: string | null
          confirmations: number | null
          created_at: string
          credited_at: string | null
          from_address: string
          id: string
          matched_request_id: string | null
          network: string
          raw_json: Json | null
          status: string
          to_address: string
          token: string
          tx_hash: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          amount_bdt?: number | null
          block_timestamp?: string | null
          confirmations?: number | null
          created_at?: string
          credited_at?: string | null
          from_address: string
          id?: string
          matched_request_id?: string | null
          network?: string
          raw_json?: Json | null
          status?: string
          to_address: string
          token?: string
          tx_hash: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          amount_bdt?: number | null
          block_timestamp?: string | null
          confirmations?: number | null
          created_at?: string
          credited_at?: string | null
          from_address?: string
          id?: string
          matched_request_id?: string | null
          network?: string
          raw_json?: Json | null
          status?: string
          to_address?: string
          token?: string
          tx_hash?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      crypto_trading_control_audit: {
        Row: {
          action: string
          actor: string | null
          after: Json | null
          before: Json | null
          control_id: string | null
          created_at: string
          id: string
          symbol: string | null
        }
        Insert: {
          action: string
          actor?: string | null
          after?: Json | null
          before?: Json | null
          control_id?: string | null
          created_at?: string
          id?: string
          symbol?: string | null
        }
        Update: {
          action?: string
          actor?: string | null
          after?: Json | null
          before?: Json | null
          control_id?: string | null
          created_at?: string
          id?: string
          symbol?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crypto_trading_control_audit_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "crypto_trading_controls"
            referencedColumns: ["id"]
          },
        ]
      }
      crypto_trading_control_versions: {
        Row: {
          control_id: string
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          snapshot: Json
          version_number: number
        }
        Insert: {
          control_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          snapshot: Json
          version_number: number
        }
        Update: {
          control_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          snapshot?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "crypto_trading_control_versions_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "crypto_trading_controls"
            referencedColumns: ["id"]
          },
        ]
      }
      crypto_trading_controls: {
        Row: {
          buy_enabled: boolean
          created_at: string
          display_name: string
          display_order: number
          id: string
          is_enabled: boolean
          is_visible: boolean
          logo_url: string | null
          long_enabled: boolean
          loss_pct: number
          maintenance_mode: boolean
          max_trade_amount: number
          min_trade_amount: number
          profit_pct: number
          sell_enabled: boolean
          short_enabled: boolean
          symbol: string
          trading_interval: string
          updated_at: string
        }
        Insert: {
          buy_enabled?: boolean
          created_at?: string
          display_name: string
          display_order?: number
          id?: string
          is_enabled?: boolean
          is_visible?: boolean
          logo_url?: string | null
          long_enabled?: boolean
          loss_pct?: number
          maintenance_mode?: boolean
          max_trade_amount?: number
          min_trade_amount?: number
          profit_pct?: number
          sell_enabled?: boolean
          short_enabled?: boolean
          symbol: string
          trading_interval?: string
          updated_at?: string
        }
        Update: {
          buy_enabled?: boolean
          created_at?: string
          display_name?: string
          display_order?: number
          id?: string
          is_enabled?: boolean
          is_visible?: boolean
          logo_url?: string | null
          long_enabled?: boolean
          loss_pct?: number
          maintenance_mode?: boolean
          max_trade_amount?: number
          min_trade_amount?: number
          profit_pct?: number
          sell_enabled?: boolean
          short_enabled?: boolean
          symbol?: string
          trading_interval?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_game_stats: {
        Row: {
          created_at: string | null
          game_type: string
          id: string
          net_profit: number | null
          stat_date: string
          total_bet_count: number | null
          total_bets: number | null
          total_deposits: number | null
          total_fees: number | null
          total_payouts: number | null
          total_withdrawals: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          game_type: string
          id?: string
          net_profit?: number | null
          stat_date: string
          total_bet_count?: number | null
          total_bets?: number | null
          total_deposits?: number | null
          total_fees?: number | null
          total_payouts?: number | null
          total_withdrawals?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          game_type?: string
          id?: string
          net_profit?: number | null
          stat_date?: string
          total_bet_count?: number | null
          total_bets?: number | null
          total_deposits?: number | null
          total_fees?: number | null
          total_payouts?: number | null
          total_withdrawals?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_login_rewards: {
        Row: {
          claim_date: string
          created_at: string
          id: string
          reward_amount: number
          streak_day: number
          user_id: string
        }
        Insert: {
          claim_date?: string
          created_at?: string
          id?: string
          reward_amount?: number
          streak_day?: number
          user_id: string
        }
        Update: {
          claim_date?: string
          created_at?: string
          id?: string
          reward_amount?: number
          streak_day?: number
          user_id?: string
        }
        Relationships: []
      }
      daily_spin_eligibility: {
        Row: {
          created_at: string
          deposit_amount: number
          deposit_date: string
          id: string
          reward_amount: number | null
          spin_earned: boolean
          spin_used: boolean
          spin_used_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deposit_amount?: number
          deposit_date?: string
          id?: string
          reward_amount?: number | null
          spin_earned?: boolean
          spin_used?: boolean
          spin_used_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deposit_amount?: number
          deposit_date?: string
          id?: string
          reward_amount?: number | null
          spin_earned?: boolean
          spin_used?: boolean
          spin_used_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_trading_bonuses: {
        Row: {
          bonus_amount: number
          bonus_date: string
          bonus_rate: number
          created_at: string
          credited_at: string | null
          game_type: string
          id: string
          is_credited: boolean
          total_bet_amount: number
          user_id: string
          vip_level: number
        }
        Insert: {
          bonus_amount?: number
          bonus_date?: string
          bonus_rate?: number
          created_at?: string
          credited_at?: string | null
          game_type: string
          id?: string
          is_credited?: boolean
          total_bet_amount?: number
          user_id: string
          vip_level?: number
        }
        Update: {
          bonus_amount?: number
          bonus_date?: string
          bonus_rate?: number
          created_at?: string
          credited_at?: string | null
          game_type?: string
          id?: string
          is_credited?: boolean
          total_bet_amount?: number
          user_id?: string
          vip_level?: number
        }
        Relationships: []
      }
      deposit_requests: {
        Row: {
          created_at: string
          deposit_ref: string
          expected_amount: number
          expires_at: string
          id: string
          matched_at: string | null
          matched_tx_hash: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deposit_ref: string
          expected_amount: number
          expires_at: string
          id?: string
          matched_at?: string | null
          matched_tx_hash?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deposit_ref?: string
          expected_amount?: number
          expires_at?: string
          id?: string
          matched_at?: string | null
          matched_tx_hash?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_digest_preferences: {
        Row: {
          created_at: string
          email: string
          escalation_delay_minutes: number
          frequency: string
          id: string
          include_critical_priority: boolean
          include_high_priority: boolean
          include_low_priority: boolean
          include_medium_priority: boolean
          instant_critical_alerts: boolean
          last_sent_at: string | null
          max_escalations: number
          pending_requests_critical_threshold: number
          pending_requests_warning_threshold: number
          preferred_hour: number
          timezone: string
          transaction_critical_threshold: number
          transaction_high_threshold: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          escalation_delay_minutes?: number
          frequency?: string
          id?: string
          include_critical_priority?: boolean
          include_high_priority?: boolean
          include_low_priority?: boolean
          include_medium_priority?: boolean
          instant_critical_alerts?: boolean
          last_sent_at?: string | null
          max_escalations?: number
          pending_requests_critical_threshold?: number
          pending_requests_warning_threshold?: number
          preferred_hour?: number
          timezone?: string
          transaction_critical_threshold?: number
          transaction_high_threshold?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          escalation_delay_minutes?: number
          frequency?: string
          id?: string
          include_critical_priority?: boolean
          include_high_priority?: boolean
          include_low_priority?: boolean
          include_medium_priority?: boolean
          instant_critical_alerts?: boolean
          last_sent_at?: string | null
          max_escalations?: number
          pending_requests_critical_threshold?: number
          pending_requests_warning_threshold?: number
          preferred_hour?: number
          timezone?: string
          transaction_critical_threshold?: number
          transaction_high_threshold?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      fd_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: number
          type: Database["public"]["Enums"]["fd_txn_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: number
          type: Database["public"]["Enums"]["fd_txn_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: number
          type?: Database["public"]["Enums"]["fd_txn_type"]
          user_id?: string
        }
        Relationships: []
      }
      fd_withdrawals: {
        Row: {
          amount: number
          fd_id: number
          final_amount: number
          id: number
          penalty: number
          requested_at: string
          status: Database["public"]["Enums"]["fd_withdrawal_status"]
          type: Database["public"]["Enums"]["fd_withdrawal_type"]
          user_id: string
        }
        Insert: {
          amount: number
          fd_id: number
          final_amount: number
          id?: number
          penalty?: number
          requested_at?: string
          status?: Database["public"]["Enums"]["fd_withdrawal_status"]
          type?: Database["public"]["Enums"]["fd_withdrawal_type"]
          user_id: string
        }
        Update: {
          amount?: number
          fd_id?: number
          final_amount?: number
          id?: number
          penalty?: number
          requested_at?: string
          status?: Database["public"]["Enums"]["fd_withdrawal_status"]
          type?: Database["public"]["Enums"]["fd_withdrawal_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fd_withdrawals_fd_id_fkey"
            columns: ["fd_id"]
            isOneToOne: false
            referencedRelation: "fixed_deposits"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_deposit_plans: {
        Row: {
          allowed_amounts: number[]
          created_at: string
          daily_rate_bps: number
          duration_days: number
          early_penalty_pct: number
          id: string
          is_active: boolean
          max_amount: number | null
          min_amount: number
          name: string
          profit_rate: number
          updated_at: string
        }
        Insert: {
          allowed_amounts?: number[]
          created_at?: string
          daily_rate_bps?: number
          duration_days?: number
          early_penalty_pct?: number
          id?: string
          is_active?: boolean
          max_amount?: number | null
          min_amount?: number
          name: string
          profit_rate?: number
          updated_at?: string
        }
        Update: {
          allowed_amounts?: number[]
          created_at?: string
          daily_rate_bps?: number
          duration_days?: number
          early_penalty_pct?: number
          id?: string
          is_active?: boolean
          max_amount?: number | null
          min_amount?: number
          name?: string
          profit_rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      fixed_deposits: {
        Row: {
          amount: number
          created_at: string
          duration_days: number
          end_date: string
          expected_profit: number
          id: number
          payment_id: string | null
          plan_id: string | null
          profit_rate: number
          start_date: string
          status: Database["public"]["Enums"]["fd_status"]
          total_return: number
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          duration_days: number
          end_date: string
          expected_profit: number
          id?: number
          payment_id?: string | null
          plan_id?: string | null
          profit_rate: number
          start_date?: string
          status?: Database["public"]["Enums"]["fd_status"]
          total_return: number
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          duration_days?: number
          end_date?: string
          expected_profit?: number
          id?: number
          payment_id?: string | null
          plan_id?: string | null
          profit_rate?: number
          start_date?: string
          status?: Database["public"]["Enums"]["fd_status"]
          total_return?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixed_deposits_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_deposits_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "fixed_deposit_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      game_admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          game_type: string | null
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          game_type?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          game_type?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: []
      }
      game_admin_settings: {
        Row: {
          api_market: string
          auto_result_enabled: boolean | null
          created_at: string | null
          game_type: string
          house_edge_percent: number | null
          id: string
          is_enabled: boolean | null
          last_modified_by: string | null
          maintenance_mode: boolean | null
          manual_result_override: boolean | null
          max_bet: number | null
          min_bet: number | null
          result_source: string
          updated_at: string | null
        }
        Insert: {
          api_market?: string
          auto_result_enabled?: boolean | null
          created_at?: string | null
          game_type: string
          house_edge_percent?: number | null
          id?: string
          is_enabled?: boolean | null
          last_modified_by?: string | null
          maintenance_mode?: boolean | null
          manual_result_override?: boolean | null
          max_bet?: number | null
          min_bet?: number | null
          result_source?: string
          updated_at?: string | null
        }
        Update: {
          api_market?: string
          auto_result_enabled?: boolean | null
          created_at?: string | null
          game_type?: string
          house_edge_percent?: number | null
          id?: string
          is_enabled?: boolean | null
          last_modified_by?: string | null
          maintenance_mode?: boolean | null
          manual_result_override?: boolean | null
          max_bet?: number | null
          min_bet?: number | null
          result_source?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      game_bets: {
        Row: {
          bet_amount: number
          bet_type: string
          bet_value: string
          created_at: string
          game_mode: string
          game_type: string
          id: string
          multiplier: number
          payout: number | null
          potential_win: number
          result: string | null
          settled_at: string | null
          status: string
          trade_id: string
          user_id: string
        }
        Insert: {
          bet_amount: number
          bet_type: string
          bet_value: string
          created_at?: string
          game_mode: string
          game_type: string
          id?: string
          multiplier?: number
          payout?: number | null
          potential_win: number
          result?: string | null
          settled_at?: string | null
          status?: string
          trade_id: string
          user_id: string
        }
        Update: {
          bet_amount?: number
          bet_type?: string
          bet_value?: string
          created_at?: string
          game_mode?: string
          game_type?: string
          id?: string
          multiplier?: number
          payout?: number | null
          potential_win?: number
          result?: string | null
          settled_at?: string | null
          status?: string
          trade_id?: string
          user_id?: string
        }
        Relationships: []
      }
      game_callback_logs: {
        Row: {
          action_type: string
          amount: number | null
          created_at: string | null
          currency: string | null
          error_message: string | null
          id: string
          ip_address: string | null
          is_processed: boolean | null
          player_id: string | null
          processed_at: string | null
          provider_code: string
          request_body: Json
          response_body: Json | null
          response_code: number | null
          round_id: string | null
          signature: string | null
          transaction_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          is_processed?: boolean | null
          player_id?: string | null
          processed_at?: string | null
          provider_code: string
          request_body: Json
          response_body?: Json | null
          response_code?: number | null
          round_id?: string | null
          signature?: string | null
          transaction_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          is_processed?: boolean | null
          player_id?: string | null
          processed_at?: string | null
          provider_code?: string
          request_body?: Json
          response_body?: Json | null
          response_code?: number | null
          round_id?: string | null
          signature?: string | null
          transaction_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      game_launch_notifications: {
        Row: {
          category_id: string
          category_name: string
          created_at: string
          id: string
          notified_at: string | null
          user_id: string
        }
        Insert: {
          category_id: string
          category_name: string
          created_at?: string
          id?: string
          notified_at?: string | null
          user_id: string
        }
        Update: {
          category_id?: string
          category_name?: string
          created_at?: string
          id?: string
          notified_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      game_provider_wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          is_active: boolean
          last_synced_at: string | null
          provider_id: string
          provider_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          provider_id: string
          provider_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          provider_id?: string
          provider_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      game_results: {
        Row: {
          created_at: string
          game_type: string
          id: string
          period_number: string
          result_color: string | null
          result_data: Json | null
          result_number: number | null
          result_size: string | null
        }
        Insert: {
          created_at?: string
          game_type: string
          id?: string
          period_number: string
          result_color?: string | null
          result_data?: Json | null
          result_number?: number | null
          result_size?: string | null
        }
        Update: {
          created_at?: string
          game_type?: string
          id?: string
          period_number?: string
          result_color?: string | null
          result_data?: Json | null
          result_number?: number | null
          result_size?: string | null
        }
        Relationships: []
      }
      game_rounds: {
        Row: {
          created_at: string
          game_mode: string
          game_type: string
          id: string
          result: string
          result_color: string | null
          result_source: string
          trade_id: string
        }
        Insert: {
          created_at?: string
          game_mode: string
          game_type: string
          id?: string
          result: string
          result_color?: string | null
          result_source?: string
          trade_id: string
        }
        Update: {
          created_at?: string
          game_mode?: string
          game_type?: string
          id?: string
          result?: string
          result_color?: string | null
          result_source?: string
          trade_id?: string
        }
        Relationships: []
      }
      gift_codes: {
        Row: {
          amount: number
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          is_enabled: boolean
          max_redemptions: number
          per_user_limit: number
          redemption_count: number
          starts_at: string | null
          target_agent_level: number
          target_audience: string
          target_vip_min: number
          updated_at: string
        }
        Insert: {
          amount?: number
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          is_enabled?: boolean
          max_redemptions?: number
          per_user_limit?: number
          redemption_count?: number
          starts_at?: string | null
          target_agent_level?: number
          target_audience?: string
          target_vip_min?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          is_enabled?: boolean
          max_redemptions?: number
          per_user_limit?: number
          redemption_count?: number
          starts_at?: string | null
          target_agent_level?: number
          target_audience?: string
          target_vip_min?: number
          updated_at?: string
        }
        Relationships: []
      }
      hub_challenges: {
        Row: {
          banner_url: string | null
          created_at: string
          criteria: Json
          description: string
          ends_at: string | null
          id: string
          is_active: boolean
          reward_amount: number
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          criteria?: Json
          description?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          reward_amount?: number
          starts_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          criteria?: Json
          description?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          reward_amount?: number
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      hub_events: {
        Row: {
          banner_url: string | null
          created_at: string
          cta_url: string | null
          description: string
          ends_at: string | null
          id: string
          is_active: boolean
          sort_order: number
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          cta_url?: string | null
          description?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          starts_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          cta_url?: string | null
          description?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      hub_tournaments: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string
          ends_at: string | null
          entry_fee: number
          id: string
          is_active: boolean
          prize_pool: number
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string
          ends_at?: string | null
          entry_fee?: number
          id?: string
          is_active?: boolean
          prize_pool?: number
          starts_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string
          ends_at?: string | null
          entry_fee?: number
          id?: string
          is_active?: boolean
          prize_pool?: number
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      investment_levels: {
        Row: {
          id: number
          is_active: boolean
          level_name: string
          max_amount: number
          min_amount: number
        }
        Insert: {
          id?: number
          is_active?: boolean
          level_name: string
          max_amount: number
          min_amount: number
        }
        Update: {
          id?: number
          is_active?: boolean
          level_name?: string
          max_amount?: number
          min_amount?: number
        }
        Relationships: []
      }
      jackpot_campaigns: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string
          ends_at: string
          entry_fee: number
          id: string
          is_active: boolean
          prize_pool: number
          starts_at: string
          status: string
          title: string
          updated_at: string
          winner_prize: number | null
          winner_user_id: string | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string
          ends_at: string
          entry_fee?: number
          id?: string
          is_active?: boolean
          prize_pool?: number
          starts_at?: string
          status?: string
          title: string
          updated_at?: string
          winner_prize?: number | null
          winner_user_id?: string | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string
          ends_at?: string
          entry_fee?: number
          id?: string
          is_active?: boolean
          prize_pool?: number
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
          winner_prize?: number | null
          winner_user_id?: string | null
        }
        Relationships: []
      }
      kyc_submissions: {
        Row: {
          created_at: string
          document_back_url: string | null
          document_front_url: string | null
          document_number: string
          document_type: string
          full_name: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          risk_score: number
          selfie_url: string | null
          status: string
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_back_url?: string | null
          document_front_url?: string | null
          document_number: string
          document_type: string
          full_name: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_score?: number
          selfie_url?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_back_url?: string | null
          document_front_url?: string | null
          document_number?: string
          document_type?: string
          full_name?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_score?: number
          selfie_url?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      login_history: {
        Row: {
          country: string | null
          created_at: string
          device_fingerprint: string | null
          email: string | null
          failure_reason: string | null
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          device_fingerprint?: string | null
          email?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          device_fingerprint?: string | null
          email?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      lucky_draw_rounds: {
        Row: {
          created_at: string
          draw_at: string
          id: string
          is_active: boolean
          max_prize: number
          prize_pool: number
          round_no: number
          status: string
          ticket_price: number
          tickets_sold: number
          total_tickets: number
          updated_at: string
          winner_prize: number | null
          winner_ticket_no: number | null
          winner_user_id: string | null
        }
        Insert: {
          created_at?: string
          draw_at: string
          id?: string
          is_active?: boolean
          max_prize?: number
          prize_pool?: number
          round_no?: number
          status?: string
          ticket_price?: number
          tickets_sold?: number
          total_tickets?: number
          updated_at?: string
          winner_prize?: number | null
          winner_ticket_no?: number | null
          winner_user_id?: string | null
        }
        Update: {
          created_at?: string
          draw_at?: string
          id?: string
          is_active?: boolean
          max_prize?: number
          prize_pool?: number
          round_no?: number
          status?: string
          ticket_price?: number
          tickets_sold?: number
          total_tickets?: number
          updated_at?: string
          winner_prize?: number | null
          winner_ticket_no?: number | null
          winner_user_id?: string | null
        }
        Relationships: []
      }
      lucky_draw_tickets: {
        Row: {
          id: string
          purchased_at: string
          round_id: string
          ticket_no: number
          user_id: string
        }
        Insert: {
          id?: string
          purchased_at?: string
          round_id: string
          ticket_no: number
          user_id: string
        }
        Update: {
          id?: string
          purchased_at?: string
          round_id?: string
          ticket_no?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lucky_draw_tickets_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "lucky_draw_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      lucky_hub_features: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string
          feature_key: string
          id: string
          is_enabled: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string
          feature_key: string
          id?: string
          is_enabled?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string
          feature_key?: string
          id?: string
          is_enabled?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      manual_reward_credits: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          direction: string
          id: string
          metadata: Json
          reason: string | null
          reward_source: string
          staff_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          direction: string
          id?: string
          metadata?: Json
          reason?: string | null
          reward_source?: string
          staff_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          direction?: string
          id?: string
          metadata?: Json
          reason?: string | null
          reward_source?: string
          staff_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mines_admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: []
      }
      mines_rounds: {
        Row: {
          auto_cashout_multiplier: number | null
          bet_amount: number
          client_seed: string | null
          created_at: string
          current_multiplier: number
          difficulty: string
          ended_at: string | null
          final_payout: number | null
          grid_size: number
          id: string
          idempotency_key: string | null
          mine_count: number
          mine_positions: number[]
          net_amount: number | null
          nonce: number
          outcome: string | null
          picked_tiles_sequence: number[] | null
          potential_win: number
          revealed_positions: number[]
          safe_picks: number
          seed_hash: string
          server_seed: string | null
          status: string
          tax_amount: number | null
          user_id: string
        }
        Insert: {
          auto_cashout_multiplier?: number | null
          bet_amount: number
          client_seed?: string | null
          created_at?: string
          current_multiplier?: number
          difficulty?: string
          ended_at?: string | null
          final_payout?: number | null
          grid_size?: number
          id?: string
          idempotency_key?: string | null
          mine_count: number
          mine_positions: number[]
          net_amount?: number | null
          nonce?: number
          outcome?: string | null
          picked_tiles_sequence?: number[] | null
          potential_win?: number
          revealed_positions?: number[]
          safe_picks?: number
          seed_hash: string
          server_seed?: string | null
          status?: string
          tax_amount?: number | null
          user_id: string
        }
        Update: {
          auto_cashout_multiplier?: number | null
          bet_amount?: number
          client_seed?: string | null
          created_at?: string
          current_multiplier?: number
          difficulty?: string
          ended_at?: string | null
          final_payout?: number | null
          grid_size?: number
          id?: string
          idempotency_key?: string | null
          mine_count?: number
          mine_positions?: number[]
          net_amount?: number | null
          nonce?: number
          outcome?: string | null
          picked_tiles_sequence?: number[] | null
          potential_win?: number
          revealed_positions?: number[]
          safe_picks?: number
          seed_hash?: string
          server_seed?: string | null
          status?: string
          tax_amount?: number | null
          user_id?: string
        }
        Relationships: []
      }
      mines_settings: {
        Row: {
          allow_3x3: boolean
          allow_5x5: boolean
          allow_7x7: boolean
          created_at: string
          enabled: boolean
          id: string
          max_bet: number
          max_consecutive_wins: number | null
          max_mines_3x3: number
          max_mines_5x5: number
          max_mines_7x7: number
          max_profit_per_day: number | null
          min_bet: number
          profit_cap_per_round: number
          rtp_target: number
          tax_method: string
          tax_percent: number
          updated_at: string
          vip_instant_level: number
        }
        Insert: {
          allow_3x3?: boolean
          allow_5x5?: boolean
          allow_7x7?: boolean
          created_at?: string
          enabled?: boolean
          id?: string
          max_bet?: number
          max_consecutive_wins?: number | null
          max_mines_3x3?: number
          max_mines_5x5?: number
          max_mines_7x7?: number
          max_profit_per_day?: number | null
          min_bet?: number
          profit_cap_per_round?: number
          rtp_target?: number
          tax_method?: string
          tax_percent?: number
          updated_at?: string
          vip_instant_level?: number
        }
        Update: {
          allow_3x3?: boolean
          allow_5x5?: boolean
          allow_7x7?: boolean
          created_at?: string
          enabled?: boolean
          id?: string
          max_bet?: number
          max_consecutive_wins?: number | null
          max_mines_3x3?: number
          max_mines_5x5?: number
          max_mines_7x7?: number
          max_profit_per_day?: number | null
          min_bet?: number
          profit_cap_per_round?: number
          rtp_target?: number
          tax_method?: string
          tax_percent?: number
          updated_at?: string
          vip_instant_level?: number
        }
        Relationships: []
      }
      mines_streaks: {
        Row: {
          best_streak: number
          created_at: string
          current_streak: number
          id: string
          last_win_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          best_streak?: number
          created_at?: string
          current_streak?: number
          id?: string
          last_win_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          best_streak?: number
          created_at?: string
          current_streak?: number
          id?: string
          last_win_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      minute_stats: {
        Row: {
          bet_count: number | null
          created_at: string | null
          game_type: string | null
          id: string
          minute_ts: string
          net_profit: number | null
          total_bets: number | null
          total_deposits: number | null
          total_fees: number | null
          total_payouts: number | null
          unique_players: number | null
        }
        Insert: {
          bet_count?: number | null
          created_at?: string | null
          game_type?: string | null
          id?: string
          minute_ts: string
          net_profit?: number | null
          total_bets?: number | null
          total_deposits?: number | null
          total_fees?: number | null
          total_payouts?: number | null
          unique_players?: number | null
        }
        Update: {
          bet_count?: number | null
          created_at?: string | null
          game_type?: string | null
          id?: string
          minute_ts?: string
          net_profit?: number | null
          total_bets?: number | null
          total_deposits?: number | null
          total_fees?: number | null
          total_payouts?: number | null
          unique_players?: number | null
        }
        Relationships: []
      }
      mobile_money_transactions: {
        Row: {
          amount: number
          auto_verified: boolean | null
          created_at: string
          failure_reason: string | null
          fee_amount: number
          gateway_type: string
          id: string
          metadata: Json | null
          net_amount: number
          receiver_number: string | null
          reference_id: string
          sender_number: string | null
          status: string
          transaction_id: string | null
          transaction_type: string
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          auto_verified?: boolean | null
          created_at?: string
          failure_reason?: string | null
          fee_amount?: number
          gateway_type: string
          id?: string
          metadata?: Json | null
          net_amount: number
          receiver_number?: string | null
          reference_id: string
          sender_number?: string | null
          status?: string
          transaction_id?: string | null
          transaction_type: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          auto_verified?: boolean | null
          created_at?: string
          failure_reason?: string | null
          fee_amount?: number
          gateway_type?: string
          id?: string
          metadata?: Json | null
          net_amount?: number
          receiver_number?: string | null
          reference_id?: string
          sender_number?: string | null
          status?: string
          transaction_id?: string | null
          transaction_type?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      p2_checkin_claims: {
        Row: {
          claim_date: string
          created_at: string
          day_index: number
          id: string
          reward_amount: number
          streak_at_claim: number
          user_id: string
        }
        Insert: {
          claim_date: string
          created_at?: string
          day_index: number
          id?: string
          reward_amount: number
          streak_at_claim: number
          user_id: string
        }
        Update: {
          claim_date?: string
          created_at?: string
          day_index?: number
          id?: string
          reward_amount?: number
          streak_at_claim?: number
          user_id?: string
        }
        Relationships: []
      }
      p2_checkin_streaks: {
        Row: {
          created_at: string
          current_streak: number
          last_claim_date: string | null
          longest_streak: number
          total_claims: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          last_claim_date?: string | null
          longest_streak?: number
          total_claims?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          last_claim_date?: string | null
          longest_streak?: number
          total_claims?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      p2_spin_spins: {
        Row: {
          created_at: string
          id: string
          reward_amount: number
          reward_label: string
          segment_index: number
          spin_date: string
          user_id: string
          wheel_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reward_amount?: number
          reward_label: string
          segment_index: number
          spin_date?: string
          user_id: string
          wheel_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reward_amount?: number
          reward_label?: string
          segment_index?: number
          spin_date?: string
          user_id?: string
          wheel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "p2_spin_spins_wheel_id_fkey"
            columns: ["wheel_id"]
            isOneToOne: false
            referencedRelation: "p2_spin_wheels"
            referencedColumns: ["id"]
          },
        ]
      }
      p2_spin_wheels: {
        Row: {
          created_at: string
          daily_free_spins: number
          id: string
          is_active: boolean
          name: string
          segments: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_free_spins?: number
          id?: string
          is_active?: boolean
          name: string
          segments: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_free_spins?: number
          id?: string
          is_active?: boolean
          name?: string
          segments?: Json
          updated_at?: string
        }
        Relationships: []
      }
      payment_gateway_config: {
        Row: {
          api_key_encrypted: string | null
          api_secret_encrypted: string | null
          auto_verify_enabled: boolean
          created_at: string
          gateway_type: string
          id: string
          is_enabled: boolean
          max_deposit: number
          max_withdraw: number
          merchant_number: string
          min_deposit: number
          min_withdraw: number
          processing_fee_percent: number
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          auto_verify_enabled?: boolean
          created_at?: string
          gateway_type: string
          id?: string
          is_enabled?: boolean
          max_deposit?: number
          max_withdraw?: number
          merchant_number: string
          min_deposit?: number
          min_withdraw?: number
          processing_fee_percent?: number
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          auto_verify_enabled?: boolean
          created_at?: string
          gateway_type?: string
          id?: string
          is_enabled?: boolean
          max_deposit?: number
          max_withdraw?: number
          merchant_number?: string
          min_deposit?: number
          min_withdraw?: number
          processing_fee_percent?: number
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          admin_id: string | null
          amount: number
          amount_usdt: number | null
          created_at: string
          gateway: string | null
          id: string
          proof_url: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["payment_status"]
          transaction_id: string | null
          txid: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
          wallet_address: string | null
        }
        Insert: {
          admin_id?: string | null
          amount: number
          amount_usdt?: number | null
          created_at?: string
          gateway?: string | null
          id?: string
          proof_url?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_id?: string | null
          txid?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
          wallet_address?: string | null
        }
        Update: {
          admin_id?: string | null
          amount?: number
          amount_usdt?: number | null
          created_at?: string
          gateway?: string | null
          id?: string
          proof_url?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_id?: string | null
          txid?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      payout_queue: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          max_retries: number
          next_retry_at: string | null
          priority: number
          processing_completed_at: string | null
          processing_started_at: string | null
          retry_count: number
          status: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          max_retries?: number
          next_retry_at?: string | null
          priority?: number
          processing_completed_at?: string | null
          processing_started_at?: string | null
          retry_count?: number
          status?: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          max_retries?: number
          next_retry_at?: string | null
          priority?: number
          processing_completed_at?: string | null
          processing_started_at?: string | null
          retry_count?: number
          status?: string
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_queue_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "mobile_money_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_rules: {
        Row: {
          auto_approve: boolean
          created_at: string
          id: string
          is_enabled: boolean
          max_amount: number | null
          min_amount: number | null
          min_user_age_days: number | null
          min_user_deposits: number | null
          priority: number
          require_kyc: boolean | null
          rule_name: string
          updated_at: string
        }
        Insert: {
          auto_approve?: boolean
          created_at?: string
          id?: string
          is_enabled?: boolean
          max_amount?: number | null
          min_amount?: number | null
          min_user_age_days?: number | null
          min_user_deposits?: number | null
          priority?: number
          require_kyc?: boolean | null
          rule_name: string
          updated_at?: string
        }
        Update: {
          auto_approve?: boolean
          created_at?: string
          id?: string
          is_enabled?: boolean
          max_amount?: number | null
          min_amount?: number | null
          min_user_age_days?: number | null
          min_user_deposits?: number | null
          priority?: number
          require_kyc?: boolean | null
          rule_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      player_activity: {
        Row: {
          activity_date: string
          created_at: string
          games_played: number
          id: string
          total_wagered: number
          total_won: number
          user_id: string
        }
        Insert: {
          activity_date?: string
          created_at?: string
          games_played?: number
          id?: string
          total_wagered?: number
          total_won?: number
          user_id: string
        }
        Update: {
          activity_date?: string
          created_at?: string
          games_played?: number
          id?: string
          total_wagered?: number
          total_won?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_risk_level: string
          agent_approved_at: string | null
          agent_code: string | null
          agent_display_id: string | null
          agent_status: Database["public"]["Enums"]["agent_status"] | null
          agent_tier: Database["public"]["Enums"]["agent_tier"] | null
          agl_agent_id: string | null
          agr_referral_id: string | null
          avatar_url: string | null
          created_at: string
          display_referral_id: string | null
          display_user_id: string | null
          glr_referral_id: string
          glu_user_id: string
          hero_banner_url: string | null
          id: string
          is_admin: boolean | null
          is_frozen: boolean | null
          is_suspended: boolean | null
          kyc_verified: boolean
          kyc_verified_at: string | null
          kyc_verified_by: string | null
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          referred_by_glr: string | null
          risk_score: number
          role: string | null
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          updated_at: string
          upline_agent_id: string | null
          user_id: string
          username: string | null
          vip_exp: number
          vip_level: number
        }
        Insert: {
          account_risk_level?: string
          agent_approved_at?: string | null
          agent_code?: string | null
          agent_display_id?: string | null
          agent_status?: Database["public"]["Enums"]["agent_status"] | null
          agent_tier?: Database["public"]["Enums"]["agent_tier"] | null
          agl_agent_id?: string | null
          agr_referral_id?: string | null
          avatar_url?: string | null
          created_at?: string
          display_referral_id?: string | null
          display_user_id?: string | null
          glr_referral_id: string
          glu_user_id: string
          hero_banner_url?: string | null
          id?: string
          is_admin?: boolean | null
          is_frozen?: boolean | null
          is_suspended?: boolean | null
          kyc_verified?: boolean
          kyc_verified_at?: string | null
          kyc_verified_by?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          referred_by_glr?: string | null
          risk_score?: number
          role?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          upline_agent_id?: string | null
          user_id: string
          username?: string | null
          vip_exp?: number
          vip_level?: number
        }
        Update: {
          account_risk_level?: string
          agent_approved_at?: string | null
          agent_code?: string | null
          agent_display_id?: string | null
          agent_status?: Database["public"]["Enums"]["agent_status"] | null
          agent_tier?: Database["public"]["Enums"]["agent_tier"] | null
          agl_agent_id?: string | null
          agr_referral_id?: string | null
          avatar_url?: string | null
          created_at?: string
          display_referral_id?: string | null
          display_user_id?: string | null
          glr_referral_id?: string
          glu_user_id?: string
          hero_banner_url?: string | null
          id?: string
          is_admin?: boolean | null
          is_frozen?: boolean | null
          is_suspended?: boolean | null
          kyc_verified?: boolean
          kyc_verified_at?: string | null
          kyc_verified_by?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          referred_by_glr?: string | null
          risk_score?: number
          role?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          upline_agent_id?: string | null
          user_id?: string
          username?: string | null
          vip_exp?: number
          vip_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profit_settings: {
        Row: {
          duration_days: number
          id: number
          is_active: boolean
          max_rate: number
          min_rate: number
        }
        Insert: {
          duration_days: number
          id?: number
          is_active?: boolean
          max_rate: number
          min_rate: number
        }
        Update: {
          duration_days?: number
          id?: number
          is_active?: boolean
          max_rate?: number
          min_rate?: number
        }
        Relationships: []
      }
      promotions: {
        Row: {
          click_count: number
          created_at: string
          created_by: string | null
          cta_label: string | null
          cta_link: string | null
          description: string | null
          display_order: number
          end_date: string | null
          id: string
          image_url: string | null
          is_enabled: boolean
          metadata: Json
          promo_type: string
          reward_amount: number | null
          start_date: string | null
          target_agent_only: boolean
          target_audience: string
          target_countries: string[]
          target_vip_min: number
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          click_count?: number
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          cta_link?: string | null
          description?: string | null
          display_order?: number
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_enabled?: boolean
          metadata?: Json
          promo_type: string
          reward_amount?: number | null
          start_date?: string | null
          target_agent_only?: boolean
          target_audience?: string
          target_countries?: string[]
          target_vip_min?: number
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          click_count?: number
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          cta_link?: string | null
          description?: string | null
          display_order?: number
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_enabled?: boolean
          metadata?: Json
          promo_type?: string
          reward_amount?: number | null
          start_date?: string | null
          target_agent_only?: boolean
          target_audience?: string
          target_countries?: string[]
          target_vip_min?: number
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      provider_wallets: {
        Row: {
          balance: number
          created_at: string
          in_game: number
          last_provider: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          in_game?: number
          last_provider?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          in_game?: number
          last_provider?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      redeemed_bonus_codes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          reward_amount: number
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          reward_amount: number
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          reward_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      referral_commissions: {
        Row: {
          bet_amount: number
          bet_id: string | null
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          level: number
          referred_user_id: string
          referrer_id: string
        }
        Insert: {
          bet_amount: number
          bet_id?: string | null
          commission_amount: number
          commission_rate?: number
          created_at?: string
          id?: string
          level?: number
          referred_user_id: string
          referrer_id: string
        }
        Update: {
          bet_amount?: number
          bet_id?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          level?: number
          referred_user_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_commissions_bet_id_fkey"
            columns: ["bet_id"]
            isOneToOne: false
            referencedRelation: "game_bets"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_job_logs: {
        Row: {
          error_message: string | null
          executed_at: string
          id: string
          job_name: string
          result: Json | null
          status: string
        }
        Insert: {
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name: string
          result?: Json | null
          status?: string
        }
        Update: {
          error_message?: string | null
          executed_at?: string
          id?: string
          job_name?: string
          result?: Json | null
          status?: string
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          alert_type: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          is_resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          is_resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          is_resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      security_rate_limits: {
        Row: {
          action_count: number
          action_type: string
          created_at: string
          id: string
          user_id: string
          window_start: string
        }
        Insert: {
          action_count?: number
          action_type: string
          created_at?: string
          id?: string
          user_id: string
          window_start?: string
        }
        Update: {
          action_count?: number
          action_type?: string
          created_at?: string
          id?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      sports_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_enabled: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_enabled?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_enabled?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      staff_accounts: {
        Row: {
          created_at: string | null
          created_by: string | null
          display_name: string | null
          email: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          otp_verified_at: string | null
          staff_code: string | null
          staff_role: Database["public"]["Enums"]["staff_role"]
          totp_enabled: boolean
          totp_last_used_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          otp_verified_at?: string | null
          staff_code?: string | null
          staff_role?: Database["public"]["Enums"]["staff_role"]
          totp_enabled?: boolean
          totp_last_used_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          otp_verified_at?: string | null
          staff_code?: string | null
          staff_role?: Database["public"]["Enums"]["staff_role"]
          totp_enabled?: boolean
          totp_last_used_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      staff_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          module: string | null
          new_value: Json | null
          old_value: Json | null
          staff_id: string | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          module?: string | null
          new_value?: Json | null
          old_value?: Json | null
          staff_id?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          module?: string | null
          new_value?: Json | null
          old_value?: Json | null
          staff_id?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_audit_logs_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_game_scopes: {
        Row: {
          can_edit: boolean | null
          can_override: boolean | null
          can_view: boolean | null
          created_at: string | null
          game_scope: Database["public"]["Enums"]["game_scope"]
          id: string
          staff_id: string
        }
        Insert: {
          can_edit?: boolean | null
          can_override?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          game_scope: Database["public"]["Enums"]["game_scope"]
          id?: string
          staff_id: string
        }
        Update: {
          can_edit?: boolean | null
          can_override?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          game_scope?: Database["public"]["Enums"]["game_scope"]
          id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_game_scopes_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission: string
          staff_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission: string
          staff_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_permissions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_totp_secrets: {
        Row: {
          staff_id: string
          totp_secret: string
          updated_at: string
        }
        Insert: {
          staff_id: string
          totp_secret: string
          updated_at?: string
        }
        Update: {
          staff_id?: string
          totp_secret?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_totp_secrets_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "staff_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      support_agents: {
        Row: {
          active_chats: number
          created_at: string
          id: string
          is_online: boolean
          last_assigned_at: string | null
          max_active_chats: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active_chats?: number
          created_at?: string
          id?: string
          is_online?: boolean
          last_assigned_at?: string | null
          max_active_chats?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active_chats?: number
          created_at?: string
          id?: string
          is_online?: boolean
          last_assigned_at?: string | null
          max_active_chats?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_chats: {
        Row: {
          assigned_support_id: string | null
          chat_type: Database["public"]["Enums"]["chat_type"]
          created_at: string
          id: string
          last_message_at: string | null
          priority: Database["public"]["Enums"]["chat_priority"]
          status: Database["public"]["Enums"]["chat_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_support_id?: string | null
          chat_type?: Database["public"]["Enums"]["chat_type"]
          created_at?: string
          id?: string
          last_message_at?: string | null
          priority?: Database["public"]["Enums"]["chat_priority"]
          status?: Database["public"]["Enums"]["chat_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_support_id?: string | null
          chat_type?: Database["public"]["Enums"]["chat_type"]
          created_at?: string
          id?: string
          last_message_at?: string | null
          priority?: Database["public"]["Enums"]["chat_priority"]
          status?: Database["public"]["Enums"]["chat_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tournament_participants: {
        Row: {
          best_win: number
          current_rank: number | null
          games_played: number
          id: string
          joined_at: string
          net_profit: number
          prize_paid_at: string | null
          prize_won: number | null
          score: number
          total_wagered: number
          total_won: number
          tournament_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          best_win?: number
          current_rank?: number | null
          games_played?: number
          id?: string
          joined_at?: string
          net_profit?: number
          prize_paid_at?: string | null
          prize_won?: number | null
          score?: number
          total_wagered?: number
          total_won?: number
          tournament_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          best_win?: number
          current_rank?: number | null
          games_played?: number
          id?: string
          joined_at?: string
          net_profit?: number
          prize_paid_at?: string | null
          prize_won?: number | null
          score?: number
          total_wagered?: number
          total_won?: number
          tournament_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          description_bn: string | null
          end_time: string
          entry_fee: number
          game_type: string
          id: string
          max_participants: number | null
          min_participants: number | null
          name: string
          name_bn: string | null
          prize_distribution: Json | null
          prize_pool: number
          rules: Json | null
          start_time: string
          status: string
          tournament_type: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          description_bn?: string | null
          end_time: string
          entry_fee?: number
          game_type: string
          id?: string
          max_participants?: number | null
          min_participants?: number | null
          name: string
          name_bn?: string | null
          prize_distribution?: Json | null
          prize_pool?: number
          rules?: Json | null
          start_time: string
          status?: string
          tournament_type?: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          description_bn?: string | null
          end_time?: string
          entry_fee?: number
          game_type?: string
          id?: string
          max_participants?: number | null
          min_participants?: number | null
          name?: string
          name_bn?: string | null
          prize_distribution?: Json | null
          prize_pool?: number
          rules?: Json | null
          start_time?: string
          status?: string
          tournament_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      trade_positions: {
        Row: {
          asset_id: string
          close_price: number | null
          closes_at: string
          created_at: string
          direction: string
          duration_sec: number
          forced: boolean
          id: string
          open_price: number
          opens_at: string
          payout_bdt: number | null
          payout_ratio: number
          pnl_bdt: number | null
          result: string | null
          settled_at: string | null
          stake_bdt: number
          stake_usd: number
          status: string
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_id: string
          close_price?: number | null
          closes_at: string
          created_at?: string
          direction: string
          duration_sec: number
          forced?: boolean
          id?: string
          open_price: number
          opens_at?: string
          payout_bdt?: number | null
          payout_ratio?: number
          pnl_bdt?: number | null
          result?: string | null
          settled_at?: string | null
          stake_bdt: number
          stake_usd: number
          status?: string
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_id?: string
          close_price?: number | null
          closes_at?: string
          created_at?: string
          direction?: string
          duration_sec?: number
          forced?: boolean
          id?: string
          open_price?: number
          opens_at?: string
          payout_bdt?: number | null
          payout_ratio?: number
          pnl_bdt?: number | null
          result?: string | null
          settled_at?: string | null
          stake_bdt?: number
          stake_usd?: number
          status?: string
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_positions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "trading_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_assets: {
        Row: {
          base_code: string
          base_price: number | null
          category: string
          created_at: string
          data_source: string
          decimals: number
          display_name: string
          icon_url: string | null
          id: string
          internal_change_24h: number | null
          internal_price: number | null
          is_active: boolean
          is_admin_controlled: boolean
          quote_code: string
          sort_order: number
          source_symbol: string | null
          symbol: string
          updated_at: string
        }
        Insert: {
          base_code: string
          base_price?: number | null
          category: string
          created_at?: string
          data_source: string
          decimals?: number
          display_name: string
          icon_url?: string | null
          id?: string
          internal_change_24h?: number | null
          internal_price?: number | null
          is_active?: boolean
          is_admin_controlled?: boolean
          quote_code?: string
          sort_order?: number
          source_symbol?: string | null
          symbol: string
          updated_at?: string
        }
        Update: {
          base_code?: string
          base_price?: number | null
          category?: string
          created_at?: string
          data_source?: string
          decimals?: number
          display_name?: string
          icon_url?: string | null
          id?: string
          internal_change_24h?: number | null
          internal_price?: number | null
          is_active?: boolean
          is_admin_controlled?: boolean
          quote_code?: string
          sort_order?: number
          source_symbol?: string | null
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      trading_favorites: {
        Row: {
          asset_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trading_favorites_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "trading_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_price_snapshots: {
        Row: {
          asset_id: string
          change_24h: number | null
          fetched_at: string
          high_24h: number | null
          id: string
          low_24h: number | null
          price: number
          source: string
          volume_24h: number | null
        }
        Insert: {
          asset_id: string
          change_24h?: number | null
          fetched_at?: string
          high_24h?: number | null
          id?: string
          low_24h?: number | null
          price: number
          source: string
          volume_24h?: number | null
        }
        Update: {
          asset_id?: string
          change_24h?: number | null
          fetched_at?: string
          high_24h?: number | null
          id?: string
          low_24h?: number | null
          price?: number
          source?: string
          volume_24h?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trading_price_snapshots_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "trading_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          payment_details: Json | null
          payment_method: string | null
          processed_at: string | null
          processed_by: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usdt_deposits: {
        Row: {
          amount_received: number | null
          bonus_amount: number | null
          confirmations: number | null
          created_at: string
          credited_at: string | null
          deposit_address: string
          error_message: string | null
          expected_amount: number
          from_address: string | null
          id: string
          status: string
          to_address: string | null
          token_contract: string | null
          txid: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          amount_received?: number | null
          bonus_amount?: number | null
          confirmations?: number | null
          created_at?: string
          credited_at?: string | null
          deposit_address: string
          error_message?: string | null
          expected_amount: number
          from_address?: string | null
          id?: string
          status?: string
          to_address?: string | null
          token_contract?: string | null
          txid?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          amount_received?: number | null
          bonus_amount?: number | null
          confirmations?: number | null
          created_at?: string
          credited_at?: string | null
          deposit_address?: string
          error_message?: string | null
          expected_amount?: number
          from_address?: string | null
          id?: string
          status?: string
          to_address?: string | null
          token_contract?: string | null
          txid?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      usdt_orders: {
        Row: {
          amount_usdt: number
          confirmed_amount: number | null
          confirmed_at: string | null
          created_at: string
          credited_amount_bdt: number | null
          deposit_address: string | null
          error_message: string | null
          expires_at: string | null
          id: string
          invoice_url: string | null
          merchant_order_id: string
          order_id: string
          status: string
          txid: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_usdt: number
          confirmed_amount?: number | null
          confirmed_at?: string | null
          created_at?: string
          credited_amount_bdt?: number | null
          deposit_address?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          invoice_url?: string | null
          merchant_order_id: string
          order_id: string
          status?: string
          txid?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_usdt?: number
          confirmed_amount?: number | null
          confirmed_at?: string | null
          created_at?: string
          credited_amount_bdt?: number | null
          deposit_address?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          invoice_url?: string | null
          merchant_order_id?: string
          order_id?: string
          status?: string
          txid?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          progress: number | null
          reward_claimed: boolean | null
          reward_claimed_at: string | null
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          progress?: number | null
          reward_claimed?: boolean | null
          reward_claimed_at?: string | null
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          progress?: number | null
          reward_claimed?: boolean | null
          reward_claimed_at?: string | null
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean | null
          period_end: string
          period_start: string
          progress: number | null
          reward_claimed: boolean | null
          reward_claimed_at: string | null
          target_value: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          period_end: string
          period_start: string
          progress?: number | null
          reward_claimed?: boolean | null
          reward_claimed_at?: string | null
          target_value: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          period_end?: string
          period_start?: string
          progress?: number | null
          reward_claimed?: boolean | null
          reward_claimed_at?: string | null
          target_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          browser: string | null
          created_at: string
          device_fingerprint: string
          device_name: string | null
          first_seen_at: string
          id: string
          ip_address: string | null
          is_trusted: boolean
          last_seen_at: string
          os: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_fingerprint: string
          device_name?: string | null
          first_seen_at?: string
          id?: string
          ip_address?: string | null
          is_trusted?: boolean
          last_seen_at?: string
          os?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_fingerprint?: string
          device_name?: string | null
          first_seen_at?: string
          id?: string
          ip_address?: string | null
          is_trusted?: boolean
          last_seen_at?: string
          os?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_mines_nonce: {
        Row: {
          current_nonce: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          current_nonce?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          current_nonce?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_withdrawal_accounts: {
        Row: {
          account_name: string
          account_number: string
          account_type: string
          admin_approval_status: string
          binance_email: string | null
          binance_pay_id: string | null
          created_at: string
          deactivated_at: string | null
          deactivated_by: string | null
          device: string | null
          id: string
          ip_address: unknown
          is_active: boolean
          is_default: boolean | null
          is_locked: boolean
          is_verified: boolean | null
          locked_at: string | null
          method: string | null
          network: string | null
          provider: string | null
          updated_at: string
          usdt_address: string | null
          usdt_network: string | null
          user_agent: string | null
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          account_name: string
          account_number: string
          account_type: string
          admin_approval_status?: string
          binance_email?: string | null
          binance_pay_id?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          device?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean
          is_default?: boolean | null
          is_locked?: boolean
          is_verified?: boolean | null
          locked_at?: string | null
          method?: string | null
          network?: string | null
          provider?: string | null
          updated_at?: string
          usdt_address?: string | null
          usdt_network?: string | null
          user_agent?: string | null
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string
          account_type?: string
          admin_approval_status?: string
          binance_email?: string | null
          binance_pay_id?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          device?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean
          is_default?: boolean | null
          is_locked?: boolean
          is_verified?: boolean | null
          locked_at?: string | null
          method?: string | null
          network?: string | null
          provider?: string | null
          updated_at?: string
          usdt_address?: string | null
          usdt_network?: string | null
          user_agent?: string | null
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      vip_level_history: {
        Row: {
          created_at: string
          exp_at_change: number
          id: string
          new_level: number
          old_level: number
          user_id: string
        }
        Insert: {
          created_at?: string
          exp_at_change: number
          id?: string
          new_level: number
          old_level: number
          user_id: string
        }
        Update: {
          created_at?: string
          exp_at_change?: number
          id?: string
          new_level?: number
          old_level?: number
          user_id?: string
        }
        Relationships: []
      }
      vip_reward_claims: {
        Row: {
          amount: number
          claim_month: string | null
          created_at: string
          id: string
          reward_type: string
          user_id: string
          vip_level: number
        }
        Insert: {
          amount?: number
          claim_month?: string | null
          created_at?: string
          id?: string
          reward_type: string
          user_id: string
          vip_level: number
        }
        Update: {
          amount?: number
          claim_month?: string | null
          created_at?: string
          id?: string
          reward_type?: string
          user_id?: string
          vip_level?: number
        }
        Relationships: []
      }
      vip_tier_benefits: {
        Row: {
          anniversary_bonus: number
          birthday_bonus: number
          cashback_rate: number
          deposit_bonus_rate: number
          events_access: boolean
          monthly_bonus: number
          updated_at: string
          vip_level: number
          withdraw_limit: number
        }
        Insert: {
          anniversary_bonus?: number
          birthday_bonus?: number
          cashback_rate?: number
          deposit_bonus_rate?: number
          events_access?: boolean
          monthly_bonus?: number
          updated_at?: string
          vip_level: number
          withdraw_limit?: number
        }
        Update: {
          anniversary_bonus?: number
          birthday_bonus?: number
          cashback_rate?: number
          deposit_bonus_rate?: number
          events_access?: boolean
          monthly_bonus?: number
          updated_at?: string
          vip_level?: number
          withdraw_limit?: number
        }
        Relationships: []
      }
      vip_trading_bonus_rates: {
        Row: {
          bonus_rate: number
          created_at: string
          id: string
          min_daily_bet: number
          updated_at: string
          vip_level: number
        }
        Insert: {
          bonus_rate?: number
          created_at?: string
          id?: string
          min_daily_bet?: number
          updated_at?: string
          vip_level: number
        }
        Update: {
          bonus_rate?: number
          created_at?: string
          id?: string
          min_daily_bet?: number
          updated_at?: string
          vip_level?: number
        }
        Relationships: []
      }
      wallet_audit_log: {
        Row: {
          change_amount: number
          change_reason: string | null
          change_source: string
          changed_by: string | null
          created_at: string
          id: string
          ip_address: string | null
          new_balance: number
          old_balance: number
          user_id: string
        }
        Insert: {
          change_amount?: number
          change_reason?: string | null
          change_source?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_balance?: number
          old_balance?: number
          user_id: string
        }
        Update: {
          change_amount?: number
          change_reason?: string | null
          change_source?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_balance?: number
          old_balance?: number
          user_id?: string
        }
        Relationships: []
      }
      wallet_events: {
        Row: {
          amount: number | null
          balance_after: number | null
          balance_before: number | null
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          reference_id: string | null
          reference_type: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wallet_ledger: {
        Row: {
          agent_user_id: string | null
          amount: number
          balance_after: number
          balance_before: number
          created_at: string | null
          currency: string | null
          fee: number | null
          game_type: string | null
          id: string
          ledger_type: Database["public"]["Enums"]["ledger_type"]
          meta: Json | null
          net_amount: number
          reference_id: string | null
          trade_id: string | null
          user_id: string
        }
        Insert: {
          agent_user_id?: string | null
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string | null
          currency?: string | null
          fee?: number | null
          game_type?: string | null
          id?: string
          ledger_type: Database["public"]["Enums"]["ledger_type"]
          meta?: Json | null
          net_amount: number
          reference_id?: string | null
          trade_id?: string | null
          user_id: string
        }
        Update: {
          agent_user_id?: string | null
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string | null
          currency?: string | null
          fee?: number | null
          game_type?: string | null
          id?: string
          ledger_type?: Database["public"]["Enums"]["ledger_type"]
          meta?: Json | null
          net_amount?: number
          reference_id?: string | null
          trade_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wallet_settings: {
        Row: {
          created_at: string
          id: number
          updated_at: string
          updated_by: string | null
          usdt_bdt_rate: number
        }
        Insert: {
          created_at?: string
          id?: number
          updated_at?: string
          updated_by?: string | null
          usdt_bdt_rate?: number
        }
        Update: {
          created_at?: string
          id?: number
          updated_at?: string
          updated_by?: string | null
          usdt_bdt_rate?: number
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number | null
          created_at: string
          description: string | null
          game_name: string | null
          game_type: string | null
          id: string
          trade_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before?: number | null
          created_at?: string
          description?: string | null
          game_name?: string | null
          game_type?: string | null
          id?: string
          trade_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number | null
          created_at?: string
          description?: string | null
          game_name?: string | null
          game_type?: string | null
          id?: string
          trade_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transfers: {
        Row: {
          amount: number
          created_at: string
          from_wallet: string
          id: string
          status: string
          to_wallet: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          from_wallet: string
          id?: string
          status?: string
          to_wallet: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          from_wallet?: string
          id?: string
          status?: string
          to_wallet?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transfers_v2: {
        Row: {
          amount_bdt: number
          amount_usdt: number
          balance_after: Json
          balance_before: Json
          created_at: string
          currency: string
          device: string | null
          direction: string
          error_message: string | null
          from_wallet: string
          id: string
          ip: unknown
          provider_code: string | null
          rate_used: number | null
          reference_id: string
          status: string
          to_wallet: string
          user_id: string
        }
        Insert: {
          amount_bdt?: number
          amount_usdt?: number
          balance_after?: Json
          balance_before?: Json
          created_at?: string
          currency: string
          device?: string | null
          direction: string
          error_message?: string | null
          from_wallet: string
          id?: string
          ip?: unknown
          provider_code?: string | null
          rate_used?: number | null
          reference_id: string
          status?: string
          to_wallet: string
          user_id: string
        }
        Update: {
          amount_bdt?: number
          amount_usdt?: number
          balance_after?: Json
          balance_before?: Json
          created_at?: string
          currency?: string
          device?: string | null
          direction?: string
          error_message?: string | null
          from_wallet?: string
          id?: string
          ip?: unknown
          provider_code?: string | null
          rate_used?: number | null
          reference_id?: string
          status?: string
          to_wallet?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          balance_usdt: number
          bonus_balance: number
          commission_balance: number | null
          created_at: string
          id: string
          total_bet: number
          total_commission_earned: number | null
          total_deposit: number
          total_topups_sent: number | null
          total_win: number
          total_withdraw: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          balance_usdt?: number
          bonus_balance?: number
          commission_balance?: number | null
          created_at?: string
          id?: string
          total_bet?: number
          total_commission_earned?: number | null
          total_deposit?: number
          total_topups_sent?: number | null
          total_win?: number
          total_withdraw?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          balance_usdt?: number
          bonus_balance?: number
          commission_balance?: number | null
          created_at?: string
          id?: string
          total_bet?: number
          total_commission_earned?: number | null
          total_deposit?: number
          total_topups_sent?: number | null
          total_win?: number
          total_withdraw?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      welcome_banner_settings: {
        Row: {
          duration_seconds: number | null
          id: string
          image_url: string | null
          is_enabled: boolean | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          duration_seconds?: number | null
          id?: string
          image_url?: string | null
          is_enabled?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          duration_seconds?: number | null
          id?: string
          image_url?: string | null
          is_enabled?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      wingo_api_diagnostics: {
        Row: {
          created_at: string
          endpoint: string
          error_reason: string | null
          id: string
          latency_ms: number
          market: string | null
          status_code: number | null
          success: boolean
        }
        Insert: {
          created_at?: string
          endpoint: string
          error_reason?: string | null
          id?: string
          latency_ms: number
          market?: string | null
          status_code?: number | null
          success: boolean
        }
        Update: {
          created_at?: string
          endpoint?: string
          error_reason?: string | null
          id?: string
          latency_ms?: number
          market?: string | null
          status_code?: number | null
          success?: boolean
        }
        Relationships: []
      }
      withdrawal_account_change_requests: {
        Row: {
          account_id: string
          admin_id: string | null
          admin_note: string | null
          created_at: string
          decided_at: string | null
          id: string
          ip_address: unknown
          method: string
          new_value: Json
          old_value: Json
          reason: string
          status: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          admin_id?: string | null
          admin_note?: string | null
          created_at?: string
          decided_at?: string | null
          id?: string
          ip_address?: unknown
          method: string
          new_value: Json
          old_value: Json
          reason: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          admin_id?: string | null
          admin_note?: string | null
          created_at?: string
          decided_at?: string | null
          id?: string
          ip_address?: unknown
          method?: string
          new_value?: Json
          old_value?: Json
          reason?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_account_change_requests_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_withdrawal_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_account_history: {
        Row: {
          account_id: string | null
          action: string
          admin_name: string | null
          created_at: string
          id: string
          ip_address: unknown
          method: string
          new_value: Json | null
          old_value: Json | null
          performed_by: string | null
          reason: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          action: string
          admin_name?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          method: string
          new_value?: Json | null
          old_value?: Json | null
          performed_by?: string | null
          reason?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          action?: string
          admin_name?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          method?: string
          new_value?: Json | null
          old_value?: Json | null
          performed_by?: string | null
          reason?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_account_history_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "user_withdrawal_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      agent_earnings_by_game: {
        Row: {
          agent_display_id: string | null
          agent_tier: Database["public"]["Enums"]["agent_tier"] | null
          agent_user_id: string | null
          betting_commission: number | null
          deposit_commission: number | null
          game_type: string | null
          total_commission: number | null
          transaction_count: number | null
          username: string | null
        }
        Relationships: []
      }
      agent_referred_users_safe: {
        Row: {
          agent_user_id: string | null
          team_volume: number | null
          total_commission_from_user: number | null
          total_deposit: number | null
          total_wager: number | null
          total_withdraw: number | null
          user_display_id: string | null
          user_id: string | null
          username: string | null
        }
        Relationships: []
      }
      leaderboard_stats: {
        Row: {
          avatar_url: string | null
          balance: number | null
          created_at: string | null
          display_name: string | null
          profile_id: string | null
          total_bet: number | null
          total_win: number | null
          vip_level: number | null
        }
        Relationships: []
      }
      referral_tree: {
        Row: {
          level: number | null
          referred_at: string | null
          referred_profile_id: string | null
          referred_user_id: string | null
          referrer_profile_id: string | null
          referrer_user_id: string | null
        }
        Relationships: []
      }
      tournament_leaderboard: {
        Row: {
          avatar_url: string | null
          best_win: number | null
          games_played: number | null
          id: string | null
          joined_at: string | null
          net_profit: number | null
          prize_won: number | null
          rank: number | null
          score: number | null
          total_wagered: number | null
          total_won: number | null
          tournament_id: string | null
          user_id: string | null
          username: string | null
          vip_level: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_active_players: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          user_id: string | null
          vip_level: number | null
          weekly_games: number | null
          weekly_wagered: number | null
          weekly_won: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _random_ref_code: { Args: { p_len?: number }; Returns: string }
      admin_adjust_commission: {
        Args: {
          p_adjustment_type: string
          p_agent_user_id: string
          p_amount: number
          p_reason: string
          p_reference_id?: string
        }
        Returns: string
      }
      admin_block_ip: {
        Args: { p_hours: number; p_ip: string; p_reason: string }
        Returns: string
      }
      admin_bulk_adjust_prices: {
        Args: { p_action: string; p_value?: number }
        Returns: Json
      }
      admin_cms_rollback_section: {
        Args: { p_section_id: string; p_version_number: number }
        Returns: boolean
      }
      admin_cms_snapshot_section: {
        Args: { p_note?: string; p_section_id: string }
        Returns: string
      }
      admin_credit_deposit: {
        Args: {
          p_amount: number
          p_deposit_id?: string
          p_payment_method: string
          p_user_id: string
        }
        Returns: Json
      }
      admin_db_health: { Args: never; Returns: Json }
      admin_db_policies: {
        Args: never
        Returns: {
          command: string
          permissive: string
          policy_name: string
          qual: string
          roles: string[]
          table_name: string
          with_check: string
        }[]
      }
      admin_db_run_select: {
        Args: { p_limit?: number; p_sql: string }
        Returns: Json
      }
      admin_db_table_columns: {
        Args: { p_table: string }
        Returns: {
          column_default: string
          column_name: string
          data_type: string
          is_nullable: string
        }[]
      }
      admin_db_table_stats: {
        Args: never
        Returns: {
          dead_rows: number
          index_size: string
          live_rows: number
          row_estimate: number
          table_name: string
          total_size: string
        }[]
      }
      admin_delete_banner: { Args: { p_id: string }; Returns: undefined }
      admin_delete_commission: { Args: { p_id: string }; Returns: undefined }
      admin_delete_gift_code: { Args: { p_id: string }; Returns: Json }
      admin_delete_kyc: { Args: { p_id: string }; Returns: Json }
      admin_delete_promotion: { Args: { p_id: string }; Returns: undefined }
      admin_get_agent_commission_summary: {
        Args: {
          p_agent_uid?: string
          p_from?: string
          p_status?: string
          p_tier?: string
          p_to?: string
        }
        Returns: {
          agent_display_id: string
          agent_name: string
          agent_tier: string
          agent_user_id: string
          pending_commission: number
          team_deposit: number
          team_users: number
          team_wager: number
          today_commission: number
          total_commission: number
          withdrawn_commission: number
        }[]
      }
      admin_get_daily_settlement: {
        Args: { p_days?: number }
        Returns: {
          agents: number
          entries: number
          pending_amount: number
          released_amount: number
          settlement_date: string
          total_amount: number
          window_end: string
          window_start: string
        }[]
      }
      admin_has_valid_otp_session: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      admin_lock_account: {
        Args: { p_email: string; p_hours: number; p_reason: string }
        Returns: string
      }
      admin_manual_reward_adjust: {
        Args: {
          p_amount: number
          p_direction: string
          p_reason?: string
          p_reward_source?: string
          p_user_id: string
        }
        Returns: Json
      }
      admin_resolve_security_alert: {
        Args: { p_alert_id: string; p_note?: string }
        Returns: undefined
      }
      admin_review_kyc: {
        Args: {
          p_id: string
          p_rejection_reason?: string
          p_risk_score?: number
          p_status: string
        }
        Returns: Json
      }
      admin_set_commission_status: {
        Args: { p_id: string; p_status: string }
        Returns: undefined
      }
      admin_set_internal_asset_price: {
        Args: { p_change_24h?: number; p_price: number; p_symbol: string }
        Returns: Json
      }
      admin_set_usdt_rate: { Args: { p_new_rate: number }; Returns: Json }
      admin_toggle_banner: {
        Args: { p_enabled: boolean; p_id: string }
        Returns: undefined
      }
      admin_toggle_gift_code: {
        Args: { p_enabled: boolean; p_id: string }
        Returns: Json
      }
      admin_toggle_promotion: {
        Args: { p_enabled: boolean; p_id: string }
        Returns: undefined
      }
      admin_unlock_account: { Args: { p_email: string }; Returns: number }
      admin_unlock_withdrawal_account: {
        Args: { p_account_id: string; p_reason: string }
        Returns: Json
      }
      admin_update_commission_status: {
        Args: { p_id: string; p_is_credited: boolean }
        Returns: undefined
      }
      admin_upsert_banner: { Args: { p_data: Json }; Returns: string }
      admin_upsert_promotion: { Args: { p_data: Json }; Returns: string }
      agent_topup_transfer_atomic: {
        Args: {
          p_agent_user_id: string
          p_amount: number
          p_reference_id: string
          p_target_user_id: string
        }
        Returns: Json
      }
      agent_transfer_to_user:
        | {
            Args: {
              p_amount: number
              p_client_ref?: string
              p_note?: string
              p_recipient_identifier: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_amount: number
              p_note?: string
              p_referred_user_id: string
            }
            Returns: Json
          }
      agent_withdraw_commission: { Args: never; Returns: number }
      api_game_rollback: {
        Args: { p_id: string; p_type: string; p_version: number }
        Returns: undefined
      }
      api_game_snapshot: {
        Args: { p_id: string; p_note?: string; p_type: string }
        Returns: number
      }
      approve_fd_withdrawal: {
        Args: { p_withdrawal_id: number }
        Returns: undefined
      }
      approve_usdt_payment: {
        Args: {
          p_duration_days?: number
          p_payment_id: string
          p_profit_rate?: number
        }
        Returns: Json
      }
      assign_super_admin_by_email: { Args: { p_email: string }; Returns: Json }
      assign_super_admin_ids: { Args: { p_user_id: string }; Returns: Json }
      aviator_cashout_atomic: {
        Args: { p_bet_id: string; p_multiplier: number; p_user_id: string }
        Returns: Json
      }
      buy_lucky_draw_ticket: {
        Args: { p_round_id: string }
        Returns: {
          prize_pool: number
          ticket_no: number
          tickets_sold: number
        }[]
      }
      calculate_daily_trading_bonus: {
        Args: { p_target_date?: string }
        Returns: Json
      }
      check_payout_eligibility: {
        Args: { p_amount: number; p_user_id: string }
        Returns: {
          auto_approve: boolean
          eligible: boolean
          message: string
          rule_id: string
        }[]
      }
      check_rate_limit: {
        Args: {
          p_action: string
          p_max_count: number
          p_user_id: string
          p_window_minutes: number
        }
        Returns: boolean
      }
      check_reward_rate_limit: {
        Args: {
          p_max_per_day?: number
          p_reward_type: string
          p_user_id: string
        }
        Returns: boolean
      }
      check_staff_access: {
        Args: never
        Returns: {
          display_name: string
          is_staff: boolean
          staff_code: string
          staff_role: string
        }[]
      }
      cleanup_expired_admin_locks: { Args: never; Returns: undefined }
      cleanup_expired_admin_otps: { Args: never; Returns: undefined }
      cleanup_expired_otp_challenges: { Args: never; Returns: undefined }
      cleanup_expired_otp_sessions: { Args: never; Returns: undefined }
      close_support_chat: {
        Args: { p_chat_id: string; p_reason?: string }
        Returns: Json
      }
      create_fixed_deposit: {
        Args: { p_amount: number; p_plan_id: string }
        Returns: number
      }
      create_fixed_deposit_secure: {
        Args: { p_amount: number; p_plan_id: string }
        Returns: number
      }
      create_pending_payment: {
        Args: {
          p_amount: number
          p_gateway?: string
          p_gateway_base_url?: string
        }
        Returns: Json
      }
      credit_deposit_atomic: {
        Args: {
          p_amount: number
          p_payment_method?: string
          p_reference_id?: string
          p_user_id: string
        }
        Returns: Json
      }
      credit_reward: {
        Args: {
          p_amount: number
          p_reason?: string
          p_reward_type: string
          p_user_id: string
        }
        Returns: Json
      }
      crypto_control_rollback: {
        Args: { p_control_id: string; p_version: number }
        Returns: undefined
      }
      crypto_control_snapshot: {
        Args: { p_control_id: string; p_note?: string }
        Returns: number
      }
      decide_withdrawal_account_change: {
        Args: {
          p_admin_note?: string
          p_decision: string
          p_request_id: string
        }
        Returns: Json
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_agent_code: { Args: never; Returns: string }
      generate_agent_display_id: {
        Args: { tier_name: string }
        Returns: string
      }
      generate_agent_referral_code: { Args: never; Returns: string }
      generate_deposit_ref: { Args: never; Returns: string }
      generate_display_referral_id: { Args: never; Returns: string }
      generate_glu_user_id: { Args: never; Returns: string }
      generate_payment_ref: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      get_admin_agent_metrics: { Args: never; Returns: Json }
      get_admin_dashboard_overview: { Args: never; Returns: Json }
      get_admin_deposit_metrics: { Args: never; Returns: Json }
      get_admin_finance_metrics: { Args: never; Returns: Json }
      get_admin_user_metrics: { Args: never; Returns: Json }
      get_admin_wallet_overview: { Args: never; Returns: Json }
      get_admin_withdrawal_metrics: { Args: never; Returns: Json }
      get_agent_tier_config: {
        Args: { tier: Database["public"]["Enums"]["agent_tier"] }
        Returns: {
          betting_commission_rate: number
          deposit_commission_rate: number
          min_deposit: number
        }[]
      }
      get_available_support_agent: { Args: never; Returns: string }
      get_mines_round_positions: {
        Args: { p_round_id: string }
        Returns: number[]
      }
      get_otp_session_status: {
        Args: { p_user_id: string }
        Returns: {
          admin_route_allowed: boolean
          expires_at: string
          is_verified: boolean
          session_exists: boolean
        }[]
      }
      get_referral_stats: {
        Args: { p_user_id: string }
        Returns: {
          deposited_count: number
          level: number
          total_bet: number
          total_commission: number
          total_deposit: number
          total_referrals: number
        }[]
      }
      get_staff_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["staff_role"]
      }
      get_staff_totp_secret: { Args: { _staff_id: string }; Returns: string }
      get_usdt_rate: { Args: never; Returns: number }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["admin_role"][]
      }
      has_admin_role: {
        Args: {
          _role: Database["public"]["Enums"]["admin_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_game_scope: {
        Args: { _access_type?: string; _game: string; _user_id: string }
        Returns: boolean
      }
      has_staff_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_valid_otp_session: { Args: { p_user_id: string }; Returns: boolean }
      invoke_salary_calculation: { Args: never; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      is_admin_account_locked: { Args: { p_email: string }; Returns: boolean }
      is_admin_user: { Args: { _user_id: string }; Returns: boolean }
      is_any_admin: { Args: { _user_id: string }; Returns: boolean }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      is_staff:
        | { Args: never; Returns: boolean }
        | { Args: { _user_id: string }; Returns: boolean }
      list_agent_users: {
        Args: never
        Returns: {
          commission_from_user: number
          last_activity_at: string
          registered_at: string
          status: string
          team_volume: number
          total_deposit: number
          total_withdraw: number
          uid: string
          user_id: string
          username: string
        }[]
      }
      log_salary_calculation: { Args: never; Returns: undefined }
      log_staff_action: {
        Args: {
          p_action: string
          p_module: string
          p_new: Json
          p_old: Json
          p_target_id: string
          p_target_type: string
        }
        Returns: undefined
      }
      log_wallet_event: {
        Args: {
          p_amount?: number
          p_balance_after?: number
          p_balance_before?: number
          p_event_type: string
          p_metadata?: Json
          p_reference_id?: string
          p_reference_type?: string
          p_user_id: string
        }
        Returns: string
      }
      lookup_profile_by_referral_code: {
        Args: { p_referral_code: string }
        Returns: {
          display_referral_id: string
          profile_id: string
          referral_code: string
        }[]
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      next_agl_agent_id: { Args: never; Returns: string }
      next_agr_referral_id: { Args: never; Returns: string }
      next_glr_referral_id: { Args: never; Returns: string }
      next_glu_user_id: { Args: never; Returns: string }
      open_trade_position: {
        Args: {
          p_asset_id: string
          p_direction: string
          p_duration_sec: number
          p_stake_bdt: number
        }
        Returns: Json
      }
      p2_claim_checkin: { Args: never; Returns: Json }
      p2_execute_spin: { Args: { p_wheel_id: string }; Returns: Json }
      place_aviator_bet_atomic: {
        Args: {
          p_auto_cashout?: number
          p_bet_amount: number
          p_round_id: string
          p_user_id: string
        }
        Returns: Json
      }
      place_bet_atomic: {
        Args: {
          p_bet_amount: number
          p_bet_type: string
          p_bet_value: string
          p_game_mode: string
          p_game_type: string
          p_multiplier: number
          p_potential_win: number
          p_trade_id: string
          p_user_id: string
        }
        Returns: Json
      }
      process_game_callback: {
        Args: {
          p_action_type: string
          p_amount: number
          p_currency?: string
          p_player_id: string
          p_provider_code: string
          p_round_id: string
          p_transaction_id: string
          p_user_id: string
        }
        Returns: Json
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      reject_usdt_payment: {
        Args: { p_payment_id: string; p_reason?: string }
        Returns: Json
      }
      request_fd_withdrawal: {
        Args: { p_fd_id: number }
        Returns: {
          amount: number
          fd_id: number
          final_amount: number
          id: number
          penalty: number
          requested_at: string
          status: Database["public"]["Enums"]["fd_withdrawal_status"]
          type: Database["public"]["Enums"]["fd_withdrawal_type"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "fd_withdrawals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      request_fd_withdrawal_secure: {
        Args: { p_deposit_id: number; p_early?: boolean }
        Returns: number
      }
      request_withdrawal_account_change: {
        Args: {
          p_account_id: string
          p_ip?: unknown
          p_new_value: Json
          p_reason: string
          p_user_agent?: string
        }
        Returns: Json
      }
      save_withdrawal_account: {
        Args: {
          p_account_name?: string
          p_account_number?: string
          p_binance_email?: string
          p_binance_pay_id?: string
          p_device?: string
          p_ip?: unknown
          p_method: string
          p_network?: string
          p_provider?: string
          p_user_agent?: string
          p_wallet_address?: string
        }
        Returns: Json
      }
      secure_add_winnings: {
        Args: {
          p_amount: number
          p_game_type: string
          p_trade_id: string
          p_user_id: string
        }
        Returns: Json
      }
      secure_deduct_bet: {
        Args: {
          p_amount: number
          p_game_type: string
          p_trade_id: string
          p_user_id: string
        }
        Returns: Json
      }
      set_staff_totp_secret: {
        Args: { _secret: string; _staff_id: string }
        Returns: undefined
      }
      settle_bet_atomic: {
        Args: {
          p_game_type: string
          p_result: string
          p_trade_id: string
          p_user_id: string
          p_win_amount: number
        }
        Returns: Json
      }
      settle_daily_commissions: { Args: never; Returns: Json }
      settle_payment_and_create_fd: {
        Args: {
          p_duration_days?: number
          p_payment_id: string
          p_profit_rate?: number
          p_transaction_id: string
        }
        Returns: Json
      }
      settle_trade_position: { Args: { p_position_id: string }; Returns: Json }
      submit_usdt_deposit: {
        Args: {
          p_amount_usdt: number
          p_proof_url?: string
          p_txid: string
          p_wallet_address: string
        }
        Returns: Json
      }
      super_admin_agent_action: {
        Args: {
          p_action: string
          p_actor_user_id: string
          p_reason: string
          p_target_user_id: string
        }
        Returns: Json
      }
      super_admin_balance_adjust: {
        Args: {
          p_actor_user_id: string
          p_amount: number
          p_direction: string
          p_reason: string
          p_target_user_id: string
          p_wallet: string
        }
        Returns: Json
      }
      take_support_chat: { Args: { p_chat_id: string }; Returns: Json }
      toggle_support_agent_online: {
        Args: { p_is_online: boolean }
        Returns: Json
      }
      update_agent_referral_stats: {
        Args: {
          p_amount: number
          p_referred_user_id: string
          p_stat_type: string
        }
        Returns: undefined
      }
      update_usdt_rate: { Args: { p_rate: number }; Returns: Json }
      user_transfer_to_user_atomic: {
        Args: { p_amount: number; p_note?: string; p_recipient_id: string }
        Returns: Json
      }
      verify_super_admin_integrity: { Args: never; Returns: Json }
      wallet_convert_currency: {
        Args: { p_amount: number; p_direction: string; p_reference_id?: string }
        Returns: Json
      }
      wallet_transfer_from_provider: {
        Args: {
          p_amount: number
          p_provider_code: string
          p_reference_id?: string
        }
        Returns: Json
      }
      wallet_transfer_to_provider: {
        Args: {
          p_amount: number
          p_provider_code: string
          p_reference_id?: string
        }
        Returns: Json
      }
    }
    Enums: {
      admin_role: "super_admin" | "finance_admin" | "game_admin" | "agent_admin"
      agent_status: "none" | "pending" | "approved" | "rejected" | "frozen"
      agent_tier:
        | "starter"
        | "bronze"
        | "silver"
        | "gold"
        | "diamond"
        | "elite"
        | "master"
      chat_event_type:
        | "created"
        | "assigned"
        | "reassigned"
        | "closed"
        | "priority_changed"
      chat_priority: "normal" | "high"
      chat_status: "open" | "in_progress" | "closed"
      chat_type: "user" | "agent_line"
      fd_status: "active" | "completed" | "withdrawn" | "cancelled"
      fd_txn_type: "deposit" | "profit" | "withdraw" | "penalty"
      fd_withdrawal_status: "pending" | "approved" | "rejected"
      fd_withdrawal_type: "mature" | "early"
      game_scope:
        | "wingo"
        | "k3"
        | "5d"
        | "trxwin"
        | "crash"
        | "mines"
        | "aviator"
        | "all"
      ledger_type:
        | "DEPOSIT"
        | "WITHDRAW_ADMIN"
        | "BET_DEBIT"
        | "WIN_CREDIT"
        | "FEE_DEBIT"
        | "AGENT_TOPUP_DEBIT"
        | "USER_TOPUP_CREDIT"
        | "COMMISSION_DEPOSIT"
        | "COMMISSION_BETTING"
        | "SALARY_CREDIT"
        | "BONUS_CREDIT"
        | "ADJUSTMENT"
        | "REGISTRATION_BONUS"
      payment_status: "pending" | "success" | "failed" | "verified" | "rejected"
      sender_type: "user" | "support"
      staff_role:
        | "super_admin"
        | "finance_admin"
        | "agent_admin"
        | "game_admin"
        | "support"
      transaction_type:
        | "deposit"
        | "withdraw"
        | "bet"
        | "win"
        | "bonus"
        | "referral"
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
  public: {
    Enums: {
      admin_role: ["super_admin", "finance_admin", "game_admin", "agent_admin"],
      agent_status: ["none", "pending", "approved", "rejected", "frozen"],
      agent_tier: [
        "starter",
        "bronze",
        "silver",
        "gold",
        "diamond",
        "elite",
        "master",
      ],
      chat_event_type: [
        "created",
        "assigned",
        "reassigned",
        "closed",
        "priority_changed",
      ],
      chat_priority: ["normal", "high"],
      chat_status: ["open", "in_progress", "closed"],
      chat_type: ["user", "agent_line"],
      fd_status: ["active", "completed", "withdrawn", "cancelled"],
      fd_txn_type: ["deposit", "profit", "withdraw", "penalty"],
      fd_withdrawal_status: ["pending", "approved", "rejected"],
      fd_withdrawal_type: ["mature", "early"],
      game_scope: [
        "wingo",
        "k3",
        "5d",
        "trxwin",
        "crash",
        "mines",
        "aviator",
        "all",
      ],
      ledger_type: [
        "DEPOSIT",
        "WITHDRAW_ADMIN",
        "BET_DEBIT",
        "WIN_CREDIT",
        "FEE_DEBIT",
        "AGENT_TOPUP_DEBIT",
        "USER_TOPUP_CREDIT",
        "COMMISSION_DEPOSIT",
        "COMMISSION_BETTING",
        "SALARY_CREDIT",
        "BONUS_CREDIT",
        "ADJUSTMENT",
        "REGISTRATION_BONUS",
      ],
      payment_status: ["pending", "success", "failed", "verified", "rejected"],
      sender_type: ["user", "support"],
      staff_role: [
        "super_admin",
        "finance_admin",
        "agent_admin",
        "game_admin",
        "support",
      ],
      transaction_type: [
        "deposit",
        "withdraw",
        "bet",
        "win",
        "bonus",
        "referral",
      ],
    },
  },
} as const
