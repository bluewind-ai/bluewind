import logging
import re

from django.conf import settings
from django.http import HttpResponse

logger = logging.getLogger("django.temp")


class VSCodeLinkMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if (
            settings.DEBUG
            and isinstance(response, HttpResponse)
            and response.status_code == 500
        ):
            try:
                content = response.content.decode("utf-8")
                original_content = content

                # Target specifically the exception location span and include the line number
                content = re.sub(
                    r'(<span class="fname">(/.+?)</span>), line (\d+), in',
                    lambda m: f'<a href="vscode://file{m.group(2)}:{m.group(3)}">{m.group(1)}, line {m.group(3)}</a>, in',
                    content,
                )

                if content != original_content:
                    logger.info(
                        "VSCodeLinkMiddleware: Links were added to the error page."
                    )
                    response.content = content.encode("utf-8")
                else:
                    logger.warning(
                        "VSCodeLinkMiddleware: No file paths found to convert to links."
                    )

                # Log the relevant part of the modified content
                match = re.search(
                    r"<tr>\s*<th[^>]*>Exception Location:</th>.*?</tr>",
                    content,
                    re.DOTALL,
                )
                if match:
                    logger.debug(
                        f"VSCodeLinkMiddleware: Modified exception location:\n{match.group(0)}"
                    )

            except Exception as e:
                logger.error(
                    f"VSCodeLinkMiddleware: Error processing response: {str(e)}"
                )

        return response
