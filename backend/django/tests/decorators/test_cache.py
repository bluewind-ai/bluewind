from unittest import mock

from asgiref.sync import iscoroutinefunction

from django.http import HttpRequest, HttpResponse
from django.test import SimpleTestCase
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_control, cache_page, never_cache


class HttpRequestProxy:
    def __init__(self, request):
        self._request = request

    def __getattr__(self, attr):
        """Proxy to the underlying HttpRequest object."""
        return getattr(self._request, attr)


class CacheControlDecoratorTest(SimpleTestCase):
    def test_wrapped_sync_function_is_not_coroutine_function(self):
        def sync_view(request):
            return HttpResponse()

        wrapped_view = cache_control()(sync_view)
        self.assertIs(iscoroutinefunction(wrapped_view), False)

    def test_wrapped_async_function_is_coroutine_function(self):
        async def async_view(request):
            return HttpResponse()

        wrapped_view = cache_control()(async_view)
        self.assertIs(iscoroutinefunction(wrapped_view), True)

    def test_cache_control_decorator_http_request(self):
        class MyClass:
            @cache_control(a="b")
            def a_view(self, request):
                return HttpResponse()

        msg = (
            "cache_control didn't receive an HttpRequest. If you are "
            "decorating a classmethod, be sure to use @method_decorator."
        )
        request = HttpRequest()
        with self.assertRaisesMessage(TypeError, msg):
            MyClass().a_view(request)
        with self.assertRaisesMessage(TypeError, msg):
            MyClass().a_view(HttpRequestProxy(request))

    async def test_cache_control_decorator_http_request_async_view(self):
        class MyClass:
            @cache_control(a="b")
            async def async_view(self, request):
                return HttpResponse()

        msg = (
            "cache_control didn't receive an HttpRequest. If you are decorating a "
            "classmethod, be sure to use @method_decorator."
        )
        request = HttpRequest()
        with self.assertRaisesMessage(TypeError, msg):
            await MyClass().async_view(request)
        with self.assertRaisesMessage(TypeError, msg):
            await MyClass().async_view(HttpRequestProxy(request))

    def test_cache_control_decorator_http_request_proxy(self):
        class MyClass:
            @method_decorator(cache_control(a="b"))
            def a_view(self, request):
                return HttpResponse()

        request = HttpRequest()
        response = MyClass().a_view(HttpRequestProxy(request))
        self.assertEqual(response.headers["Cache-Control"], "a=b")

    def test_cache_control_empty_decorator(self):
        @cache_control()
        def a_view(request):
            return HttpResponse()

        response = a_view(HttpRequest())
        self.assertEqual(response.get("Cache-Control"), "")

    async def test_cache_control_empty_decorator_async_view(self):
        @cache_control()
        async def async_view(request):
            return HttpResponse()

        response = await async_view(HttpRequest())
        self.assertEqual(response.get("Cache-Control"), "")

    def test_cache_control_full_decorator(self):
        @cache_control(max_age=123, private=True, public=True, custom=456)
        def a_view(request):
            return HttpResponse()

        response = a_view(HttpRequest())
        cache_control_items = response.get("Cache-Control").split(", ")
        self.assertEqual(
            set(cache_control_items), {"max-age=123", "private", "public", "custom=456"}
        )

    async def test_cache_control_full_decorator_async_view(self):
        @cache_control(max_age=123, private=True, public=True, custom=456)
        async def async_view(request):
            return HttpResponse()

        response = await async_view(HttpRequest())
        cache_control_items = response.get("Cache-Control").split(", ")
        self.assertEqual(
            set(cache_control_items), {"max-age=123", "private", "public", "custom=456"}
        )


class CachePageDecoratorTest(SimpleTestCase):
    def test_cache_page(self):
        def my_view(request):
            return "response"

        my_view_cached = cache_page(123)(my_view)
        self.assertEqual(my_view_cached(HttpRequest()), "response")
        my_view_cached2 = cache_page(123, key_prefix="test")(my_view)
        self.assertEqual(my_view_cached2(HttpRequest()), "response")


class NeverCacheDecoratorTest(SimpleTestCase):
    def test_wrapped_sync_function_is_not_coroutine_function(self):
        def sync_view(request):
            return HttpResponse()

        wrapped_view = never_cache(sync_view)
        self.assertIs(iscoroutinefunction(wrapped_view), False)

    def test_wrapped_async_function_is_coroutine_function(self):
        async def async_view(request):
            return HttpResponse()

        wrapped_view = never_cache(async_view)
        self.assertIs(iscoroutinefunction(wrapped_view), True)

    @mock.patch("time.time")
    def test_never_cache_decorator_headers(self, mocked_time):
        @never_cache
        def a_view(request):
            return HttpResponse()

        mocked_time.return_value = 1167616461.0
        response = a_view(HttpRequest())
        self.assertEqual(
            response.headers["Expires"],
            "Mon, 01 Jan 2007 01:54:21 GMT",
        )
        self.assertEqual(
            response.headers["Cache-Control"],
            "max-age=0, no-cache, no-store, must-revalidate, private",
        )

    @mock.patch("time.time")
    async def test_never_cache_decorator_headers_async_view(self, mocked_time):
        @never_cache
        async def async_view(request):
            return HttpResponse()

        mocked_time.return_value = 1167616461.0
        response = await async_view(HttpRequest())
        self.assertEqual(response.headers["Expires"], "Mon, 01 Jan 2007 01:54:21 GMT")
        self.assertEqual(
            response.headers["Cache-Control"],
            "max-age=0, no-cache, no-store, must-revalidate, private",
        )

    def test_never_cache_decorator_expires_not_overridden(self):
        @never_cache
        def a_view(request):
            return HttpResponse(headers={"Expires": "tomorrow"})

        response = a_view(HttpRequest())
        self.assertEqual(response.headers["Expires"], "tomorrow")

    async def test_never_cache_decorator_expires_not_overridden_async_view(self):
        @never_cache
        async def async_view(request):
            return HttpResponse(headers={"Expires": "tomorrow"})

        response = await async_view(HttpRequest())
        self.assertEqual(response.headers["Expires"], "tomorrow")

    def test_never_cache_decorator_http_request(self):
        class MyClass:
            @never_cache
            def a_view(self, request):
                return HttpResponse()

        request = HttpRequest()
        msg = (
            "never_cache didn't receive an HttpRequest. If you are decorating "
            "a classmethod, be sure to use @method_decorator."
        )
        with self.assertRaisesMessage(TypeError, msg):
            MyClass().a_view(request)
        with self.assertRaisesMessage(TypeError, msg):
            MyClass().a_view(HttpRequestProxy(request))

    async def test_never_cache_decorator_http_request_async_view(self):
        class MyClass:
            @never_cache
            async def async_view(self, request):
                return HttpResponse()

        request = HttpRequest()
        msg = (
            "never_cache didn't receive an HttpRequest. If you are decorating "
            "a classmethod, be sure to use @method_decorator."
        )
        with self.assertRaisesMessage(TypeError, msg):
            await MyClass().async_view(request)
        with self.assertRaisesMessage(TypeError, msg):
            await MyClass().async_view(HttpRequestProxy(request))

    def test_never_cache_decorator_http_request_proxy(self):
        class MyClass:
            @method_decorator(never_cache)
            def a_view(self, request):
                return HttpResponse()

        request = HttpRequest()
        response = MyClass().a_view(HttpRequestProxy(request))
        self.assertIn("Cache-Control", response.headers)
        self.assertIn("Expires", response.headers)
