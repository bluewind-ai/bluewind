def show_toolbar(request):
    return True
    return (
        "XMLHttpRequest" not in request.headers.get("x-requested-with", "")
        and request.user
        and request.user.username == "wayne@bluewind.ai"
    )
