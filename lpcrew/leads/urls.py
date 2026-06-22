from django.urls import path

from leads import views

app_name = "leads"

urlpatterns = [
    path("submit/", views.submit, name="submit"),
    path("leaderboard/", views.leaderboard, name="leaderboard"),
]
