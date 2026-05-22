insert into public.material_profiles (
  product_id,
  raw_material_text,
  fibers,
  blend_percentages,
  normalized_blend,
  fabric_feel,
  stretch_level,
  weight,
  opacity,
  breathability,
  performance_tags,
  confidence,
  confidence_label,
  explanation
) values
(
  'mock-modal-slip-skirt',
  '72% modal, 23% recycled polyester, 5% elastane',
  array['modal', 'recycled polyester', 'elastane'],
  '{"modal":72,"recycled polyester":23,"elastane":5}'::jsonb,
  '[{"fiber":"modal","percentage":72},{"fiber":"recycled polyester","percentage":23},{"fiber":"elastane","percentage":5}]'::jsonb,
  'soft, smooth, breathable drape',
  'high',
  'light',
  'high',
  'high',
  array['soft-handfeel', 'has-stretch'],
  0.88,
  'high',
  'Mock seed profile for testing material-first search and dupe comparisons.'
),
(
  'mock-cashmere-cardigan',
  '100% cashmere',
  array['cashmere'],
  '{"cashmere":100}'::jsonb,
  '[{"fiber":"cashmere","percentage":100}]'::jsonb,
  'plush, soft, warm handfeel',
  'medium',
  'midweight',
  'high',
  'medium',
  array['soft-handfeel'],
  0.93,
  'high',
  'Mock seed profile for testing premium fiber comparisons.'
)
on conflict (product_id) do nothing;

insert into public.price_history (
  external_product_id,
  retailer,
  price,
  currency,
  observed_at
) values
('mock-modal-slip-skirt', 'Northline', 98, 'USD', now() - interval '14 days'),
('mock-modal-slip-skirt', 'Northline', 78, 'USD', now()),
('mock-cashmere-cardigan', 'LuxeLoop', 320, 'USD', now() - interval '21 days'),
('mock-cashmere-cardigan', 'LuxeLoop', 240, 'USD', now())
on conflict do nothing;
