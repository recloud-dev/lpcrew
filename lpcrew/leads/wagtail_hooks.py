from wagtail.snippets.models import register_snippet
from wagtail.snippets.views.snippets import SnippetViewSet

from leads.models import Lead


class LeadViewSet(SnippetViewSet):
    model = Lead
    icon = "mail"
    menu_label = "Заявки"
    menu_name = "leads"
    menu_order = 200
    add_to_admin_menu = True
    list_display = ["name", "phone", "messenger", "meters", "created_at", "handled"]
    list_filter = ["messenger", "handled"]
    list_export = ["name", "phone", "messenger", "meters", "created_at", "handled"]
    search_fields = ["name", "phone"]


register_snippet(LeadViewSet)
