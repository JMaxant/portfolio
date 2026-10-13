{{- /* Markdown form of layouts/shortcodes/timeline.html. The source indents each nested
       shortcode, which Markdown would read as a code block. */ -}}
{{ printf "\n## %s" (.Get "title") }}{{ with .Get "period" }} ({{ . }}){{ end }}

{{ .Inner | replaceRE `(?m)^[ \t]+` "" | strings.TrimSpace }}

