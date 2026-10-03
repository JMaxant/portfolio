{{- /* Markdown twin of a blog article or project, published as index.md. Title, description
       and body only: shortcodes are dropped and relative links made absolute.
       See docs/seo.md#markdown-versions. */ -}}
{{- $base := strings.TrimSuffix "/" site.BaseURL -}}
{{- $body := .RawContent -}}
{{- /* A shortcode renders HTML meant for the page, so it has no Markdown equivalent. */ -}}
{{- $body = replaceRE `(?s)\{\{[<%].*?[>%]\}\}` "" $body -}}
{{- /* `](/path)` is site-rooted, `](#id)` is this page, `](path)` is relative to this page.
       A `//host` or `scheme:` target is already absolute and matches none of the three. */ -}}
{{- $body = replaceRE `\]\(/([^/])` (printf "](%s/$1" $base) $body -}}
{{- $body = replaceRE `\]\(#` (printf "](%s#" .Permalink) $body -}}
{{- $body = replaceRE `\]\((?:\./)?([^/#:)\s][^:)\s]*)\)` (printf "](%s$1)" .Permalink) $body -}}
# {{ .Title }}
{{ with .Params.description }}
> {{ . }}
{{ end }}
{{ $body | strings.TrimSpace }}
