# Features Implementation and Supabase Setup

## Restored Feature Set

This document captures the restored features and the Supabase setup required to support them.

### Feature implementation

- Recurring expenses + draft runs
  - `src/app/app/group/[groupId]/recurring/page.tsx`
  - `src/app/app/group/[groupId]/add/page.tsx`

- Expense edit / reverse + revision trail
  - `src/app/app/group/[groupId]/page.tsx`
  - `src/lib/supabase-schema.sql`

- Settle-all assistant + batch tracking
  - `src/app/app/group/[groupId]/page.tsx`
  - `src/lib/supabase-schema.sql`

- Notification preferences + quiet hours
  - `src/lib/notifications.ts`
  - `src/hooks/useNotificationPreferences.ts`
  - `src/app/app/settings/page.tsx`

- Address book + nickname resolution
  - `src/hooks/useAddressBook.ts`
  - `src/app/app/settings/page.tsx`
  - `src/app/app/group/[groupId]/page.tsx`

- Search / filter / export UX
  - `src/app/app/activity/page.tsx`
  - `src/app/app/group/[groupId]/page.tsx`

- FAQ route
  - `src/app/faq/page.tsx`

- Single notification icon with counter in header
  - `src/components/app/AppHeader.tsx`
  - `src/components/app/BottomNav.tsx`

- MiniPay direct hook path
  - `src/hooks/useMiniPay.ts`

## Supabase schema and setup

The following schema changes support notifications, quiet hours, batch settlement tracking, and address book behavior.

### Existing schema file

- `src/lib/supabase-schema.sql`

### Seed notification preferences

```sql
INSERT INTO notification_preferences (
  user_address,
  quiet_hours_enabled,
  quiet_hours_start,
  quiet_hours_end,
  allow_reminders,
  allow_expense_updates,
  allow_group_updates,
  allow_messages,
  allow_settlements
)
VALUES (
  '0x0000000000000000000000000000000000000000',
  FALSE,
  '23:00',
  '07:00',
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE
)
ON CONFLICT (user_address) DO NOTHING;
```

### Verification queries

- Confirm notification preferences exist:

```sql
SELECT * FROM notification_preferences WHERE user_address = '0x0000000000000000000000000000000000000000';
```

- Confirm address book entries:

```sql
SELECT * FROM address_book WHERE owner_address = '0x0000000000000000000000000000000000000000';
```

## Rollout checklist

- [ ] Confirm all restored pages are present in the app tree
- [ ] Run `next build` locally
- [ ] Verify `src/hooks/useMiniPay.ts` exists and imports correctly
- [ ] Confirm notification preferences and address book work on settings page
- [ ] Confirm recurring expense page is accessible
- [ ] Confirm FAQ page is accessible

## Notes

This file was recreated after the feature work was restored from the available branch history. It is intended to preserve the implementation overview and Supabase seed guidance for the restored feature set.
