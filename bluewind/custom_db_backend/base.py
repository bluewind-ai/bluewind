# bluewind/custom_db_backend.py

import logging

from django.conf import settings
from django.db.backends.postgresql import base

logger = logging.getLogger(__name__)


class FilteringCursorWrapper(base.CursorDebugWrapper):
    def execute(self, sql, params=None):
        logger.debug(f"FilteringCursorWrapper execute: {sql}")
        if not any(table in sql.lower() for table in settings.NO_LOG_TABLES):
            return self.cursor.execute(sql, params)
        logger.debug(f"Filtered out SQL: {sql}")
        return super().execute(sql, params)

    def executemany(self, sql, param_list):
        logger.debug(f"FilteringCursorWrapper executemany: {sql}")
        if not any(table in sql.lower() for table in settings.NO_LOG_TABLES):
            return self.cursor.executemany(sql, param_list)
        logger.debug(f"Filtered out SQL: {sql}")
        return super().executemany(sql, param_list)


class DatabaseWrapper(base.DatabaseWrapper):
    def make_debug_cursor(self, cursor):
        return FilteringCursorWrapper(cursor, self)
