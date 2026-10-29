-- Migration: 006_purge_bloated_user_metadata.sql
-- Purges oversized base64 logo_url from auth.users raw_user_meta_data
-- to prevent HTTP 494 REQUEST_HEADER_TOO_LARGE caused by bloated JWT session cookies.

update auth.users
set raw_user_meta_data = raw_user_meta_data - 'logo_url'
where raw_user_meta_data ? 'logo_url';

