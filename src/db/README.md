# Database Migration Guide

## Overview

This directory contains the database schema and migration files for the TruyenDex application. We use Supabase as our database provider, which is built on top of PostgreSQL.

## Schema Structure

### Series Table

- Stores manga/comic series information
- UUID primary key
- Basic metadata like title, description, cover image
- Tracks views and status
- Automatic timestamp management

### Comments Table

- Supports nested comments for both series and chapters
- Uses integer primary key for better performance
- Links to users via UUID
- Supports parent-child relationships

### Series Follows Table

- Tracks user follows for series
- Enforces unique constraint per user-series pair
- Automatic timestamp management

## Setting Up Database

1. Create a new Supabase project
2. Copy your project URL and anon key to .env file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```
3. Run the migration script in `migrations/001_initial_schema.sql` in Supabase SQL editor

## Development Guidelines

- Always create new migration files for schema changes
- Follow the naming convention: `XXX_description.sql`
- Test migrations in a development environment first
- Document any breaking changes
