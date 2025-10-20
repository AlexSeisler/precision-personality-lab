/*
  # Add Dashboard Features - Persistent Experiment Management

  1. Schema Updates
    - Add `saved` and `discarded` flags to experiments table
    - Create `experiment_exports` table for export tracking
  
  2. New Tables
    - `experiment_exports`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key → auth.users)
      - `file_url` (text) - Supabase Storage link
      - `file_format` (text) - csv/json/pdf
      - `created_at` (timestamptz)
  
  3. Security
    - Enable RLS on experiment_exports
    - Add user isolation policy
    - Maintain existing experiments RLS policies
  
  4. Performance
    - Add index on saved/discarded columns for filtering
    - Add index on created_at for export tracking
*/

-- Add management columns to experiments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'experiments' AND column_name = 'saved'
  ) THEN
    ALTER TABLE experiments ADD COLUMN saved boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'experiments' AND column_name = 'discarded'
  ) THEN
    ALTER TABLE experiments ADD COLUMN discarded boolean DEFAULT false;
  END IF;
END $$;

-- Create experiment_exports table
CREATE TABLE IF NOT EXISTS experiment_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_url text NOT NULL,
  file_format text NOT NULL CHECK (file_format IN ('csv', 'json', 'pdf')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE experiment_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for experiment_exports
CREATE POLICY "Users can view their own exports"
  ON experiment_exports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exports"
  ON experiment_exports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exports"
  ON experiment_exports
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_experiments_saved ON experiments(saved) WHERE saved = true;
CREATE INDEX IF NOT EXISTS idx_experiments_discarded ON experiments(discarded) WHERE discarded = false;
CREATE INDEX IF NOT EXISTS idx_experiment_exports_user_id ON experiment_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_experiment_exports_created_at ON experiment_exports(created_at DESC);