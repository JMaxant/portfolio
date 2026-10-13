{{- /* Markdown twin of the Parcours. Its body is shortcodes, each with a Markdown template of
       its own (layouts/shortcodes/*.md), so .Content is used instead of the raw content.
       See docs/seo.md#markdown-versions. */ -}}
{{- partial "markdown-twin.md" (dict "page" . "body" (.Content | replaceRE `\n{3,}` "\n\n")) -}}
