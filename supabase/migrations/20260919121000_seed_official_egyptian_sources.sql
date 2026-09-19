insert into public.legal_sources (name, authority, source_url, jurisdiction)
values
  ('قاعدة التشريعات القومية', 'وزارة العدل المصرية', 'https://moj.gov.eg:73/', 'EG'),
  ('بوابة التشريعات المصرية', 'بوابة التشريعات المصرية', 'https://register.cc.gov.eg/legislations', 'EG'),
  ('بوابة وزارة العدل المصرية', 'وزارة العدل المصرية', 'https://moj.gov.eg/', 'EG')
on conflict do nothing;
