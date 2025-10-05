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
          cor: string | null
          created_at: string | null
          criado_por: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          endereco: string | null
          gabinete_id: string
          id: string
          latitude: number | null
          link_online: string | null
          local: string | null
          longitude: number | null
          responsavel_id: string | null
          status: string | null
          tipo: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          cor?: string | null
          created_at?: string | null
          criado_por?: string | null
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          endereco?: string | null
          gabinete_id: string
          id?: string
          latitude?: number | null
          link_online?: string | null
          local?: string | null
          longitude?: number | null
          responsavel_id?: string | null
          status?: string | null
          tipo?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          cor?: string | null
          created_at?: string | null
          criado_por?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          endereco?: string | null
          gabinete_id?: string
          id?: string
          latitude?: number | null
          link_online?: string | null
          local?: string | null
          longitude?: number | null
          responsavel_id?: string | null
          status?: string | null
          tipo?: string | null
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
      agenda_participantes: {
        Row: {
          created_at: string | null
          evento_id: string
          id: string
          presente: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          evento_id: string
          id?: string
          presente?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          evento_id?: string
          id?: string
          presente?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_participantes_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "agenda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agenda_participantes_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: Database["public"]["Enums"]["audit_entity"] | null
          gabinete_id: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["audit_entity"] | null
          gabinete_id: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["audit_entity"] | null
          gabinete_id?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: false
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          },
        ]
      }
      demanda_comentarios: {
        Row: {
          comentario: string
          created_at: string
          demanda_id: string
          id: string
          tipo: string | null
          user_id: string
        }
        Insert: {
          comentario: string
          created_at?: string
          demanda_id: string
          id?: string
          tipo?: string | null
          user_id: string
        }
        Update: {
          comentario?: string
          created_at?: string
          demanda_id?: string
          id?: string
          tipo?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demanda_comentarios_demanda_id_fkey"
            columns: ["demanda_id"]
            isOneToOne: false
            referencedRelation: "demandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demanda_comentarios_user_id_fkey"
            columns: ["user_id"]
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
      eleitor_tags: {
        Row: {
          created_at: string
          eleitor_id: string
          id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          eleitor_id: string
          id?: string
          tag_id: string
        }
        Update: {
          created_at?: string
          eleitor_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: []
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
          numero: string | null
          observacoes: string | null
          profissao: string | null
          rg: string | null
          telefone: string | null
          updated_at: string | null
          via_link_indicacao: boolean | null
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
          numero?: string | null
          observacoes?: string | null
          profissao?: string | null
          rg?: string | null
          telefone?: string | null
          updated_at?: string | null
          via_link_indicacao?: boolean | null
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
          numero?: string | null
          observacoes?: string | null
          profissao?: string | null
          rg?: string | null
          telefone?: string | null
          updated_at?: string | null
          via_link_indicacao?: boolean | null
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
      gabinete_integrations: {
        Row: {
          config: Json | null
          created_at: string | null
          gabinete_id: string
          id: string
          integration_type: string
          is_active: boolean | null
          last_sync: string | null
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          gabinete_id: string
          id?: string
          integration_type: string
          is_active?: boolean | null
          last_sync?: string | null
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          gabinete_id?: string
          id?: string
          integration_type?: string
          is_active?: boolean | null
          last_sync?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gabinete_integrations_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: false
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          },
        ]
      }
      gabinetes: {
        Row: {
          cargo: Database["public"]["Enums"]["cargo_politico"] | null
          cidade: string | null
          created_at: string | null
          descricao: string | null
          estado: string | null
          id: string
          nome: string
          slogan: string | null
          updated_at: string | null
        }
        Insert: {
          cargo?: Database["public"]["Enums"]["cargo_politico"] | null
          cidade?: string | null
          created_at?: string | null
          descricao?: string | null
          estado?: string | null
          id?: string
          nome: string
          slogan?: string | null
          updated_at?: string | null
        }
        Update: {
          cargo?: Database["public"]["Enums"]["cargo_politico"] | null
          cidade?: string | null
          created_at?: string | null
          descricao?: string | null
          estado?: string | null
          id?: string
          nome?: string
          slogan?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          gabinete_id: string
          id: string
          message: string
          read: boolean
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          gabinete_id: string
          id?: string
          message: string
          read?: boolean
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          gabinete_id?: string
          id?: string
          message?: string
          read?: boolean
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: false
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_form_submissions: {
        Row: {
          created_at: string
          data: Json
          form_id: string
          form_title: string
          gabinete_id: string
          id: string
        }
        Insert: {
          created_at?: string
          data: Json
          form_id: string
          form_title: string
          gabinete_id: string
          id?: string
        }
        Update: {
          created_at?: string
          data?: Json
          form_id?: string
          form_title?: string
          gabinete_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_form_submissions_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: false
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_gabinete: {
        Row: {
          cor_primaria: string | null
          cor_secundaria: string | null
          created_at: string | null
          descricao: string | null
          gabinete_id: string
          id: string
          layout_json: Json | null
          logo_url: string | null
          publicado: boolean | null
          site_path: string
          slug: string
          subtitulo: string | null
          titulo: string | null
          updated_at: string | null
        }
        Insert: {
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string | null
          descricao?: string | null
          gabinete_id: string
          id?: string
          layout_json?: Json | null
          logo_url?: string | null
          publicado?: boolean | null
          site_path?: string
          slug: string
          subtitulo?: string | null
          titulo?: string | null
          updated_at?: string | null
        }
        Update: {
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string | null
          descricao?: string | null
          gabinete_id?: string
          id?: string
          layout_json?: Json | null
          logo_url?: string | null
          publicado?: boolean | null
          site_path?: string
          slug?: string
          subtitulo?: string | null
          titulo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_gabinete_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: true
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          codigo_indicacao: string | null
          created_at: string | null
          id: string
          nome_completo: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          codigo_indicacao?: string | null
          created_at?: string | null
          id: string
          nome_completo: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          codigo_indicacao?: string | null
          created_at?: string | null
          id?: string
          nome_completo?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      roteiro_pontos: {
        Row: {
          created_at: string
          demanda_id: string | null
          eleitor_id: string
          endereco_manual: string | null
          id: string
          latitude: number | null
          longitude: number | null
          observacoes: string | null
          ordem: number
          roteiro_id: string
          visitado: boolean | null
          visitado_em: string | null
        }
        Insert: {
          created_at?: string
          demanda_id?: string | null
          eleitor_id: string
          endereco_manual?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          observacoes?: string | null
          ordem: number
          roteiro_id: string
          visitado?: boolean | null
          visitado_em?: string | null
        }
        Update: {
          created_at?: string
          demanda_id?: string | null
          eleitor_id?: string
          endereco_manual?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          observacoes?: string | null
          ordem?: number
          roteiro_id?: string
          visitado?: boolean | null
          visitado_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roteiro_pontos_demanda_id_fkey"
            columns: ["demanda_id"]
            isOneToOne: false
            referencedRelation: "demandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roteiro_pontos_eleitor_id_fkey"
            columns: ["eleitor_id"]
            isOneToOne: false
            referencedRelation: "eleitores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roteiro_pontos_roteiro_id_fkey"
            columns: ["roteiro_id"]
            isOneToOne: false
            referencedRelation: "roteiros"
            referencedColumns: ["id"]
          },
        ]
      }
      roteiro_responsaveis: {
        Row: {
          created_at: string
          id: string
          roteiro_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          roteiro_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          roteiro_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roteiro_responsaveis_roteiro_id_fkey"
            columns: ["roteiro_id"]
            isOneToOne: false
            referencedRelation: "roteiros"
            referencedColumns: ["id"]
          },
        ]
      }
      roteiros: {
        Row: {
          created_at: string
          criado_por: string | null
          data: string
          distancia_total: number | null
          endereco_final: string | null
          endereco_partida: string | null
          gabinete_id: string
          hora_inicio: string | null
          id: string
          latitude_final: number | null
          latitude_partida: number | null
          longitude_final: number | null
          longitude_partida: number | null
          nome: string
          objetivo: string | null
          responsavel_id: string | null
          status: Database["public"]["Enums"]["roteiro_status"]
          tempo_estimado: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          data: string
          distancia_total?: number | null
          endereco_final?: string | null
          endereco_partida?: string | null
          gabinete_id: string
          hora_inicio?: string | null
          id?: string
          latitude_final?: number | null
          latitude_partida?: number | null
          longitude_final?: number | null
          longitude_partida?: number | null
          nome: string
          objetivo?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["roteiro_status"]
          tempo_estimado?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          data?: string
          distancia_total?: number | null
          endereco_final?: string | null
          endereco_partida?: string | null
          gabinete_id?: string
          hora_inicio?: string | null
          id?: string
          latitude_final?: number | null
          latitude_partida?: number | null
          longitude_final?: number | null
          longitude_partida?: number | null
          nome?: string
          objetivo?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["roteiro_status"]
          tempo_estimado?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      system_errors: {
        Row: {
          context: Json | null
          created_at: string | null
          error_code: string | null
          error_message: string
          gabinete_id: string | null
          id: string
          page_url: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          stack_trace: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          error_code?: string | null
          error_message: string
          gabinete_id?: string | null
          id?: string
          page_url?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          stack_trace?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string
          gabinete_id?: string | null
          id?: string
          page_url?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          stack_trace?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_errors_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: false
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          },
        ]
      }
      system_user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["system_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["system_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["system_role"]
          user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          cor: string
          created_at: string
          gabinete_id: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          cor?: string
          created_at?: string
          gabinete_id: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          cor?: string
          created_at?: string
          gabinete_id?: string
          id?: string
          nome?: string
          updated_at?: string
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
      user_notification_preferences: {
        Row: {
          created_at: string | null
          deadline_reminders: boolean | null
          email_notifications: boolean | null
          gabinete_id: string
          id: string
          internal_notifications: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deadline_reminders?: boolean | null
          email_notifications?: boolean | null
          gabinete_id: string
          id?: string
          internal_notifications?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deadline_reminders?: boolean | null
          email_notifications?: boolean | null
          gabinete_id?: string
          id?: string
          internal_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_preferences_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: false
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission: Database["public"]["Enums"]["permission_type"]
          user_gabinete_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission: Database["public"]["Enums"]["permission_type"]
          user_gabinete_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["permission_type"]
          user_gabinete_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_user_gabinete_id_fkey"
            columns: ["user_gabinete_id"]
            isOneToOne: false
            referencedRelation: "user_gabinetes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_errors: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_notification: {
        Args: {
          _entity_id?: string
          _entity_type?: string
          _gabinete_id: string
          _message: string
          _title: string
          _type: Database["public"]["Enums"]["notification_type"]
          _user_id: string
        }
        Returns: string
      }
      generate_codigo_indicacao: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_gabinete_slug: {
        Args: { gabinete_nome: string }
        Returns: string
      }
      generate_portal_slug: {
        Args: { gabinete_nome: string }
        Returns: string
      }
      get_user_gabinetes_ids: {
        Args: { _user_id: string }
        Returns: {
          gabinete_id: string
        }[]
      }
      has_system_role: {
        Args: {
          _role: Database["public"]["Enums"]["system_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit_action: {
        Args: {
          _action: Database["public"]["Enums"]["audit_action"]
          _details?: Json
          _entity_id?: string
          _entity_type?: Database["public"]["Enums"]["audit_entity"]
          _gabinete_id: string
        }
        Returns: undefined
      }
      unaccent: {
        Args: { "": string }
        Returns: string
      }
      unaccent_init: {
        Args: { "": unknown }
        Returns: unknown
      }
      user_gabinete_role: {
        Args: { _gabinete_id: string; _user_id: string }
        Returns: string
      }
      user_has_gabinete_access: {
        Args: { gabinete_uuid: string }
        Returns: boolean
      }
      user_has_permission: {
        Args: {
          _gabinete_id: string
          _permission: Database["public"]["Enums"]["permission_type"]
        }
        Returns: boolean
      }
      user_is_gabinete_admin: {
        Args: { _gabinete_id: string; _user_id?: string }
        Returns: boolean
      }
      user_is_gabinete_owner: {
        Args: { _gabinete_id: string; _user_id?: string }
        Returns: boolean
      }
    }
    Enums: {
      audit_action:
        | "create"
        | "update"
        | "delete"
        | "login"
        | "logout"
        | "permission_change"
        | "user_created"
        | "user_disabled"
        | "user_deleted"
      audit_entity:
        | "eleitor"
        | "demanda"
        | "agenda"
        | "roteiro"
        | "tag"
        | "user"
        | "gabinete"
        | "permission"
      cargo_politico:
        | "vereador"
        | "prefeito"
        | "deputado_estadual"
        | "deputado_federal"
        | "senador"
      demanda_prioridade: "baixa" | "media" | "alta" | "urgente"
      demanda_status: "aberta" | "em_andamento" | "concluida" | "cancelada"
      notification_type:
        | "demanda_atribuida"
        | "demanda_atualizada"
        | "demanda_comentario"
        | "demanda_concluida"
        | "evento_proximo"
        | "roteiro_atribuido"
      permission_type:
        | "view_eleitores"
        | "create_eleitores"
        | "edit_eleitores"
        | "delete_eleitores"
        | "view_demandas"
        | "create_demandas"
        | "edit_demandas"
        | "delete_demandas"
        | "view_agenda"
        | "create_agenda"
        | "edit_agenda"
        | "delete_agenda"
        | "view_roteiros"
        | "create_roteiros"
        | "edit_roteiros"
        | "delete_roteiros"
        | "view_relatorios"
        | "manage_users"
        | "manage_settings"
        | "view_mapa"
      roteiro_status: "planejado" | "em_andamento" | "concluido" | "cancelado"
      system_role: "superowner" | "support"
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
      audit_action: [
        "create",
        "update",
        "delete",
        "login",
        "logout",
        "permission_change",
        "user_created",
        "user_disabled",
        "user_deleted",
      ],
      audit_entity: [
        "eleitor",
        "demanda",
        "agenda",
        "roteiro",
        "tag",
        "user",
        "gabinete",
        "permission",
      ],
      cargo_politico: [
        "vereador",
        "prefeito",
        "deputado_estadual",
        "deputado_federal",
        "senador",
      ],
      demanda_prioridade: ["baixa", "media", "alta", "urgente"],
      demanda_status: ["aberta", "em_andamento", "concluida", "cancelada"],
      notification_type: [
        "demanda_atribuida",
        "demanda_atualizada",
        "demanda_comentario",
        "demanda_concluida",
        "evento_proximo",
        "roteiro_atribuido",
      ],
      permission_type: [
        "view_eleitores",
        "create_eleitores",
        "edit_eleitores",
        "delete_eleitores",
        "view_demandas",
        "create_demandas",
        "edit_demandas",
        "delete_demandas",
        "view_agenda",
        "create_agenda",
        "edit_agenda",
        "delete_agenda",
        "view_roteiros",
        "create_roteiros",
        "edit_roteiros",
        "delete_roteiros",
        "view_relatorios",
        "manage_users",
        "manage_settings",
        "view_mapa",
      ],
      roteiro_status: ["planejado", "em_andamento", "concluido", "cancelado"],
      system_role: ["superowner", "support"],
      user_role: ["owner", "admin", "assessor"],
    },
  },
} as const
