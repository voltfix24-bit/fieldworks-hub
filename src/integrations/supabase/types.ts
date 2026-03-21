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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          company_name: string
          contact_name: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          notes: string | null
          phone: string | null
          postal_code: string | null
          tenant_id: string
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          company_name: string
          contact_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          tenant_id: string
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          company_name?: string
          contact_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      depth_measurements: {
        Row: {
          created_at: string
          depth_meters: number
          electrode_id: string
          id: string
          measurement_session_id: string
          pen_id: string
          project_id: string
          resistance_value: number
          sort_order: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          depth_meters?: number
          electrode_id: string
          id?: string
          measurement_session_id: string
          pen_id: string
          project_id: string
          resistance_value?: number
          sort_order?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          depth_meters?: number
          electrode_id?: string
          id?: string
          measurement_session_id?: string
          pen_id?: string
          project_id?: string
          resistance_value?: number
          sort_order?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "depth_measurements_electrode_id_fkey"
            columns: ["electrode_id"]
            isOneToOne: false
            referencedRelation: "electrodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "depth_measurements_measurement_session_id_fkey"
            columns: ["measurement_session_id"]
            isOneToOne: false
            referencedRelation: "project_measurement_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "depth_measurements_pen_id_fkey"
            columns: ["pen_id"]
            isOneToOne: false
            referencedRelation: "pens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "depth_measurements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "depth_measurements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      electrodes: {
        Row: {
          created_at: string
          electrode_code: string
          id: string
          is_coupled: boolean
          label: string | null
          measurement_session_id: string
          notes: string | null
          project_id: string
          ra_value: number | null
          rv_value: number | null
          sort_order: number
          target_met: boolean | null
          target_value: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          electrode_code?: string
          id?: string
          is_coupled?: boolean
          label?: string | null
          measurement_session_id: string
          notes?: string | null
          project_id: string
          ra_value?: number | null
          rv_value?: number | null
          sort_order?: number
          target_met?: boolean | null
          target_value?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          electrode_code?: string
          id?: string
          is_coupled?: boolean
          label?: string | null
          measurement_session_id?: string
          notes?: string | null
          project_id?: string
          ra_value?: number | null
          rv_value?: number | null
          sort_order?: number
          target_met?: boolean | null
          target_value?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "electrodes_measurement_session_id_fkey"
            columns: ["measurement_session_id"]
            isOneToOne: false
            referencedRelation: "project_measurement_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electrodes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electrodes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          brand: string | null
          calibration_date: string | null
          created_at: string
          device_name: string
          id: string
          is_active: boolean
          is_default: boolean
          model: string | null
          next_calibration_date: string | null
          notes: string | null
          serial_number: string | null
          tenant_id: string
        }
        Insert: {
          brand?: string | null
          calibration_date?: string | null
          created_at?: string
          device_name: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          model?: string | null
          next_calibration_date?: string | null
          notes?: string | null
          serial_number?: string | null
          tenant_id: string
        }
        Update: {
          brand?: string | null
          calibration_date?: string | null
          created_at?: string
          device_name?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          model?: string | null
          next_calibration_date?: string | null
          notes?: string | null
          serial_number?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pens: {
        Row: {
          created_at: string
          display_photo_url: string | null
          electrode_id: string
          id: string
          label: string | null
          measurement_session_id: string
          notes: string | null
          overview_photo_url: string | null
          pen_code: string
          pen_depth_meters: number | null
          project_id: string
          sort_order: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_photo_url?: string | null
          electrode_id: string
          id?: string
          label?: string | null
          measurement_session_id: string
          notes?: string | null
          overview_photo_url?: string | null
          pen_code?: string
          pen_depth_meters?: number | null
          project_id: string
          sort_order?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_photo_url?: string | null
          electrode_id?: string
          id?: string
          label?: string | null
          measurement_session_id?: string
          notes?: string | null
          overview_photo_url?: string | null
          pen_code?: string
          pen_depth_meters?: number | null
          project_id?: string
          sort_order?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pens_electrode_id_fkey"
            columns: ["electrode_id"]
            isOneToOne: false
            referencedRelation: "electrodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pens_measurement_session_id_fkey"
            columns: ["measurement_session_id"]
            isOneToOne: false
            referencedRelation: "project_measurement_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pens_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["user_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["user_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["user_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      project_attachments: {
        Row: {
          attachment_type: string
          caption: string | null
          created_at: string
          file_name: string | null
          file_url: string
          id: string
          measurement_session_id: string | null
          project_id: string
          tenant_id: string
        }
        Insert: {
          attachment_type?: string
          caption?: string | null
          created_at?: string
          file_name?: string | null
          file_url: string
          id?: string
          measurement_session_id?: string | null
          project_id: string
          tenant_id: string
        }
        Update: {
          attachment_type?: string
          caption?: string | null
          created_at?: string
          file_name?: string | null
          file_url?: string
          id?: string
          measurement_session_id?: string | null
          project_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_attachments_measurement_session_id_fkey"
            columns: ["measurement_session_id"]
            isOneToOne: false
            referencedRelation: "project_measurement_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_attachments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_attachments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      project_measurement_sessions: {
        Row: {
          client_id: string | null
          created_at: string
          equipment_id: string | null
          id: string
          measurement_date: string | null
          measurement_notes: string | null
          project_id: string
          sketch_mode: string | null
          sketch_notes: string | null
          technician_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          equipment_id?: string | null
          id?: string
          measurement_date?: string | null
          measurement_notes?: string | null
          project_id: string
          sketch_mode?: string | null
          sketch_notes?: string | null
          technician_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          equipment_id?: string | null
          id?: string
          measurement_date?: string | null
          measurement_notes?: string | null
          project_id?: string
          sketch_mode?: string | null
          sketch_notes?: string | null
          technician_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_measurement_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_measurement_sessions_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_measurement_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_measurement_sessions_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_measurement_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          client_id: string | null
          completed_date: string | null
          country: string | null
          created_at: string
          equipment_id: string | null
          id: string
          notes: string | null
          planned_date: string | null
          postal_code: string | null
          project_name: string
          project_number: string
          site_name: string | null
          status: Database["public"]["Enums"]["project_status"]
          technician_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          client_id?: string | null
          completed_date?: string | null
          country?: string | null
          created_at?: string
          equipment_id?: string | null
          id?: string
          notes?: string | null
          planned_date?: string | null
          postal_code?: string | null
          project_name: string
          project_number: string
          site_name?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          technician_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          client_id?: string | null
          completed_date?: string | null
          country?: string | null
          created_at?: string
          equipment_id?: string | null
          id?: string
          notes?: string | null
          planned_date?: string | null
          postal_code?: string | null
          project_name?: string
          project_number?: string
          site_name?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          technician_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      technicians: {
        Row: {
          created_at: string
          email: string | null
          employee_code: string | null
          full_name: string
          id: string
          is_active: boolean
          is_default: boolean
          phone: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          employee_code?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          phone?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          employee_code?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          phone?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "technicians_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_branding: {
        Row: {
          accent_color: string
          border_radius: string
          btw_number: string | null
          compact_logo_url: string | null
          created_at: string
          dark_logo_url: string | null
          export_date_format: string
          export_filename_pattern: string
          export_print_profile: string
          footer_address: string | null
          footer_city: string | null
          footer_company_name: string | null
          footer_country: string | null
          footer_email: string | null
          footer_phone: string | null
          footer_postal_code: string | null
          footer_website: string | null
          id: string
          interface_density: string
          kvk_number: string | null
          light_logo_url: string | null
          logo_url: string | null
          official_company_name: string | null
          primary_color: string
          report_captions: boolean
          report_decimals: string
          report_density: string
          report_disclaimer: string | null
          report_empty_cell: string
          report_fields: Json
          report_footer_color: string | null
          report_footer_every_page: boolean
          report_header_color: string | null
          report_header_every_page: boolean
          report_logo_size: string
          report_page_numbers: boolean
          report_pens_side_by_side: boolean
          report_photo_grouping: string
          report_sections: Json
          report_show_logo: boolean
          report_sign_block: boolean
          report_sign_date: boolean
          report_sign_executor: boolean
          report_sign_reviewer: boolean
          report_subtitle: string | null
          report_table_style: string
          report_title: string
          secondary_color: string
          support_email: string | null
          support_phone: string | null
          tenant_id: string
          updated_at: string
          website: string | null
        }
        Insert: {
          accent_color?: string
          border_radius?: string
          btw_number?: string | null
          compact_logo_url?: string | null
          created_at?: string
          dark_logo_url?: string | null
          export_date_format?: string
          export_filename_pattern?: string
          export_print_profile?: string
          footer_address?: string | null
          footer_city?: string | null
          footer_company_name?: string | null
          footer_country?: string | null
          footer_email?: string | null
          footer_phone?: string | null
          footer_postal_code?: string | null
          footer_website?: string | null
          id?: string
          interface_density?: string
          kvk_number?: string | null
          light_logo_url?: string | null
          logo_url?: string | null
          official_company_name?: string | null
          primary_color?: string
          report_captions?: boolean
          report_decimals?: string
          report_density?: string
          report_disclaimer?: string | null
          report_empty_cell?: string
          report_fields?: Json
          report_footer_color?: string | null
          report_footer_every_page?: boolean
          report_header_color?: string | null
          report_header_every_page?: boolean
          report_logo_size?: string
          report_page_numbers?: boolean
          report_pens_side_by_side?: boolean
          report_photo_grouping?: string
          report_sections?: Json
          report_show_logo?: boolean
          report_sign_block?: boolean
          report_sign_date?: boolean
          report_sign_executor?: boolean
          report_sign_reviewer?: boolean
          report_subtitle?: string | null
          report_table_style?: string
          report_title?: string
          secondary_color?: string
          support_email?: string | null
          support_phone?: string | null
          tenant_id: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          accent_color?: string
          border_radius?: string
          btw_number?: string | null
          compact_logo_url?: string | null
          created_at?: string
          dark_logo_url?: string | null
          export_date_format?: string
          export_filename_pattern?: string
          export_print_profile?: string
          footer_address?: string | null
          footer_city?: string | null
          footer_company_name?: string | null
          footer_country?: string | null
          footer_email?: string | null
          footer_phone?: string | null
          footer_postal_code?: string | null
          footer_website?: string | null
          id?: string
          interface_density?: string
          kvk_number?: string | null
          light_logo_url?: string | null
          logo_url?: string | null
          official_company_name?: string | null
          primary_color?: string
          report_captions?: boolean
          report_decimals?: string
          report_density?: string
          report_disclaimer?: string | null
          report_empty_cell?: string
          report_fields?: Json
          report_footer_color?: string | null
          report_footer_every_page?: boolean
          report_header_color?: string | null
          report_header_every_page?: boolean
          report_logo_size?: string
          report_page_numbers?: boolean
          report_pens_side_by_side?: boolean
          report_photo_grouping?: string
          report_sections?: Json
          report_show_logo?: boolean
          report_sign_block?: boolean
          report_sign_date?: boolean
          report_sign_executor?: boolean
          report_sign_reviewer?: boolean
          report_subtitle?: string | null
          report_table_style?: string
          report_title?: string
          secondary_color?: string
          support_email?: string | null
          support_phone?: string | null
          tenant_id?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_branding_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          company_name: string
          created_at: string
          id: string
          slug: string
          status: Database["public"]["Enums"]["tenant_status"]
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          id?: string
          slug: string
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          id?: string
          slug?: string
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "tenant_admin" | "office_user" | "technician"
      project_status: "planned" | "completed"
      tenant_status: "active" | "inactive" | "suspended"
      user_status: "active" | "inactive" | "invited"
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
      app_role: ["tenant_admin", "office_user", "technician"],
      project_status: ["planned", "completed"],
      tenant_status: ["active", "inactive", "suspended"],
      user_status: ["active", "inactive", "invited"],
    },
  },
} as const
