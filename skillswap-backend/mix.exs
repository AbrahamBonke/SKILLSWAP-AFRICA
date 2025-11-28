defp deps do
  [
    {:phoenix, "~> 1.7.0"},
    {:phoenix_html, "~> 3.3"},
    {:phoenix_live_dashboard, "~> 0.7.0"},
    {:telemetry_metrics, "~> 0.6"},
    {:telemetry_poller, "~> 1.0"},
    {:gettext, "~> 0.20"},
    {:cowboy, "~> 2.9"},
    {:plug_cowboy, "~> 2.6"},
    {:ecto_sql, "~> 3.9"},
    {:postgrex, ">= 0.0.0"},
    {:cors_plug, "~> 3.0"},
    {:jason, "~> 1.4"},
    {:httpoison, "~> 2.0"}
  ]
end
