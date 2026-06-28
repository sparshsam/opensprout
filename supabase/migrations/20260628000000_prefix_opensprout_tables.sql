-- Rename OpenSprout primary tables to opensprout_ prefix
-- These share the project with OpenSend (which already uses opensend_ prefix)

ALTER TABLE IF EXISTS public.profiles RENAME TO opensprout_profiles;
ALTER TABLE IF EXISTS public.plants RENAME TO opensprout_plants;
ALTER TABLE IF EXISTS public.care_schedules RENAME TO opensprout_care_schedules;
ALTER TABLE IF EXISTS public.task_instances RENAME TO opensprout_task_instances;
ALTER TABLE IF EXISTS public.care_logs RENAME TO opensprout_care_logs;
ALTER TABLE IF EXISTS public.journal_entries RENAME TO opensprout_journal_entries;
ALTER TABLE IF EXISTS public.journal_photos RENAME TO opensprout_journal_photos;
ALTER TABLE IF EXISTS public.data_transfers RENAME TO opensprout_data_transfers;
ALTER TABLE IF EXISTS public.sync_devices RENAME TO opensprout_sync_devices;
ALTER TABLE IF EXISTS public.plant_species RENAME TO opensprout_plant_species;
ALTER TABLE IF EXISTS public.knowledge_articles RENAME TO opensprout_knowledge_articles;
ALTER TABLE IF EXISTS public.diagnosis_entries RENAME TO opensprout_diagnosis_entries;
ALTER TABLE IF EXISTS public.identifications RENAME TO opensprout_identifications;
ALTER TABLE IF EXISTS public.mcp_tokens RENAME TO opensprout_mcp_tokens;

-- Update table comments
COMMENT ON TABLE public.opensprout_profiles IS 'OpenSprout: user profiles';
COMMENT ON TABLE public.opensprout_plants IS 'OpenSprout: user-owned plant records';
COMMENT ON TABLE public.opensprout_care_schedules IS 'OpenSprout: recurring care rules';
COMMENT ON TABLE public.opensprout_task_instances IS 'OpenSprout: generated care-task due-dates';
COMMENT ON TABLE public.opensprout_care_logs IS 'OpenSprout: completed care actions';
COMMENT ON TABLE public.opensprout_journal_entries IS 'OpenSprout: plant journal entries';
COMMENT ON TABLE public.opensprout_journal_photos IS 'OpenSprout: photo metadata';
COMMENT ON TABLE public.opensprout_data_transfers IS 'OpenSprout: export/import job tracking';
COMMENT ON TABLE public.opensprout_sync_devices IS 'OpenSprout: offline-sync device registry';
COMMENT ON TABLE public.opensprout_plant_species IS 'OpenSprout: species knowledge base';
COMMENT ON TABLE public.opensprout_knowledge_articles IS 'OpenSprout: care/diagnosis articles';
COMMENT ON TABLE public.opensprout_diagnosis_entries IS 'OpenSprout: symptom→cause→solution';
COMMENT ON TABLE public.opensprout_identifications IS 'OpenSprout: AI identification results';
COMMENT ON TABLE public.opensprout_mcp_tokens IS 'OpenSprout: MCP server auth tokens';
