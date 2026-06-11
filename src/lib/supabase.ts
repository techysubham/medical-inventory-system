import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          contact_person: string;
          email: string;
          phone: string;
          address: string;
          city: string;
          state: string;
          postal_code: string;
          country: string;
          website: string;
          notes: string;
          is_active: boolean;
          rating: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          contact_person?: string;
          email?: string;
          phone?: string;
          address?: string;
          city?: string;
          state?: string;
          postal_code?: string;
          country?: string;
          website?: string;
          notes?: string;
          is_active?: boolean;
          rating?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          contact_person?: string;
          email?: string;
          phone?: string;
          address?: string;
          city?: string;
          state?: string;
          postal_code?: string;
          country?: string;
          website?: string;
          notes?: string;
          is_active?: boolean;
          rating?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          name: string;
          code: string;
          description: string;
          type: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          description?: string;
          type?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          description?: string;
          type?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory_items: {
        Row: {
          id: string;
          sku: string;
          name: string;
          description: string;
          category_id: string | null;
          supplier_id: string | null;
          location_id: string | null;
          unit_of_measure: string;
          current_quantity: number;
          reorder_point: number;
          reorder_quantity: number;
          unit_cost: number;
          selling_price: number;
          batch_number: string;
          lot_number: string;
          expiration_date: string | null;
          is_controlled_substance: boolean;
          dea_schedule: string;
          requires_prescription: boolean;
          min_storage_temp: number | null;
          max_storage_temp: number | null;
          current_temp: number | null;
          status: string;
          notes: string;
          image_url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sku: string;
          name: string;
          description?: string;
          category_id?: string | null;
          supplier_id?: string | null;
          location_id?: string | null;
          unit_of_measure?: string;
          current_quantity?: number;
          reorder_point?: number;
          reorder_quantity?: number;
          unit_cost?: number;
          selling_price?: number;
          batch_number?: string;
          lot_number?: string;
          expiration_date?: string | null;
          is_controlled_substance?: boolean;
          dea_schedule?: string;
          requires_prescription?: boolean;
          min_storage_temp?: number | null;
          max_storage_temp?: number | null;
          current_temp?: number | null;
          status?: string;
          notes?: string;
          image_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sku?: string;
          name?: string;
          description?: string;
          category_id?: string | null;
          supplier_id?: string | null;
          location_id?: string | null;
          unit_of_measure?: string;
          current_quantity?: number;
          reorder_point?: number;
          reorder_quantity?: number;
          unit_cost?: number;
          selling_price?: number;
          batch_number?: string;
          lot_number?: string;
          expiration_date?: string | null;
          is_controlled_substance?: boolean;
          dea_schedule?: string;
          requires_prescription?: boolean;
          min_storage_temp?: number | null;
          max_storage_temp?: number | null;
          current_temp?: number | null;
          status?: string;
          notes?: string;
          image_url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory_transactions: {
        Row: {
          id: string;
          item_id: string;
          transaction_type: string;
          quantity: number;
          previous_quantity: number;
          new_quantity: number;
          unit_cost: number;
          total_value: number;
          reference_type: string;
          reference_id: string;
          notes: string;
          performed_by: string | null;
          performed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          transaction_type: string;
          quantity: number;
          previous_quantity: number;
          new_quantity: number;
          unit_cost?: number;
          total_value?: number;
          reference_type?: string;
          reference_id?: string;
          notes?: string;
          performed_by?: string | null;
          performed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          transaction_type?: string;
          quantity?: number;
          previous_quantity?: number;
          new_quantity?: number;
          unit_cost?: number;
          total_value?: number;
          reference_type?: string;
          reference_id?: string;
          notes?: string;
          performed_by?: string | null;
          performed_at?: string;
          created_at?: string;
        };
      };
      purchase_orders: {
        Row: {
          id: string;
          po_number: string;
          supplier_id: string | null;
          status: string;
          total_amount: number;
          order_date: string;
          expected_date: string | null;
          received_date: string | null;
          notes: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          po_number: string;
          supplier_id?: string | null;
          status?: string;
          total_amount?: number;
          order_date?: string;
          expected_date?: string | null;
          received_date?: string | null;
          notes?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          po_number?: string;
          supplier_id?: string | null;
          status?: string;
          total_amount?: number;
          order_date?: string;
          expected_date?: string | null;
          received_date?: string | null;
          notes?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      purchase_order_items: {
        Row: {
          id: string;
          po_id: string;
          item_id: string | null;
          quantity_ordered: number;
          quantity_received: number;
          unit_cost: number;
          total_cost: number;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          po_id: string;
          item_id?: string | null;
          quantity_ordered: number;
          quantity_received?: number;
          unit_cost: number;
          total_cost?: number;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          po_id?: string;
          item_id?: string | null;
          quantity_ordered?: number;
          quantity_received?: number;
          unit_cost?: number;
          total_cost?: number;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          alert_type: string;
          severity: string;
          title: string;
          message: string;
          item_id: string | null;
          is_read: boolean;
          is_resolved: boolean;
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          alert_type: string;
          severity?: string;
          title: string;
          message: string;
          item_id?: string | null;
          is_read?: boolean;
          is_resolved?: boolean;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          alert_type?: string;
          severity?: string;
          title?: string;
          message?: string;
          item_id?: string | null;
          is_read?: boolean;
          is_resolved?: boolean;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
        };
      };
      audit_log: {
        Row: {
          id: string;
          table_name: string;
          record_id: string;
          action: string;
          old_values: unknown | null;
          new_values: unknown | null;
          performed_by: string | null;
          performed_at: string;
        };
        Insert: {
          id?: string;
          table_name: string;
          record_id: string;
          action: string;
          old_values?: unknown | null;
          new_values?: unknown | null;
          performed_by?: string | null;
          performed_at?: string;
        };
        Update: {
          id?: string;
          table_name?: string;
          record_id?: string;
          action?: string;
          old_values?: unknown | null;
          new_values?: unknown | null;
          performed_by?: string | null;
          performed_at?: string;
        };
      };
    };
  };
};
