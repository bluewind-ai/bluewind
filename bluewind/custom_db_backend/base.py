import logging

from django.conf import settings
from django.db.backends.postgresql import base
from django.utils import timezone

logger = logging.getLogger(__name__)


class FilteringCursorWrapper(base.CursorDebugWrapper):
    def execute(self, sql, params=None):
        start_time = timezone.now()
        try:
            return super().execute(sql, params)
        finally:
            self.log_query(sql, params, start_time)

    def executemany(self, sql, param_list):
        start_time = timezone.now()
        try:
            return super().executemany(sql, param_list)
        finally:
            self.log_query(sql, param_list, start_time)

    def log_query(self, sql, params, start_time):
        # Check if the query is related to QueryLog
        if "query_logs_querylog" in sql.lower():
            return  # Skip logging for QueryLog-related queries

        from query_logs.models import QueryLog  # Import here to avoid circular import

        if any(table in sql.lower() for table in settings.NO_LOG_TABLES):
            logger.debug(f"Filtered out SQL: {sql}")
            return

        execution_time = (timezone.now() - start_time).total_seconds()

        # Truncate sql and params if they're too long
        sql = sql[:10000] if len(sql) > 10000 else sql
        params_str = (
            str(params)[:1000] if params and len(str(params)) > 1000 else str(params)
        )

        # Infer app_label from the SQL query (you may need to implement this method)
        app_label = self.infer_app_label(sql)

        QueryLog.objects.create(
            timestamp=timezone.now(),
            logger_name="django.db.backends",
            level="DEBUG",
            sql=sql,
            params=params_str,
            execution_time=execution_time,
            workspace_id=1,
            user_id=1,
            app_label=app_label,
        )

    def infer_app_label(self, sql):
        # Implement this method to infer the app_label from the SQL query
        # You can use the same logic as in your original Command class
        pass


class DatabaseWrapper(base.DatabaseWrapper):
    def make_debug_cursor(self, cursor):
        return FilteringCursorWrapper(cursor, self)
