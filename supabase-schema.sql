-- Echo Registry Database Schema
-- Run this in your Supabase SQL editor

-- Dependency cache table
CREATE TABLE IF NOT EXISTS dependency_cache (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    mc_version TEXT NOT NULL,
    version TEXT NOT NULL,
    loader TEXT NOT NULL CHECK (loader IN ('forge', 'neoforge', 'fabric', 'universal')),
    source_url TEXT NOT NULL,
    notes TEXT,
    fallback_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, mc_version)
);

-- Minecraft versions cache table
CREATE TABLE IF NOT EXISTS minecraft_versions (
    id TEXT PRIMARY KEY,
    version_type TEXT NOT NULL CHECK (version_type IN ('release', 'snapshot', 'old_beta', 'old_alpha')),
    release_time TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API usage tracking table (optional, for basic metrics)
CREATE TABLE IF NOT EXISTS api_usage (
    id SERIAL PRIMARY KEY,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE')),
    status_code INTEGER NOT NULL CHECK (status_code >= 100 AND status_code < 600),
    response_time INTEGER NOT NULL CHECK (response_time >= 0), -- milliseconds
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_dependency_cache_name_mc ON dependency_cache(name, mc_version);
CREATE INDEX IF NOT EXISTS idx_dependency_cache_expires ON dependency_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_dependency_cache_loader ON dependency_cache(loader);
CREATE INDEX IF NOT EXISTS idx_minecraft_versions_expires ON minecraft_versions(expires_at);
CREATE INDEX IF NOT EXISTS idx_minecraft_versions_type ON minecraft_versions(version_type);
CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage(endpoint);

-- Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE dependency_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE minecraft_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Public access policies (read-only for public, full access for service role)
-- Dependency cache policies
CREATE POLICY "Allow read access to dependency cache" ON dependency_cache
    FOR SELECT USING (true);

CREATE POLICY "Allow service role full access to dependency cache" ON dependency_cache
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Minecraft versions policies
CREATE POLICY "Allow read access to minecraft versions" ON minecraft_versions
    FOR SELECT USING (true);

CREATE POLICY "Allow service role full access to minecraft versions" ON minecraft_versions
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- API usage policies (service role only for privacy)
CREATE POLICY "Allow service role full access to api usage" ON api_usage
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Function to automatically clean up expired entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM dependency_cache WHERE expires_at < NOW();
    DELETE FROM minecraft_versions WHERE expires_at < NOW();
END;
$$;

-- Function to log API usage
CREATE OR REPLACE FUNCTION log_api_usage(
    p_endpoint TEXT,
    p_method TEXT,
    p_status_code INTEGER,
    p_response_time INTEGER,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO api_usage (endpoint, method, status_code, response_time, user_agent, ip_address)
    VALUES (p_endpoint, p_method, p_status_code, p_response_time, p_user_agent, p_ip_address);
END;
$$;

-- Trigger to automatically update created_at timestamp
CREATE OR REPLACE FUNCTION update_created_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.created_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply triggers
CREATE TRIGGER update_dependency_cache_created_at
    BEFORE INSERT ON dependency_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_created_at_column();

CREATE TRIGGER update_minecraft_versions_created_at
    BEFORE INSERT ON minecraft_versions
    FOR EACH ROW
    EXECUTE FUNCTION update_created_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;