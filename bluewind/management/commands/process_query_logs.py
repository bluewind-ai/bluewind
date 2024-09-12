import os
import re
import time

from django.apps import apps
from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from query_logs.models import QueryLog


class Command(BaseCommand):
    help = "Process query logs and insert into database"

    def handle(self, *args, **options):
        log_file = os.path.join(settings.BASE_DIR, "logs", "db_queries.log")

        while True:
            self.process_log_file(log_file)
            time.sleep(1)  # Wait for 1 second before processing again

    def process_log_file(self, log_file):
        if not os.path.exists(log_file):
            return

        with open(log_file, "r+") as f:
            content = f.read()
            f.truncate(0)  # Clear the file after reading

        # Split the content into individual log entries
        log_entries = re.split(r"(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3})", content)[
            1:
        ]  # Skip the first empty element

        for i in range(0, len(log_entries), 2):
            if i + 1 < len(log_entries):
                timestamp = log_entries[i]
                message = log_entries[i + 1].strip()

                try:
                    # Parse the log entry
                    match = re.match(r"\[(\w+)\] (.+)", message)
                    if not match:
                        self.stderr.write(
                            self.style.WARNING(
                                f"Skipping malformed line: {message[:100]}..."
                            )
                        )
                        continue

                    level, sql = match.groups()

                    # Extract execution time if present
                    execution_time = None
                    time_match = re.search(r"\((\d+\.\d+)\)", sql)
                    if time_match:
                        execution_time = float(time_match.group(1))

                    # Extract params if present
                    params = ""
                    if "PARAMS = " in sql:
                        sql, params = sql.split("PARAMS = ")
                        sql = sql.replace("SQL = ", "").strip()
                        params = params.strip()

                    # Truncate sql and params if they're too long
                    sql = sql[:10000] if len(sql) > 10000 else sql
                    params = params[:1000] if len(params) > 1000 else params

                    # Infer app_label from the SQL query
                    app_label = self.infer_app_label(sql)

                    QueryLog.objects.create(
                        timestamp=timezone.datetime.strptime(
                            timestamp.strip(), "%Y-%m-%d %H:%M:%S,%f"
                        ),
                        logger_name="django.db.backends",
                        level=level,
                        sql=sql,
                        params=params,
                        execution_time=execution_time,
                        workspace_id=1,
                        user_id=1,
                        app_label=app_label,
                    )
                except Exception as e:
                    self.stderr.write(
                        self.style.ERROR(f"Error processing log entry: {e}")
                    )
                    self.stderr.write(
                        self.style.ERROR(
                            f"Problematic entry: {timestamp} {message[:100]}..."
                        )
                    )

        self.stdout.write(
            self.style.SUCCESS(f"Processed {len(log_entries)//2} log entries")
        )

    def infer_app_label(self, sql):
        for app_config in apps.get_app_configs():
            if app_config.name in sql.lower():
                return app_config.label
        return None
