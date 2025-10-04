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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agenda: {
        Row: {
          created_at: string | null
          criado_por: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          gabinete_id: string
          id: string
          local: string | null
          responsavel_id: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          criado_por?: string | null
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          gabinete_id: string
          id?: string
          local?: string | null
          responsavel_id?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          criado_por?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          gabinete_id?: string
          id?: string
          local?: string | null
          responsavel_id?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agenda_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: false
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      demandas: {
        Row: {
          concluida_em: string | null
          created_at: string | null
          criado_por: string | null
          descricao: string | null
          eleitor_id: string | null
          gabinete_id: string
          id: string
          prazo: string | null
          prioridade: Database["public"]["Enums"]["demanda_prioridade"] | null
          responsavel_id: string | null
          status: Database["public"]["Enums"]["demanda_status"] | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          concluida_em?: string | null
          created_at?: string | null
          criado_por?: string | null
          descricao?: string | null
          eleitor_id?: string | null
          gabinete_id: string
          id?: string
          prazo?: string | null
          prioridade?: Database["public"]["Enums"]["demanda_prioridade"] | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["demanda_status"] | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          concluida_em?: string | null
          created_at?: string | null
          criado_por?: string | null
          descricao?: string | null
          eleitor_id?: string | null
          gabinete_id?: string
          id?: string
          prazo?: string | null
          prioridade?: Database["public"]["Enums"]["demanda_prioridade"] | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["demanda_status"] | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demandas_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_eleitor_id_fkey"
            columns: ["eleitor_id"]
            isOneToOne: false
            referencedRelation: "eleitores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: false
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      eleitores: {
        Row: {
          bairro: string | null
          cadastrado_por: string | null
          cep: string | null
          cidade: string | null
          cpf: string | null
          created_at: string | null
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          gabinete_id: string
          id: string
          latitude: number | null
          longitude: number | null
          nome_completo: string
          observacoes: string | null
          profissao: string | null
          rg: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          bairro?: string | null
          cadastrado_por?: string | null
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          gabinete_id: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome_completo: string
          observacoes?: string | null
          profissao?: string | null
          rg?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          bairro?: string | null
          cadastrado_por?: string | null
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          gabinete_id?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome_completo?: string
          observacoes?: string | null
          profissao?: string | null
          rg?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eleitores_cadastrado_por_fkey"
            columns: ["cadastrado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eleitores_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: false
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          },
        ]
      }
      gabinetes: {
        Row: {
          cidade: string | null
          created_at: string | null
          descricao: string | null
          estado: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          cidade?: string | null
          created_at?: string | null
          descricao?: string | null
          estado?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          cidade?: string | null
          created_at?: string | null
          descricao?: string | null
          estado?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          nome_completo: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          nome_completo: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          nome_completo?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_gabinetes: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          gabinete_id: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          gabinete_id: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          gabinete_id?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_gabinetes_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: false
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_gabinetes_user_id_fkey"
            columns: ["user_id"]
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
      user_has_gabinete_access: {
        Args: { gabinete_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      demanda_prioridade: "baixa" | "media" | "alta" | "urgente"
      demanda_status: "aberta" | "em_andamento" | "concluida" | "cancelada"
      user_role: "owner" | "admin" | "assessor"
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
      demanda_prioridade: ["baixa", "media", "alta", "urgente"],
      demanda_status: ["aberta", "em_andamento", "concluida", "cancelada"],
      user_role: ["owner", "admin", "assessor"],
    },
  },
} as const
