begin;
insert into public.site_content_blocks(page_key,block_key,label,default_text) values
('information/patch-notes.html','text-intro','Introduction','Developer announcements, release dates and links to the original patch notes.'),
('information/patch-notes.html','text-updates-title','Heading · Latest updates','Latest updates'),
('information/patch-notes.html','text-updates-intro','Text · Read the original announcement for the complete changes. Short summaries on this page are writt','Read the original announcement for the complete changes. Short summaries on this page are written by the companion site.'),
('information/patch-notes.html','text-about-title','Heading · About these notes','About these notes'),
('information/patch-notes.html','text-about-details','Text · Entries link to developer announcements. Creator reactions and opinions belong on the Creators ','Entries link to developer announcements. Creator reactions and opinions belong on the Creators page and are not official patch notes.')
on conflict(page_key,block_key) do nothing;
commit;
