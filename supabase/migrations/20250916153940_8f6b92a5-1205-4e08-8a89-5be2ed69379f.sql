-- Enable RLS on enrollments table that has policies but RLS was disabled
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;