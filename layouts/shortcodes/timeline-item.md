{{- /* Markdown form of layouts/shortcodes/timeline-item.html. */ -}}
{{- $end := .Get "fin" | default (i18n "parcours-ongoing") -}}
{{ printf "\n### %s, %s (%s → %s)" (.Get "titre") (.Get "organisation") (.Get "debut") $end }}
{{ with .Get "resume" }}
{{ . }}
{{ end }}
{{- with .Get "tags" }}
Tags: {{ . }}
{{ end }}
