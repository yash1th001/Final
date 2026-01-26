-- Create table for storing resume analysis history
CREATE TABLE public.resume_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_text TEXT NOT NULL,
  job_description TEXT,
  ats_score INTEGER NOT NULL,
  jd_match_score INTEGER,
  structure_score INTEGER NOT NULL,
  suggestions JSONB NOT NULL DEFAULT '[]',
  structure_analysis JSONB,
  candidate_context JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.resume_analyses ENABLE ROW LEVEL SECURITY;

-- Users can only view their own analyses
CREATE POLICY "Users can view own analyses"
ON public.resume_analyses
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own analyses
CREATE POLICY "Users can create own analyses"
ON public.resume_analyses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own analyses
CREATE POLICY "Users can delete own analyses"
ON public.resume_analyses
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_resume_analyses_user_id ON public.resume_analyses(user_id);
CREATE INDEX idx_resume_analyses_created_at ON public.resume_analyses(created_at DESC);