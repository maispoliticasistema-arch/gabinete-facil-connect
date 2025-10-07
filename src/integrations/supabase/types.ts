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
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
      archived_audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          archived_at: string
          details: Json | null
          entity_id: string | null
          entity_type: Database["public"]["Enums"]["audit_entity"] | null
          gabinete_id: string
          id: string
          ip_address: string | null
          original_created_at: string
          original_log_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          archived_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["audit_entity"] | null
          gabinete_id: string
          id?: string
          ip_address?: string | null
          original_created_at: string
          original_log_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          archived_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["audit_entity"] | null
          gabinete_id?: string
          id?: string
          ip_address?: string | null
          original_created_at?: string
          original_log_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
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
      criadores_externos: {
        Row: {
          created_at: string
          gabinete_id: string
          id: string
          nome_externo: string
          updated_at: string
          user_id_mapeado: string | null
        }
        Insert: {
          created_at?: string
          gabinete_id: string
          id?: string
          nome_externo: string
          updated_at?: string
          user_id_mapeado?: string | null
        }
        Update: {
          created_at?: string
          gabinete_id?: string
          id?: string
          nome_externo?: string
          updated_at?: string
          user_id_mapeado?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "criadores_externos_gabinete_id_fkey"
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
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
          complemento: string | null
          cpf: string | null
          created_at: string | null
          criador_externo_id: string | null
          data_nascimento: string | null
          deleted_at: string | null
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
          sexo: string | null
          telefone: string | null
          updated_at: string | null
          via_link_indicacao: boolean | null
        }
        Insert: {
          bairro?: string | null
          cadastrado_por?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string | null
          criador_externo_id?: string | null
          data_nascimento?: string | null
          deleted_at?: string | null
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
          sexo?: string | null
          telefone?: string | null
          updated_at?: string | null
          via_link_indicacao?: boolean | null
        }
        Update: {
          bairro?: string | null
          cadastrado_por?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string | null
          criador_externo_id?: string | null
          data_nascimento?: string | null
          deleted_at?: string | null
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
          sexo?: string | null
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
            foreignKeyName: "eleitores_criador_externo_id_fkey"
            columns: ["criador_externo_id"]
            isOneToOne: false
            referencedRelation: "criadores_externos"
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
      form_submission_rate_limits: {
        Row: {
          attempts: number | null
          blocked_until: string | null
          created_at: string | null
          first_attempt_at: string | null
          form_id: string
          id: string
          ip_address: string
          last_attempt_at: string | null
        }
        Insert: {
          attempts?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt_at?: string | null
          form_id: string
          id?: string
          ip_address: string
          last_attempt_at?: string | null
        }
        Update: {
          attempts?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt_at?: string | null
          form_id?: string
          id?: string
          ip_address?: string
          last_attempt_at?: string | null
        }
        Relationships: []
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
          bairro: string | null
          cargo: Database["public"]["Enums"]["cargo_politico"] | null
          cep: string | null
          cidade: string | null
          created_at: string | null
          descricao: string | null
          endereco_completo: string | null
          estado: string | null
          id: string
          nome: string
          numero: string | null
          slogan: string | null
          updated_at: string | null
        }
        Insert: {
          bairro?: string | null
          cargo?: Database["public"]["Enums"]["cargo_politico"] | null
          cep?: string | null
          cidade?: string | null
          created_at?: string | null
          descricao?: string | null
          endereco_completo?: string | null
          estado?: string | null
          id?: string
          nome: string
          numero?: string | null
          slogan?: string | null
          updated_at?: string | null
        }
        Update: {
          bairro?: string | null
          cargo?: Database["public"]["Enums"]["cargo_politico"] | null
          cep?: string | null
          cidade?: string | null
          created_at?: string | null
          descricao?: string | null
          endereco_completo?: string | null
          estado?: string | null
          id?: string
          nome?: string
          numero?: string | null
          slogan?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      infrastructure_metrics: {
        Row: {
          active_connections: number | null
          cache_hit_rate: number | null
          cpu_percent: number | null
          created_at: string
          database_size_bytes: number | null
          disk_usage_percent: number | null
          id: string
          memory_percent: number | null
          queries_per_second: number | null
        }
        Insert: {
          active_connections?: number | null
          cache_hit_rate?: number | null
          cpu_percent?: number | null
          created_at?: string
          database_size_bytes?: number | null
          disk_usage_percent?: number | null
          id?: string
          memory_percent?: number | null
          queries_per_second?: number | null
        }
        Update: {
          active_connections?: number | null
          cache_hit_rate?: number | null
          cpu_percent?: number | null
          created_at?: string
          database_size_bytes?: number | null
          disk_usage_percent?: number | null
          id?: string
          memory_percent?: number | null
          queries_per_second?: number | null
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
      performance_metrics: {
        Row: {
          created_at: string | null
          duration_ms: number
          endpoint: string | null
          gabinete_id: string | null
          id: string
          is_slow: boolean | null
          metadata: Json | null
          metric_type: string
          status_code: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_ms: number
          endpoint?: string | null
          gabinete_id?: string | null
          id?: string
          is_slow?: boolean | null
          metadata?: Json | null
          metric_type: string
          status_code?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_ms?: number
          endpoint?: string | null
          gabinete_id?: string | null
          id?: string
          is_slow?: boolean | null
          metadata?: Json | null
          metric_type?: string
          status_code?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_metrics_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: false
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_template_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission: Database["public"]["Enums"]["permission_type"]
          template_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission: Database["public"]["Enums"]["permission_type"]
          template_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["permission_type"]
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_template_permissions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "permission_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_templates: {
        Row: {
          created_at: string | null
          descricao: string | null
          gabinete_id: string
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          gabinete_id: string
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          gabinete_id?: string
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permission_templates_gabinete_id_fkey"
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
            isOneToOne: false
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
      registration_rate_limits: {
        Row: {
          attempts: number | null
          blocked_until: string | null
          created_at: string | null
          first_attempt_at: string | null
          gabinete_id: string
          id: string
          ip_address: string
          last_attempt_at: string | null
        }
        Insert: {
          attempts?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt_at?: string | null
          gabinete_id: string
          id?: string
          ip_address: string
          last_attempt_at?: string | null
        }
        Update: {
          attempts?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt_at?: string | null
          gabinete_id?: string
          id?: string
          ip_address?: string
          last_attempt_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_rate_limits_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: false
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          },
        ]
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
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
      slow_queries: {
        Row: {
          context: Json | null
          created_at: string | null
          duration_ms: number
          gabinete_id: string | null
          id: string
          query_text: string
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          duration_ms: number
          gabinete_id?: string | null
          id?: string
          query_text: string
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          duration_ms?: number
          gabinete_id?: string | null
          id?: string
          query_text?: string
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "slow_queries_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: false
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          },
        ]
      }
      system_alerts: {
        Row: {
          alert_type: string
          auto_resolved: boolean | null
          created_at: string | null
          id: string
          message: string
          metric_value: number | null
          resolved: boolean | null
          resolved_at: string | null
          severity: string
          threshold_value: number | null
          title: string
        }
        Insert: {
          alert_type: string
          auto_resolved?: boolean | null
          created_at?: string | null
          id?: string
          message: string
          metric_value?: number | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity: string
          threshold_value?: number | null
          title: string
        }
        Update: {
          alert_type?: string
          auto_resolved?: boolean | null
          created_at?: string | null
          id?: string
          message?: string
          metric_value?: number | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string
          threshold_value?: number | null
          title?: string
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
      system_metrics_hourly: {
        Row: {
          active_gabinetes: number
          active_users: number
          avg_response_time_ms: number
          cpu_usage_percent: number | null
          created_at: string | null
          error_count: number
          hour_timestamp: string
          id: string
          memory_usage_percent: number | null
          slow_query_count: number
          total_requests: number
        }
        Insert: {
          active_gabinetes: number
          active_users: number
          avg_response_time_ms: number
          cpu_usage_percent?: number | null
          created_at?: string | null
          error_count: number
          hour_timestamp: string
          id?: string
          memory_usage_percent?: number | null
          slow_query_count: number
          total_requests: number
        }
        Update: {
          active_gabinetes?: number
          active_users?: number
          avg_response_time_ms?: number
          cpu_usage_percent?: number | null
          created_at?: string | null
          error_count?: number
          hour_timestamp?: string
          id?: string
          memory_usage_percent?: number | null
          slow_query_count?: number
          total_requests?: number
        }
        Relationships: []
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
          deleted_at: string | null
          gabinete_id: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          cor?: string
          created_at?: string
          deleted_at?: string | null
          gabinete_id: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          cor?: string
          created_at?: string
          deleted_at?: string | null
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
      aggregate_hourly_metrics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_and_create_alerts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_errors: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_rate_limits: {
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
      get_active_connections: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_cache_hit_rate: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_database_size: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_system_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          cpu_percent: number
          memory_percent: number
        }[]
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
      mask_cpf: {
        Args: { cpf: string }
        Returns: string
      }
      mask_rg: {
        Args: { rg: string }
        Returns: string
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
      validate_public_registration: {
        Args: {
          _cadastrado_por: string
          _gabinete_id: string
          _ip_address?: string
        }
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
        | "export_report"
        | "import_data"
      audit_entity:
        | "eleitor"
        | "demanda"
        | "agenda"
        | "roteiro"
        | "tag"
        | "user"
        | "gabinete"
        | "permission"
        | "relatorio"
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
        | "import_eleitores"
        | "export_eleitores"
        | "manage_tags"
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
        "export_report",
        "import_data",
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
        "relatorio",
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
        "import_eleitores",
        "export_eleitores",
        "manage_tags",
      ],
      roteiro_status: ["planejado", "em_andamento", "concluido", "cancelado"],
      system_role: ["superowner", "support"],
      user_role: ["owner", "admin", "assessor"],
    },
  },
} as const
