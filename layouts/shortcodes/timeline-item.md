{{- /*Markdown form of layouts/shortcodes/timeline-item.html.*/ -}}
{{- $period := .Get "debut" -}}
{{- /* A period inside one year reads "2025", not "2025 → 2025". */ -}}
{{- if ne (substr (.Get "fin" | default "") 0 4) (substr $period 0 4) -}}
  {{- $period = printf "%s → %s" $period (.Get "fin" | default (i18n "parcours-ongoing")) -}}
{{- end -}}
{{ printf "\n### %s, %s (%s)" (.Get "titre") (.Get "organisation") $period }}
{{ with .Get "resume" }}
{{ . }}
{{ end }}
{{- with .Get "tags" }}
Tags: {{ . }}
{{ end }}
