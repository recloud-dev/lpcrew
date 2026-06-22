from django import forms

from leads.models import Lead


class LeadForm(forms.ModelForm):
    # honeypot: настоящие пользователи это поле не видят и не заполняют
    website = forms.CharField(required=False, widget=forms.HiddenInput)

    class Meta:
        model = Lead
        fields = ["name", "phone", "messenger", "meters"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # форма-14 не содержит выбор мессенджера — берём значение по умолчанию
        self.fields["messenger"].required = False

    def clean_website(self):
        if self.cleaned_data.get("website"):
            raise forms.ValidationError("spam")
        return ""

    def clean_messenger(self):
        return self.cleaned_data.get("messenger") or "telegram"

    def clean_phone(self):
        phone = self.cleaned_data["phone"].strip()
        digits = sum(c.isdigit() for c in phone)
        if digits < 7:
            raise forms.ValidationError("Укажите корректный телефон.")
        return phone

    def clean_meters(self):
        # результат игры приходит из браузера — отбрасываем заведомо нереальные значения
        meters = self.cleaned_data.get("meters")
        if meters and meters > 100000:
            return None
        return meters
