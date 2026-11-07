-- Categories for the India theme collection: kinds of websites that are common in
-- India but had no category of their own. Existing categories are untouched.
insert into public.categories (name, slug, description, status, display_order)
values
  ('Training Institute', 'training-institute', 'Skill, language, music and professional training centres.', 'published', 510),
  ('Chartered Accountant', 'chartered-accountant', 'CA, tax and GST consultancy firms.', 'published', 520),
  ('Sweet Shop', 'sweet-shop', 'Mithai, namkeen and festive gift box shops.', 'published', 530),
  ('Jewellery', 'jewellery', 'Gold, diamond and silver jewellers.', 'published', 540),
  ('Temple', 'temple', 'Temples, spiritual trusts and community seva.', 'published', 550)
on conflict (slug) do nothing;
