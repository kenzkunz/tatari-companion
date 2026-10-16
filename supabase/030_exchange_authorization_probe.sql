-- Realtime authorization inserts a probe without a private flag.
-- Authorize the account-owned topic; the client and server broadcasts both enforce private channels.
alter policy exchange_topic_boundary on realtime.messages using(topic='exchange:'||(select auth.uid())::text);
