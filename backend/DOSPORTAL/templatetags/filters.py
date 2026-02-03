from django import template
import json

register = template.Library()

@register.filter(name='filesize_mb')
def filesize_mb(value):
    """Převede velikost souboru na megabajty."""
    return f"{value.size / (1024 * 1024):.2f} MB"

@register.filter(name='pretty_json')
def pretty_json(value):
    val = json.loads(value)
    val = json.dumps(val, indent=4, ensure_ascii=False, sort_keys=True)
    val = val.replace(' ', '&nbsp;')
    val = val.replace('\n', '<br>')

    return val