{{- /*
  markdown-twin.md — the Markdown twin of a page, published as index.md: front matter, title,
  description as a quote, body. See docs/seo.md#markdown-versions.

  Contract:
    page (required) — the page to render.
    body (optional) — the Markdown body. Defaults to the page's raw content with its shortcodes
                      dropped, since they render HTML; pass .Content for a page whose body is
                      shortcodes with a Markdown template of their own (the Parcours).
*/ -}}
{{- range $key, $_ := . -}}
  {{- if not (in (slice "page" "body") $key) -}}
    {{- errorf "partial markdown-twin.md: unknown key %q" $key -}}
  {{- end -}}
{{- end -}}
{{- $page := .page -}}
{{- if not $page -}}
  {{- errorf "partial markdown-twin.md: missing required key %q" "page" -}}
{{- end -}}

{{- $body := .body -}}
{{- if not $body -}}
  {{- $base := strings.TrimSuffix "/" site.BaseURL -}}
  {{- $body = $page.RawContent -}}
  {{- /* A shortcode renders HTML meant for the page, so it has no Markdown equivalent. */ -}}
  {{- $body = replaceRE `(?s)\{\{[<%].*?[>%]\}\}` "" $body -}}
  {{- /* `](/path)` is site-rooted, `](#id)` is this page, `](path)` is relative to this page.
         A `//host` or `scheme:` target is already absolute and matches none of the three.*/ -}}
  {{- $body = replaceRE `\]\(/([^/])` (printf "](%s/$1" $base) $body -}}
  {{- $body = replaceRE `\]\(#` (printf "](%s#" $page.Permalink) $body -}}
  {{- $body = replaceRE `\]\((?:\./)?([^/#:)\s][^:)\s]*)\)` (printf "](%s$1)" $page.Permalink) $body -}}
{{- end -}}
---

{{- /*JSON strings are valid quoted YAML; noHTMLEscape keeps "&" from becoming \u0026.*/}}
title: {{ jsonify (dict "noHTMLEscape" true) $page.Title }}
author: {{ jsonify (dict "noHTMLEscape" true) site.Params.author.name }}
{{ with $page.Date }}{{ if not .IsZero }}date: {{ .Format "2006-01-02" }}
{{ end }}{{ end -}}
canonical: {{ $page.Permalink }}
---

# {{ $page.Title }}

{{ with $page.Params.description }}
> {{ . }}
{{ end }}
{{ $body | strings.TrimSpace }}
