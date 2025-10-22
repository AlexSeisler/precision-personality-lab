/*
  # Precision + Personality Lab - V2.0 Database Schema

  ## Overview
  This migration establishes the complete database architecture for the Precision + Personality Lab,
  enabling secure, per-user storage of calibration data and experiment results.

  ## 1. New Tables

  ### `calibrations`
  Stores user personality calibration results and parameter ranges.
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `mode` (text) - "quick" or "deep"
  - `answers` (jsonb) - calibration quiz responses
  - `temperature_min` (numeric)
  - `temperature_max` (numeric)
  - `top_p_min` (numeric)
  - `top_p_max` (numeric)
  - `max_tokens_min` (integer)
  - `max_tokens_max` (integer)
  - `frequency_penalty_min` (numeric)
  - `frequency_penalty_max` (numeric)
  - `insights` (jsonb) - derived personality insights
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `experiments`
  Stores individual experiment runs with prompts and generated responses.
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `calibration_id` (uuid, references calibrations, nullable)
  - `prompt` (text)
  - `parameters` (jsonb) - temperature, top_p, max_tokens, etc.
  - `responses` (jsonb) - array of generated responses
  - `created_at` (timestamptz)

  ## 2. Security
  
  ### Row Level Security (RLS)
  All tables have RLS enabled with the following policies:
  
  #### Calibrations:
  - Users can SELECT their own calibrations
  - Users can INSERT their own calibrations
  - Users can UPDATE their own calibrations
  - Users can DELETE their own calibrations
  
  #### Experiments:
  - Users can SELECT their own experiments
  - Users can INSERT their own experiments
  - Users can UPDATE their own experiments
  - Users can DELETE their own experiments

  ## 3. Indexes
  - `calibrations.user_id` for efficient user data retrieval
  - `experiments.user_id` for efficient user data retrieval
  - `experiments.calibration_id` for linking experiments to calibrations
  - `experiments.created_at` for chronological ordering

  ## 4. Important Notes
  - All timestamp fields use `timestamptz` for proper timezone handling
  - Default values ensure data integrity
  - Cascading deletes maintain referential integrity
  - RLS policies enforce strict data isolation between users
*/

-- Create calibrations table
CREATE TABLE IF NOT EXISTS calibrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'quick' CHECK (mode IN ('quick', 'deep')),
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  temperature_min numeric(3,2) NOT NULL DEFAULT 0.5,
  temperature_max numeric(3,2) NOT NULL DEFAULT 1.0,
  top_p_min numeric(3,2) NOT NULL DEFAULT 0.7,
  top_p_max numeric(3,2) NOT NULL DEFAULT 1.0,
  max_tokens_min integer NOT NULL DEFAULT 500,
  max_tokens_max integer NOT NULL DEFAULT 2000,
  frequency_penalty_min numeric(3,2) NOT NULL DEFAULT 0.0,
  frequency_penalty_max numeric(3,2) NOT NULL DEFAULT 0.5,
  insights jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create experiments table
CREATE TABLE IF NOT EXISTS experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calibration_id uuid REFERENCES calibrations(id) ON DELETE SET NULL,
  prompt text NOT NULL,
  parameters jsonb NOT NULL,
  responses jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_calibrations_user_id ON calibrations(user_id);
CREATE INDEX IF NOT EXISTS idx_calibrations_created_at ON calibrations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_experiments_user_id ON experiments(user_id);
CREATE INDEX IF NOT EXISTS idx_experiments_calibration_id ON experiments(calibration_id);
CREATE INDEX IF NOT EXISTS idx_experiments_created_at ON experiments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE calibrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calibrations table
CREATE POLICY "Users can view own calibrations"
  ON calibrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calibrations"
  ON calibrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calibrations"
  ON calibrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own calibrations"
  ON calibrations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for experiments table
CREATE POLICY "Users can view own experiments"
  ON experiments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own experiments"
  ON experiments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own experiments"
  ON experiments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own experiments"
  ON experiments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for calibrations updated_at
CREATE TRIGGER update_calibrations_updated_at
  BEFORE UPDATE ON calibrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
