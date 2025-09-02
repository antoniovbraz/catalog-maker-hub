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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      assistants: {
        Row: {
          assistant_id: string
          created_at: string
          id: string
          instructions: string
          marketplace: string
          mode: string
          model: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assistant_id: string
          created_at?: string
          id?: string
          instructions: string
          marketplace: string
          mode?: string
          model?: string
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assistant_id?: string
          created_at?: string
          id?: string
          instructions?: string
          marketplace?: string
          mode?: string
          model?: string
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          marketplace_id: string | null
          rate: number
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          marketplace_id?: string | null
          rate: number
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          marketplace_id?: string | null
          rate?: number
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_marketplace_id_fkey"
            columns: ["marketplace_id"]
            isOneToOne: false
            referencedRelation: "marketplaces"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_fixed_fee_rules: {
        Row: {
          created_at: string | null
          id: string
          marketplace_id: string | null
          range_max: number | null
          range_min: number | null
          rule_type: string
          tenant_id: string | null
          updated_at: string | null
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          marketplace_id?: string | null
          range_max?: number | null
          range_min?: number | null
          rule_type: string
          tenant_id?: string | null
          updated_at?: string | null
          value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          marketplace_id?: string | null
          range_max?: number | null
          range_min?: number | null
          rule_type?: string
          tenant_id?: string | null
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_fixed_fee_rules_marketplace_id_fkey"
            columns: ["marketplace_id"]
            isOneToOne: false
            referencedRelation: "marketplaces"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplaces: {
        Row: {
          category_restrictions: Json | null
          created_at: string
          description: string | null
          id: string
          marketplace_metadata: Json | null
          marketplace_type:
            | Database["public"]["Enums"]["marketplace_type"]
            | null
          name: string
          platform_id: string | null
          tenant_id: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          category_restrictions?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          marketplace_metadata?: Json | null
          marketplace_type?:
            | Database["public"]["Enums"]["marketplace_type"]
            | null
          name: string
          platform_id?: string | null
          tenant_id?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          category_restrictions?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          marketplace_metadata?: Json | null
          marketplace_type?:
            | Database["public"]["Enums"]["marketplace_type"]
            | null
          name?: string
          platform_id?: string | null
          tenant_id?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplaces_parent_marketplace_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "marketplaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_advanced_settings: {
        Row: {
          advanced_monitoring: boolean | null
          auto_recovery_enabled: boolean | null
          backup_schedule: string | null
          created_at: string | null
          feature_flags: Json | null
          id: string
          multi_account_enabled: boolean | null
          rate_limits: Json | null
          security_level: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          advanced_monitoring?: boolean | null
          auto_recovery_enabled?: boolean | null
          backup_schedule?: string | null
          created_at?: string | null
          feature_flags?: Json | null
          id?: string
          multi_account_enabled?: boolean | null
          rate_limits?: Json | null
          security_level?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          advanced_monitoring?: boolean | null
          auto_recovery_enabled?: boolean | null
          backup_schedule?: string | null
          created_at?: string | null
          feature_flags?: Json | null
          id?: string
          multi_account_enabled?: boolean | null
          rate_limits?: Json | null
          security_level?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ml_applications: {
        Row: {
          app_id: number
          client_id: string
          client_secret: string
          country_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          redirect_uri: string
          tenant_id: string
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          app_id: number
          client_id: string
          client_secret: string
          country_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          redirect_uri: string
          tenant_id: string
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          app_id?: number
          client_id?: string
          client_secret?: string
          country_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          redirect_uri?: string
          tenant_id?: string
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      ml_auth_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string
          id: string
          ml_nickname: string | null
          refresh_token: string | null
          scope: string | null
          tenant_id: string
          token_type: string | null
          updated_at: string | null
          user_id_ml: number | null
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at: string
          id?: string
          ml_nickname?: string | null
          refresh_token?: string | null
          scope?: string | null
          tenant_id: string
          token_type?: string | null
          updated_at?: string | null
          user_id_ml?: number | null
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          ml_nickname?: string | null
          refresh_token?: string | null
          scope?: string | null
          tenant_id?: string
          token_type?: string | null
          updated_at?: string | null
          user_id_ml?: number | null
        }
        Relationships: []
      }
      ml_categories: {
        Row: {
          auto_mapped: boolean | null
          created_at: string | null
          id: string
          local_category_id: string | null
          ml_category_id: string
          ml_category_name: string
          ml_path_from_root: Json | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          auto_mapped?: boolean | null
          created_at?: string | null
          id?: string
          local_category_id?: string | null
          ml_category_id: string
          ml_category_name: string
          ml_path_from_root?: Json | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          auto_mapped?: boolean | null
          created_at?: string | null
          id?: string
          local_category_id?: string | null
          ml_category_id?: string
          ml_category_name?: string
          ml_path_from_root?: Json | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_categories_local_category_id_fkey"
            columns: ["local_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_category_mapping: {
        Row: {
          attributes_template: Json | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          ml_category_id: string
          ml_category_name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          attributes_template?: Json | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          ml_category_id: string
          ml_category_name: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          attributes_template?: Json | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          ml_category_id?: string
          ml_category_name?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_category_mapping_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_orders: {
        Row: {
          buyer_id: number | null
          buyer_nickname: string | null
          created_at: string | null
          currency_id: string | null
          date_closed: string | null
          date_created: string | null
          date_last_updated: string | null
          fees: Json | null
          id: string
          ml_item_id: string
          ml_order_id: number
          order_status: string | null
          payment_status: string | null
          product_id: string | null
          quantity: number
          shipping_info: Json | null
          shipping_status: string | null
          tenant_id: string
          total_amount: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          buyer_id?: number | null
          buyer_nickname?: string | null
          created_at?: string | null
          currency_id?: string | null
          date_closed?: string | null
          date_created?: string | null
          date_last_updated?: string | null
          fees?: Json | null
          id?: string
          ml_item_id: string
          ml_order_id: number
          order_status?: string | null
          payment_status?: string | null
          product_id?: string | null
          quantity: number
          shipping_info?: Json | null
          shipping_status?: string | null
          tenant_id: string
          total_amount: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          buyer_id?: number | null
          buyer_nickname?: string | null
          created_at?: string | null
          currency_id?: string | null
          date_closed?: string | null
          date_created?: string | null
          date_last_updated?: string | null
          fees?: Json | null
          id?: string
          ml_item_id?: string
          ml_order_id?: number
          order_status?: string | null
          payment_status?: string | null
          product_id?: string | null
          quantity?: number
          shipping_info?: Json | null
          shipping_status?: string | null
          tenant_id?: string
          total_amount?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_pkce_storage: {
        Row: {
          code_challenge: string
          code_challenge_method: string
          code_verifier: string
          created_at: string | null
          expires_at: string | null
          id: string
          state: string
          tenant_id: string
        }
        Insert: {
          code_challenge: string
          code_challenge_method?: string
          code_verifier: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          state: string
          tenant_id: string
        }
        Update: {
          code_challenge?: string
          code_challenge_method?: string
          code_verifier?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          state?: string
          tenant_id?: string
        }
        Relationships: []
      }
      ml_product_mapping: {
        Row: {
          attributes: Json | null
          created_at: string | null
          error_message: string | null
          id: string
          last_sync_at: string | null
          ml_category_id: string | null
          ml_condition: string | null
          ml_currency_id: string | null
          ml_item_id: string | null
          ml_listing_type: string | null
          ml_permalink: string | null
          ml_price: number | null
          ml_title: string | null
          product_id: string
          sync_direction:
            | Database["public"]["Enums"]["ml_sync_direction"]
            | null
          sync_status: Database["public"]["Enums"]["ml_sync_status"] | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          attributes?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          ml_category_id?: string | null
          ml_condition?: string | null
          ml_currency_id?: string | null
          ml_item_id?: string | null
          ml_listing_type?: string | null
          ml_permalink?: string | null
          ml_price?: number | null
          ml_title?: string | null
          product_id: string
          sync_direction?:
            | Database["public"]["Enums"]["ml_sync_direction"]
            | null
          sync_status?: Database["public"]["Enums"]["ml_sync_status"] | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          attributes?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          ml_category_id?: string | null
          ml_condition?: string | null
          ml_currency_id?: string | null
          ml_item_id?: string | null
          ml_listing_type?: string | null
          ml_permalink?: string | null
          ml_price?: number | null
          ml_title?: string | null
          product_id?: string
          sync_direction?:
            | Database["public"]["Enums"]["ml_sync_direction"]
            | null
          sync_status?: Database["public"]["Enums"]["ml_sync_status"] | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_product_mapping_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_sync_log: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string
          error_details: Json | null
          execution_time_ms: number | null
          id: string
          ml_entity_id: string | null
          operation_type: string
          request_data: Json | null
          request_url: string | null
          response_data: Json | null
          response_headers: Json | null
          response_status: number | null
          status: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          error_details?: Json | null
          execution_time_ms?: number | null
          id?: string
          ml_entity_id?: string | null
          operation_type: string
          request_data?: Json | null
          request_url?: string | null
          response_data?: Json | null
          response_headers?: Json | null
          response_status?: number | null
          status: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          error_details?: Json | null
          execution_time_ms?: number | null
          id?: string
          ml_entity_id?: string | null
          operation_type?: string
          request_data?: Json | null
          request_url?: string | null
          response_data?: Json | null
          response_headers?: Json | null
          response_status?: number | null
          status?: string
          tenant_id?: string
        }
        Relationships: []
      }
      ml_sync_settings: {
        Row: {
          auto_import_orders: boolean | null
          auto_sync_enabled: boolean | null
          auto_update_prices: boolean | null
          auto_update_stock: boolean | null
          created_at: string | null
          default_condition: string | null
          default_listing_type: string | null
          id: string
          price_markup_percent: number | null
          settings: Json | null
          sync_interval_hours: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          auto_import_orders?: boolean | null
          auto_sync_enabled?: boolean | null
          auto_update_prices?: boolean | null
          auto_update_stock?: boolean | null
          created_at?: string | null
          default_condition?: string | null
          default_listing_type?: string | null
          id?: string
          price_markup_percent?: number | null
          settings?: Json | null
          sync_interval_hours?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          auto_import_orders?: boolean | null
          auto_sync_enabled?: boolean | null
          auto_update_prices?: boolean | null
          auto_update_stock?: boolean | null
          created_at?: string | null
          default_condition?: string | null
          default_listing_type?: string | null
          id?: string
          price_markup_percent?: number | null
          settings?: Json | null
          sync_interval_hours?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ml_webhook_events: {
        Row: {
          application_id: number
          attempts: number | null
          created_at: string | null
          error_message: string | null
          id: string
          processed_at: string | null
          raw_payload: Json
          resource: string
          tenant_id: string
          topic: string
          user_id_ml: number
        }
        Insert: {
          application_id: number
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          raw_payload: Json
          resource: string
          tenant_id: string
          topic: string
          user_id_ml: number
        }
        Update: {
          application_id?: number
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          raw_payload?: Json
          resource?: string
          tenant_id?: string
          topic?: string
          user_id_ml?: number
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string | null
          id: string
          image_type: string | null
          image_url: string
          product_id: string
          sort_order: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_type?: string | null
          image_url: string
          product_id: string
          sort_order?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_type?: string | null
          image_url?: string
          product_id?: string
          sort_order?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          brand: string | null
          category_id: string | null
          cost_unit: number
          created_at: string
          description: string | null
          dimensions: Json | null
          id: string
          ml_attributes: Json | null
          ml_available_quantity: number | null
          ml_pictures: Json | null
          ml_seller_sku: string | null
          ml_sold_quantity: number | null
          ml_stock_quantity: number | null
          ml_variation_id: string | null
          ml_variations: Json | null
          model: string | null
          name: string
          packaging_cost: number | null
          sku: string | null
          source: string
          tax_rate: number | null
          tenant_id: string | null
          updated_at: string
          warranty: string | null
          weight: number | null
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          cost_unit: number
          created_at?: string
          description?: string | null
          dimensions?: Json | null
          id?: string
          ml_attributes?: Json | null
          ml_available_quantity?: number | null
          ml_pictures?: Json | null
          ml_seller_sku?: string | null
          ml_sold_quantity?: number | null
          ml_stock_quantity?: number | null
          ml_variation_id?: string | null
          ml_variations?: Json | null
          model?: string | null
          name: string
          packaging_cost?: number | null
          sku?: string | null
          source?: string
          tax_rate?: number | null
          tenant_id?: string | null
          updated_at?: string
          warranty?: string | null
          weight?: number | null
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          cost_unit?: number
          created_at?: string
          description?: string | null
          dimensions?: Json | null
          id?: string
          ml_attributes?: Json | null
          ml_available_quantity?: number | null
          ml_pictures?: Json | null
          ml_seller_sku?: string | null
          ml_sold_quantity?: number | null
          ml_stock_quantity?: number | null
          ml_variation_id?: string | null
          ml_variations?: Json | null
          model?: string | null
          name?: string
          packaging_cost?: number | null
          sku?: string | null
          source?: string
          tax_rate?: number | null
          tenant_id?: string | null
          updated_at?: string
          warranty?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          plan_expires_at: string | null
          plan_type: string | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          plan_expires_at?: string | null
          plan_type?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          plan_expires_at?: string | null
          plan_type?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          id: string
          marketplace_id: string | null
          price_charged: number
          product_id: string | null
          quantity: number
          sold_at: string
          tenant_id: string | null
        }
        Insert: {
          id?: string
          marketplace_id?: string | null
          price_charged: number
          product_id?: string | null
          quantity: number
          sold_at?: string
          tenant_id?: string | null
        }
        Update: {
          id?: string
          marketplace_id?: string | null
          price_charged?: number
          product_id?: string | null
          quantity?: number
          sold_at?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_marketplace_id_fkey"
            columns: ["marketplace_id"]
            isOneToOne: false
            referencedRelation: "marketplaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_pricing: {
        Row: {
          comissao: number
          created_at: string
          custo_total: number
          frete: number
          id: string
          margem_desejada: number
          margem_percentual: number
          margem_unitaria: number
          marketplace_id: string
          preco_praticado: number | null
          preco_sugerido: number
          product_id: string
          provisao_desconto: number
          taxa_cartao: number
          tenant_id: string | null
          updated_at: string
          valor_fixo: number
        }
        Insert: {
          comissao?: number
          created_at?: string
          custo_total: number
          frete?: number
          id?: string
          margem_desejada?: number
          margem_percentual: number
          margem_unitaria: number
          marketplace_id: string
          preco_praticado?: number | null
          preco_sugerido: number
          product_id: string
          provisao_desconto?: number
          taxa_cartao?: number
          tenant_id?: string | null
          updated_at?: string
          valor_fixo?: number
        }
        Update: {
          comissao?: number
          created_at?: string
          custo_total?: number
          frete?: number
          id?: string
          margem_desejada?: number
          margem_percentual?: number
          margem_unitaria?: number
          marketplace_id?: string
          preco_praticado?: number | null
          preco_sugerido?: number
          product_id?: string
          provisao_desconto?: number
          taxa_cartao?: number
          tenant_id?: string | null
          updated_at?: string
          valor_fixo?: number
        }
        Relationships: [
          {
            foreignKeyName: "saved_pricing_marketplace_id_fkey"
            columns: ["marketplace_id"]
            isOneToOne: false
            referencedRelation: "marketplaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_pricing_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_rules: {
        Row: {
          created_at: string | null
          free_shipping_threshold: number | null
          id: string
          marketplace_id: string | null
          product_id: string | null
          shipping_cost: number
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          free_shipping_threshold?: number | null
          id?: string
          marketplace_id?: string | null
          product_id?: string | null
          shipping_cost: number
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          free_shipping_threshold?: number | null
          id?: string
          marketplace_id?: string | null
          product_id?: string | null
          shipping_cost?: number
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_rules_marketplace_id_fkey"
            columns: ["marketplace_id"]
            isOneToOne: false
            referencedRelation: "marketplaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          features: Json
          id: string
          is_active: boolean
          limits: Json
          name: string
          price_monthly: number
          price_yearly: number | null
          sort_order: number | null
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          features?: Json
          id?: string
          is_active?: boolean
          limits?: Json
          name: string
          price_monthly: number
          price_yearly?: number | null
          sort_order?: number | null
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          features?: Json
          id?: string
          is_active?: boolean
          limits?: Json
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          sort_order?: number | null
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "public_pricing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_tracking: {
        Row: {
          created_at: string
          current_usage: number
          id: string
          period_end: string
          period_start: string
          resource_type: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_usage?: number
          id?: string
          period_end?: string
          period_start?: string
          resource_type: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_usage?: number
          id?: string
          period_end?: string
          period_start?: string
          resource_type?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      ml_integration_status: {
        Row: {
          connection_status: string | null
          error_products: number | null
          last_order_import: string | null
          last_product_sync: string | null
          orders_this_month: number | null
          pending_products: number | null
          revenue_this_month: number | null
          synced_products: number | null
          tenant_id: string | null
          total_orders: number | null
          total_products: number | null
        }
        Relationships: []
      }
      public_pricing: {
        Row: {
          description: string | null
          display_name: string | null
          has_advanced_analytics: boolean | null
          has_basic_analytics: boolean | null
          has_email_support: boolean | null
          has_price_pilot: boolean | null
          has_priority_support: boolean | null
          id: string | null
          price_monthly: number | null
          price_yearly: number | null
          sort_order: number | null
        }
        Insert: {
          description?: string | null
          display_name?: string | null
          has_advanced_analytics?: never
          has_basic_analytics?: never
          has_email_support?: never
          has_price_pilot?: never
          has_priority_support?: never
          id?: string | null
          price_monthly?: number | null
          price_yearly?: number | null
          sort_order?: number | null
        }
        Update: {
          description?: string | null
          display_name?: string | null
          has_advanced_analytics?: never
          has_basic_analytics?: never
          has_email_support?: never
          has_price_pilot?: never
          has_priority_support?: never
          id?: string | null
          price_monthly?: number | null
          price_yearly?: number | null
          sort_order?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      audit_security_definer_functions: {
        Args: Record<PropertyKey, never>
        Returns: {
          function_name: string
          recommendation: string
          search_path_setting: string
          security_level: string
        }[]
      }
      audit_table_security: {
        Args: Record<PropertyKey, never>
        Returns: {
          object_name: string
          object_type: string
          policies_count: number
          recommendation: string
          rls_enabled: boolean
          security_level: string
        }[]
      }
      backup_ml_configuration: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      calcular_margem_real: {
        Args: {
          p_marketplace_id: string
          p_preco_praticado: number
          p_product_id: string
          p_provisao_desconto: number
          p_taxa_cartao: number
        }
        Returns: Json
      }
      calcular_preco: {
        Args: {
          p_margem_desejada: number
          p_marketplace_id: string
          p_product_id: string
          p_provisao_desconto: number
          p_taxa_cartao: number
        }
        Returns: Json
      }
      check_ml_rate_limit: {
        Args: { p_operation_type: string }
        Returns: boolean
      }
      check_usage_limit: {
        Args: {
          p_increment?: number
          p_resource_type: string
          p_user_id: string
        }
        Returns: boolean
      }
      cleanup_expired_pkce: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_ml_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_default_ml_settings: {
        Args: { p_tenant_id: string }
        Returns: undefined
      }
      get_admin_dashboard_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_ml_advanced_settings: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_ml_integration_health: {
        Args: Record<PropertyKey, never>
        Returns: {
          connected_at: string
          expires_at: string
          failed_renewals_24h: number
          health_status: string
          hours_until_expiry: number
          ml_nickname: string
          successful_renewals_24h: number
          tenant_id: string
          user_id_ml: number
        }[]
      }
      get_ml_performance_metrics: {
        Args: { p_days?: number }
        Returns: Json
      }
      get_popular_ml_categories: {
        Args: Record<PropertyKey, never>
        Returns: {
          ml_category_id: string
          ml_category_name: string
          usage_count: number
        }[]
      }
      get_tenant_by_ml_user_id: {
        Args: { p_user_id_ml: number }
        Returns: string
      }
      increment_usage: {
        Args: {
          p_increment?: number
          p_resource_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: { p_details?: Json; p_event_type: string; p_user_id?: string }
        Returns: undefined
      }
      sync_ml_category_mapping: {
        Args: {
          p_category_id?: string
          p_ml_category_id: string
          p_ml_category_name: string
          p_tenant_id: string
        }
        Returns: string
      }
      update_ml_advanced_settings: {
        Args: { p_settings: Json }
        Returns: Json
      }
      validate_tenant_access: {
        Args: { p_tenant_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      marketplace_type: "platform" | "modality"
      ml_sync_direction: "to_ml" | "from_ml" | "bidirectional"
      ml_sync_status:
        | "not_synced"
        | "syncing"
        | "synced"
        | "error"
        | "conflict"
        | "pending"
      user_role: "super_admin" | "admin" | "user"
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
      marketplace_type: ["platform", "modality"],
      ml_sync_direction: ["to_ml", "from_ml", "bidirectional"],
      ml_sync_status: [
        "not_synced",
        "syncing",
        "synced",
        "error",
        "conflict",
        "pending",
      ],
      user_role: ["super_admin", "admin", "user"],
    },
  },
} as const
