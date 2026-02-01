import { useStudySessionsContext } from '@/contexts/StudySessionsContext';

/**
 * Hook to access study sessions. Uses the shared StudySessionsContext.
 * All components using this hook share the same session state.
 */
export function useStudySessions() {
  const { sessions, addSession } = useStudySessionsContext();
  return { sessions, addSession };
}
