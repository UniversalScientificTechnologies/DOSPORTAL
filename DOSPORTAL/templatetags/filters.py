from django import template

register = template.Library()

@register.filter(name='filesize_mb')
def filesize_mb(value):
    """Převede velikost souboru na megabajty."""
    return f"{value.size / (1024 * 1024):.2f} MB"
