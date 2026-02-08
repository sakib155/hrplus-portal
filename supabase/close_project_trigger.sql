-- Function to close project when candidate joins
CREATE OR REPLACE FUNCTION public.close_project_on_join()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the new status is 'Joined'
    IF NEW.status = 'Joined' THEN
        -- Update the project status to 'Closed'
        UPDATE public.projects
        SET status = 'Closed'
        WHERE id = NEW.project_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS trigger_close_project_on_join ON public.candidates;

CREATE TRIGGER trigger_close_project_on_join
AFTER UPDATE OF status ON public.candidates
FOR EACH ROW
WHEN (NEW.status = 'Joined' AND OLD.status IS DISTINCT FROM 'Joined')
EXECUTE FUNCTION public.close_project_on_join();
