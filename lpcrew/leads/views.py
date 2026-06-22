from django.http import JsonResponse
from django.shortcuts import redirect
from django.views.decorators.http import require_GET, require_POST
from django_ratelimit.decorators import ratelimit

from leads.forms import LeadForm
from leads.models import Lead
from leads.notify import notify_telegram

LEADERBOARD_SIZE = 10


def _is_ajax(request):
    return request.headers.get("X-Requested-With") == "XMLHttpRequest"


@require_POST
@ratelimit(key="ip", rate="5/h", method="POST", block=False)
def submit(request):
    if getattr(request, "limited", False):
        return _respond(request, ok=False,
                        error="Слишком много заявок. Попробуйте позже.", status=429)

    form = LeadForm(request.POST)
    if not form.is_valid():
        # honeypot-срабатывание прикидываемся успехом, чтобы не подсказывать ботам
        if "website" in form.errors:
            return _respond(request, ok=True)
        first = next(iter(form.errors.values()))[0]
        return _respond(request, ok=False, error=first, status=400)

    lead = form.save()
    notify_telegram(lead)
    return _respond(request, ok=True)


@require_GET
def leaderboard(request):
    top = (
        Lead.objects.filter(meters__isnull=False)
        .order_by("-meters", "created_at")
        .values_list("name", "meters")[:LEADERBOARD_SIZE]
    )
    return JsonResponse({"top": [{"name": n, "meters": m} for n, m in top]})


def _respond(request, ok, error="", status=200):
    if _is_ajax(request):
        payload = {"ok": ok}
        if error:
            payload["error"] = error
        return JsonResponse(payload, status=status)
    return redirect("/#join")
