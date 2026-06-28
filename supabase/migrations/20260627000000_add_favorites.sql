-- v0.9.22 — Plant Organization
-- Add is_favorite column for favoriting plants

alter table plants
  add column if not exists is_favorite boolean not null default false;

-- Index for quick favorite queries
create index if not exists idx_plants_favorite
  on plants (user_id, is_favorite)
  where is_favorite = true and deleted_at is null;

-- Update the comment
comment on column plants.is_favorite is 'Whether the plant is marked as a favorite by the user';
