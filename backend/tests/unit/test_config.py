def test_settings_parse_cors_origins():
    from opsbrain_backend.core.config import Settings

    settings = Settings(cors_origins="http://localhost:5173,http://localhost:3000")
    assert settings.cors_origin_list == ["http://localhost:5173", "http://localhost:3000"]
