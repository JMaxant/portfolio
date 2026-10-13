{{- /* Markdown form of layouts/shortcodes/skills.html. */ -}}
{{ printf "\n## %s\n" (.Get "title") }}
{{ range site.Params.author.knowsAbout }}- {{ . }}
{{ end }}
