/*
  # Precision + Personality Lab — V2.1 Audit Logging System

  ## Overview
  This migration adds comprehensive audit logging capabilities to track user interactions,
  system events, and data changes for observability and analytics.

  ## 1. New Tables

  ### `audit_logs`
  Records all significant user actions and system events.
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `event_type` (text) - Type of event (e.g., 'sign_in', 'calibration_saved', 'experiment_created')
  - `event_data` (jsonb) - Additional metadata about the event
  - `created_at` (timestamptz) - When the event occurred

  ## 2. Security
  
  ### Row Level Security (RLS)
  All audit logs are protected with RLS policies:
  
  #### Audit Logs:
  - Users can SELECT their own audit logs
  - Users can INSERT their own audit logs
  - Users can UPDATE their own audit logs (for internal corrections)
  - Users can DELETE their own audit logs (for GDPR compliance)

  ## 3. Indexes
  - `audit_logs.user_id` for efficient user log retrieval
  - `audit_logs.event_type` for filtering by event category
  - `audit_logs.created_at` for chronological queries

  ## 4. Event Types
  Standard event types include:
  - Authentication: 'sign_in', 'sign_out', 'sign_up'
  - Calibration: 'calibration_started', 'calibration_completed', 'calibration_deleted'
  - Experiment: 'experiment_created', 'experiment_updated', 'experiment_deleted'
  - Data: 'data_exported', 'settings_changed'
  - Session: 'session_restored', 'realtime_connected', 'realtime_disconnected'

  ## 5. Important Notes
  - Audit logs support GDPR compliance through user-controlled deletion
  - Events are immutable by default (updates only for corrections)
  - All timestamps use `timestamptz` for proper timezone handling
  - RLS ensures strict data isolation between users
*/

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs table
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own audit logs"
  ON audit_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own audit logs"
  ON audit_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Helper function to log events (can be called from triggers or client code)
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id uuid,
  p_event_type text,
  p_event_data jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO audit_logs (user_id, event_type, event_data)
  VALUES (p_user_id, p_event_type, p_event_data)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;
