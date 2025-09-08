-- Migration to consolidate ml_sync_logs into ml_sync_log
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ml_sync_logs'
  ) THEN
    INSERT INTO public.ml_sync_log (
      id, tenant_id, operation_type, entity_type, entity_id,
      ml_entity_id, status, request_data, response_data,
      error_details, execution_time_ms, created_at
    )
    SELECT id, tenant_id, operation_type, entity_type, entity_id,
           ml_entity_id, status, request_data, response_data,
           error_details, execution_time_ms, created_at
    FROM public.ml_sync_logs
    ON CONFLICT (id) DO NOTHING;

    DROP TABLE public.ml_sync_logs;
  END IF;
END;
$$;
