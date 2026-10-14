{{- /*Markdown form of layouts/shortcodes/resume-text.html.*/ -}}
{{ printf "\n## %s" (.Get "title") }}{{ with .Get "period" }} ({{ . }}){{ end }}

{{ .InnerDeindent | strings.TrimSpace }}
