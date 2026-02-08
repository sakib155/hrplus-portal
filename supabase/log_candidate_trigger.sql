-- Trigger: Log Candidate Addition to Project Activity Log
CREATE OR REPLACE FUNCTION public.log_candidate_addition()
RETURNS TRIGGER AS $$
DECLARE
    candidate_name TEXT;
BEGIN
    candidate_name := NEW.name;
    
    INSERT INTO public.project_logs (project_id, recruiter_id, content, type, status, log_date)
    VALUES (
        NEW.project_id,
        NEW.recruiter_id,
        'Added candidate: ' || candidate_name,
        'Log',
        'Pending', -- Default, though for logs status might not matter as much as tasks
        CURRENT_DATE
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_candidate_addition ON public.candidates;
CREATE TRIGGER trigger_log_candidate_addition
AFTER INSERT ON public.candidates
FOR EACH ROW EXECUTE FUNCTION public.log_candidate_addition();
