begin;
insert into public.site_content_blocks(page_key,block_key,label,default_text) values
('information/redeem-codes.html','text-intro','Introduction','Find codes to claim in Clash of Critters. Check their status and copy a code before redeeming it in game.'),
('information/redeem-codes.html','text-redeeming-title','Heading · How to redeem','How to redeem'),
('information/redeem-codes.html','text-redeeming-details','Text · Copy a code, open the code redemption screen in game, and paste it exactly as shown. If a code ','Copy a code, open the code redemption screen in game, and paste it exactly as shown. If a code fails, check its expiry, account requirements and whether you already claimed it.')
on conflict(page_key,block_key) do nothing;
commit;
