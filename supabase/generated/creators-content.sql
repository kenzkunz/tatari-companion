begin;
insert into public.site_content_blocks(page_key,block_key,label,default_text) values
('information/creators.html','text-intro','Introduction','Guides, builds and videos from the Clash of Critters community.'),
('information/creators.html','text-featured-title','Heading · Featured creators','Featured creators'),
('information/creators.html','text-featured-intro','Text · Explore selected Clash of Critters videos and support the people behind them.','Explore selected Clash of Critters videos and support the people behind them.'),
('information/creators.html','text-about-title','Heading · About our creators','About our creators'),
('information/creators.html','text-about-details','Text · Videos remain on their creators’ channels. Creator opinions and recommendations are credited to','Videos remain on their creators’ channels. Creator opinions and recommendations are credited to their authors.')
on conflict(page_key,block_key) do nothing;
commit;
