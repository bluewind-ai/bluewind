from django.shortcuts import redirect

from bluewind.context_variables import get_request_id, get_workspace_id
from incoming_http_requests.models import IncomingHTTPRequest


def custom_middleware(get_response):
    def middleware(request):
        user_id = request.user.id if request.user.is_authenticated else 2
        workspace_id = get_workspace_id()

        request_id = get_request_id()

        IncomingHTTPRequest.objects.filter(id=request_id).update(user_id=user_id)

        if request.path == "/":
            return get_response(request)
        if request.path == "/accounts/login/":
            return get_response(request)
        if not request.user.is_authenticated:
            return redirect("/accounts/login/")

        response = get_response(request)
        # log_records = get_log_records()

        # with open("logs/request_id.log", "a") as f:
        #     f.write(str(log_records) + "\n")

        return response

    return middleware
