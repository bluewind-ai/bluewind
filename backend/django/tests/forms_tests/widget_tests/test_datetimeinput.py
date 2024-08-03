from datetime import datetime

from django.forms import CharField, DateTimeInput, Form
from django.utils import translation

from .base import WidgetTest


class DateTimeInputTest(WidgetTest):
    widget = DateTimeInput()

    def test_render_none(self):
        self.check_html(self.widget, "date", None, '<input type="text" name="date">')

    def test_render_value(self):
        """
        The microseconds are trimmed on display, by default.
        """
        d = datetime(2007, 9, 17, 12, 51, 34, 482548)
        self.assertEqual(str(d), "2007-09-17 12:51:34.482548")
        self.check_html(
            self.widget,
            "date",
            d,
            html=('<input type="text" name="date" value="2007-09-17 12:51:34">'),
        )
        self.check_html(
            self.widget,
            "date",
            datetime(2007, 9, 17, 12, 51, 34),
            html=('<input type="text" name="date" value="2007-09-17 12:51:34">'),
        )
        self.check_html(
            self.widget,
            "date",
            datetime(2007, 9, 17, 12, 51),
            html=('<input type="text" name="date" value="2007-09-17 12:51:00">'),
        )

    def test_render_formatted(self):
        """
        Use 'format' to change the way a value is displayed.
        """
        widget = DateTimeInput(
            format="%d/%m/%Y %H:%M",
            attrs={"type": "datetime"},
        )
        d = datetime(2007, 9, 17, 12, 51, 34, 482548)
        self.check_html(
            widget,
            "date",
            d,
            html='<input type="datetime" name="date" value="17/09/2007 12:51">',
        )

    @translation.override("de-at")
    def test_l10n(self):
        d = datetime(2007, 9, 17, 12, 51, 34, 482548)
        self.check_html(
            self.widget,
            "date",
            d,
            html=('<input type="text" name="date" value="17.09.2007 12:51:34">'),
        )

    def test_fieldset(self):
        class TestForm(Form):
            template_name = "forms_tests/use_fieldset.html"
            field = CharField(widget=self.widget)

        form = TestForm()
        self.assertIs(self.widget.use_fieldset, False)
        self.assertHTMLEqual(
            '<div><label for="id_field">Field:</label>'
            '<input id="id_field" name="field" required type="text"></div>',
            form.render(),
        )
