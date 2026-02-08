-- Trigger: Notify Recruiter on Project Assignment
CREATE OR REPLACE FUNCTION public.notify_project_assignment()
RETURNS TRIGGER AS $$
DECLARE
    project_title TEXT;
BEGIN
    SELECT title INTO project_title FROM public.projects WHERE id = NEW.project_id;
    
    INSERT INTO public.notifications (recipient_id, type, content, link)
    VALUES (
        NEW.recruiter_id,
        'Task',
        'You have been assigned to a new project: ' || COALESCE(project_title, 'New Project'),
        '/dashboard'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_project_assignment ON public.project_recruiters;
CREATE TRIGGER trigger_notify_project_assignment
AFTER INSERT ON public.project_recruiters
FOR EACH ROW EXECUTE FUNCTION public.notify_project_assignment();


-- Trigger: Notify Recruiter on Follow-up Assignment (by Admin)
CREATE OR REPLACE FUNCTION public.notify_followup_assigned()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify if the creator is NOT the recipient (i.e. Admin assigned it)
    IF NEW.recruiter_id != auth.uid() THEN
        INSERT INTO public.notifications (recipient_id, type, content, link)
        VALUES (
            NEW.recruiter_id,
            'Task',
            'You have a new follow-up task scheduled for ' || NEW.scheduled_date,
            '/dashboard'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_followup_assigned ON public.candidate_followups;
CREATE TRIGGER trigger_notify_followup_assigned
AFTER INSERT ON public.candidate_followups
FOR EACH ROW EXECUTE FUNCTION public.notify_followup_assigned();


-- Trigger: Notify Admins on Join
CREATE OR REPLACE FUNCTION public.notify_admins_on_join()
RETURNS TRIGGER AS $$
DECLARE
    admin_record RECORD;
    candidate_name TEXT;
BEGIN
    IF NEW.status = 'Joined' AND OLD.status IS DISTINCT FROM 'Joined' THEN
        candidate_name := NEW.name;
        
        -- Loop through all admins and insert notification
        FOR admin_record IN SELECT id FROM public.employees WHERE role IN ('admin', 'lead') LOOP
            INSERT INTO public.notifications (recipient_id, type, content, link)
            VALUES (
                admin_record.id,
                'Success',
                'Candidate ' || candidate_name || ' has joined! Project closed.',
                '/candidates'
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_admins_on_join ON public.candidates;
CREATE TRIGGER trigger_notify_admins_on_join
AFTER UPDATE OF status ON public.candidates
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_join();
