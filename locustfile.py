"""
Testes de Carga com Locust para o Sistema de Gestão de Gabinete

Execute com: locust -f locustfile.py --host=https://vupyblqvmszzpyaddfda.supabase.co
"""

from locust import HttpUser, task, between
import json
import random

# Configurações do Supabase
SUPABASE_URL = "https://vupyblqvmszzpyaddfda.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1cHlibHF2bXN6enB5YWRkZmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NDI4NzQsImV4cCI6MjA3NTExODg3NH0.liE3k_zCrOBRmDunHGzwrKwWwwVMuCna_Du1cTmqUqE"

# Credenciais de teste (crie um usuário de teste específico para os testes de carga)
TEST_USER_EMAIL = "teste.locust@example.com"
TEST_USER_PASSWORD = "SenhaSegura123!"
TEST_GABINETE_ID = "b3fece27-3d0e-4e33-9f2d-fad0c8f96198"


class SupabaseUser(HttpUser):
    """Usuário base com autenticação no Supabase"""
    
    wait_time = between(1, 3)  # Tempo de espera entre requisições (1-3 segundos)
    
    def on_start(self):
        """Executa login antes de iniciar os testes"""
        self.access_token = None
        self.headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Content-Type": "application/json",
            "x-client-info": "locust-load-test/1.0.0"
        }
        self.login()
    
    def login(self):
        """Realiza login e obtém token de acesso"""
        response = self.client.post(
            "/auth/v1/token?grant_type=password",
            json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD,
                "gotrue_meta_security": {}
            },
            headers=self.headers,
            name="Auth - Login"
        )
        
        if response.status_code == 200:
            data = response.json()
            self.access_token = data.get("access_token")
            self.headers["authorization"] = f"Bearer {self.access_token}"
        else:
            print(f"Falha no login: {response.status_code} - {response.text}")


class EleitoresUser(SupabaseUser):
    """Testes relacionados a eleitores"""
    
    @task(3)
    def list_eleitores(self):
        """Lista eleitores com paginação"""
        self.client.get(
            f"/rest/v1/eleitores?select=*&gabinete_id=eq.{TEST_GABINETE_ID}&deleted_at=is.null&limit=50",
            headers={**self.headers, "accept-profile": "public"},
            name="Eleitores - Listar"
        )
    
    @task(2)
    def count_eleitores(self):
        """Conta total de eleitores"""
        self.client.head(
            f"/rest/v1/eleitores?select=*&gabinete_id=eq.{TEST_GABINETE_ID}&deleted_at=is.null",
            headers={**self.headers, "accept-profile": "public", "prefer": "count=exact"},
            name="Eleitores - Contar"
        )
    
    @task(1)
    def search_eleitores_by_cidade(self):
        """Busca eleitores por cidade"""
        cidades = ["Guaíba", "Porto Alegre", "Canoas"]
        cidade = random.choice(cidades)
        self.client.get(
            f"/rest/v1/eleitores?select=*&gabinete_id=eq.{TEST_GABINETE_ID}&cidade=ilike.%25{cidade}%25&deleted_at=is.null",
            headers={**self.headers, "accept-profile": "public"},
            name="Eleitores - Buscar por Cidade"
        )
    
    @task(1)
    def get_aniversariantes(self):
        """Lista aniversariantes do mês"""
        self.client.get(
            f"/rest/v1/eleitores?select=data_nascimento&gabinete_id=eq.{TEST_GABINETE_ID}&data_nascimento=not.is.null&deleted_at=is.null",
            headers={**self.headers, "accept-profile": "public"},
            name="Eleitores - Aniversariantes"
        )


class DemandasUser(SupabaseUser):
    """Testes relacionados a demandas"""
    
    @task(3)
    def list_demandas(self):
        """Lista demandas abertas"""
        self.client.head(
            f"/rest/v1/demandas?select=*&gabinete_id=eq.{TEST_GABINETE_ID}&status=eq.aberta",
            headers={**self.headers, "accept-profile": "public", "prefer": "count=exact"},
            name="Demandas - Listar Abertas"
        )
    
    @task(2)
    def list_demandas_vencendo(self):
        """Lista demandas vencendo hoje"""
        from datetime import date
        hoje = date.today().isoformat()
        self.client.head(
            f"/rest/v1/demandas?select=*&gabinete_id=eq.{TEST_GABINETE_ID}&prazo=eq.{hoje}&status=neq.concluida",
            headers={**self.headers, "accept-profile": "public", "prefer": "count=exact"},
            name="Demandas - Vencendo Hoje"
        )
    
    @task(1)
    def list_demandas_atrasadas(self):
        """Lista demandas atrasadas"""
        from datetime import date
        hoje = date.today().isoformat()
        self.client.head(
            f"/rest/v1/demandas?select=*&gabinete_id=eq.{TEST_GABINETE_ID}&prazo=lt.{hoje}&status=neq.concluida",
            headers={**self.headers, "accept-profile": "public", "prefer": "count=exact"},
            name="Demandas - Atrasadas"
        )


class AgendaUser(SupabaseUser):
    """Testes relacionados à agenda"""
    
    @task(3)
    def list_eventos_mes(self):
        """Lista eventos do mês"""
        from datetime import date, timedelta
        hoje = date.today()
        inicio_mes = date(hoje.year, hoje.month, 1)
        if hoje.month == 12:
            fim_mes = date(hoje.year + 1, 1, 1) - timedelta(days=1)
        else:
            fim_mes = date(hoje.year, hoje.month + 1, 1) - timedelta(days=1)
        
        self.client.get(
            f"/rest/v1/agenda?select=*&gabinete_id=eq.{TEST_GABINETE_ID}&data_inicio=gte.{inicio_mes}T03:00:00.000Z&data_inicio=lte.{fim_mes}T02:59:59.999Z&order=data_inicio.asc",
            headers={**self.headers, "accept-profile": "public"},
            name="Agenda - Eventos do Mês"
        )
    
    @task(2)
    def count_eventos_hoje(self):
        """Conta eventos de hoje"""
        from datetime import date
        hoje = date.today().isoformat()
        self.client.head(
            f"/rest/v1/agenda?select=*&gabinete_id=eq.{TEST_GABINETE_ID}&data_inicio=gte.{hoje}T00:00:00&data_inicio=lt.{hoje}T23:59:59",
            headers={**self.headers, "accept-profile": "public", "prefer": "count=exact"},
            name="Agenda - Eventos Hoje"
        )


class PerformanceMetricsUser(SupabaseUser):
    """Testes relacionados a métricas de performance"""
    
    @task(1)
    def track_page_load(self):
        """Simula envio de métrica de page load"""
        self.client.post(
            "/rest/v1/performance_metrics",
            json={
                "metric_type": "page_load",
                "endpoint": "/inicio",
                "duration_ms": random.randint(500, 3000),
                "gabinete_id": TEST_GABINETE_ID,
                "metadata": {
                    "domInteractive": random.randint(300, 1000),
                    "domContentLoaded": random.randint(800, 2000),
                    "firstPaint": random.randint(200, 800)
                }
            },
            headers={**self.headers, "content-profile": "public"},
            name="Métricas - Page Load"
        )


class EdgeFunctionsUser(SupabaseUser):
    """Testes relacionados às Edge Functions"""
    
    @task(1)
    def get_database_metrics(self):
        """Obtém métricas do banco de dados"""
        self.client.post(
            "/functions/v1/get-database-metrics",
            headers=self.headers,
            name="Edge Function - Database Metrics"
        )


class MixedWorkloadUser(SupabaseUser):
    """Simula um usuário real usando várias funcionalidades"""
    
    @task(5)
    def fluxo_visualizar_dashboard(self):
        """Fluxo: Usuário acessa dashboard e visualiza estatísticas"""
        # Conta eleitores
        self.client.head(
            f"/rest/v1/eleitores?select=*&gabinete_id=eq.{TEST_GABINETE_ID}&deleted_at=is.null",
            headers={**self.headers, "accept-profile": "public", "prefer": "count=exact"},
            name="Dashboard - Contar Eleitores"
        )
        
        # Conta demandas abertas
        self.client.head(
            f"/rest/v1/demandas?select=*&gabinete_id=eq.{TEST_GABINETE_ID}&status=eq.aberta",
            headers={**self.headers, "accept-profile": "public", "prefer": "count=exact"},
            name="Dashboard - Contar Demandas"
        )
        
        # Conta eventos do dia
        from datetime import date
        hoje = date.today().isoformat()
        self.client.head(
            f"/rest/v1/agenda?select=*&gabinete_id=eq.{TEST_GABINETE_ID}&data_inicio=gte.{hoje}T00:00:00&data_inicio=lt.{hoje}T23:59:59",
            headers={**self.headers, "accept-profile": "public", "prefer": "count=exact"},
            name="Dashboard - Eventos Hoje"
        )
    
    @task(3)
    def fluxo_gerenciar_eleitores(self):
        """Fluxo: Usuário gerencia eleitores"""
        # Lista eleitores
        self.client.get(
            f"/rest/v1/eleitores?select=*&gabinete_id=eq.{TEST_GABINETE_ID}&deleted_at=is.null&limit=50",
            headers={**self.headers, "accept-profile": "public"},
            name="Eleitores - Listar Página"
        )
    
    @task(2)
    def fluxo_consultar_agenda(self):
        """Fluxo: Usuário consulta agenda do mês"""
        from datetime import date, timedelta
        hoje = date.today()
        inicio_mes = date(hoje.year, hoje.month, 1)
        
        self.client.get(
            f"/rest/v1/agenda?select=*&gabinete_id=eq.{TEST_GABINETE_ID}&data_inicio=gte.{inicio_mes}T03:00:00.000Z&order=data_inicio.asc",
            headers={**self.headers, "accept-profile": "public"},
            name="Agenda - Consultar Mês"
        )
