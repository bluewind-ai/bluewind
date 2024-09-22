import time

from django.http import HttpResponse


# @silk_profile
def health_check(request):
    time.sleep(10)
    return HttpResponse("OK", status=200)
