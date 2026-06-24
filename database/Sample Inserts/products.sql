-- =============================================================
--  HIStore'y - Test Product Data
--  Michael Jackson Memorabilia Store
--  Run this AFTER importing hiStorey_schema.sql
-- =============================================================

USE `hstore_db`;

-- =============================================================
--  INSERT: products
-- =============================================================
INSERT INTO `products` (`name`, `description`, `category`, `price`, `stock`, `condition`, `year`, `is_deleted`) VALUES

-- ALBUMS & MUSIC
('Thriller Vinyl Record (Original Pressing)',
 'Original 1982 US pressing of the best-selling album of all time. Epic Records label. Includes original lyric sleeve. Minor sleeve wear, vinyl plays flawlessly.',
 'Albums & Music', 4999.00, 3, 'Good', 1982, 0),

('Bad Album CD - Limited Japan Edition',
 'Japanese market limited edition CD of the 1987 Bad album. Includes OBI strip and bonus track insert. Kept in original jewel case with no cracks.',
 'Albums & Music', 2499.00, 5, 'Like New', 1987, 0),

('HIStory: Past, Present and Future Book I - Double CD',
 'Original 1995 double album. Disc 1 is a greatest hits compilation; Disc 2 features new material. Comes in the iconic embossed hardcover case.',
 'Albums & Music', 1899.00, 8, 'Good', 1995, 0),

('Dangerous Album Vinyl (2LP)',
 'Original 1991 two-record vinyl set of the Dangerous album. Epic Records. Both records are scratch-free. Gatefold sleeve in very good condition.',
 'Albums & Music', 3500.00, 2, 'Good', 1991, 0),

('Off the Wall Original Vinyl Record',
 'The album that launched Michael Jackson as a solo superstar. Original 1979 Epic Records US pressing. Light surface marks, plays without skipping.',
 'Albums & Music', 2800.00, 4, 'Fair', 1979, 0),

-- APPAREL
('Thriller Era Red Leather Jacket Replica',
 'High-quality replica of the iconic red and black leather jacket worn in the Thriller music video. Premium PU leather, full lining, silver zipper hardware. Sizes S to 3XL available.',
 'Apparel', 3200.00, 15, 'New', 1983, 0),

('Bad Tour 1987 Concert T-Shirt (Original)',
 'Authentic vintage concert tee from the 1987 Bad World Tour. Front features tour artwork; back lists all tour dates. Light fading consistent with age.',
 'Apparel', 1500.00, 6, 'Fair', 1987, 0),

('Michael Jackson Sequined Glove Replica',
 'Hand-crafted replica of the iconic white rhinestone glove. Over 1,000 hand-sewn Swarovski-style crystals. One size fits most. Comes in a velvet display box.',
 'Apparel', 1200.00, 20, 'New', 1983, 0),

('HIStory Tour Crew Hoodie',
 'Official HIStory World Tour crew sweatshirt. Black with embroidered front logo and tour branding on the back. Heavy cotton blend. Size: XL.',
 'Apparel', 2200.00, 3, 'Good', 1996, 0),

('Dangerous Tour Souvenir Cap',
 'Original black snapback cap from the 1992-1993 Dangerous World Tour. Embroidered Michael Jackson signature on front panel. Adjustable strap.',
 'Apparel', 950.00, 7, 'Good', 1992, 0),

-- COLLECTIBLES
('Michael Jackson Signed Tour Programme (Bad Tour)',
 'Official Bad Tour programme signed in black marker by Michael Jackson. Signature authenticated with holographic COA sticker from JSA. Framed in UV-protective glass.',
 'Collectibles', 125000.00, 1, 'Good', 1987, 0),

('Thriller 40th Anniversary Limited Edition Box Set',
 'Limited to 10,000 units worldwide. Contains remastered CD, 7-inch single, 60-page hardcover book, replica concert ticket, and commemorative enamel pin.',
 'Collectibles', 5800.00, 10, 'New', 2022, 0),

('MJ Funko Pop Figure - Thriller Edition',
 'Official licensed Funko Pop vinyl figure of Michael Jackson in the Thriller red leather jacket. In original window box. Figure #26 from the Rocks! series.',
 'Collectibles', 750.00, 25, 'New', 2011, 0),

('Michael Jackson Bronze Commemorative Coin Set',
 'Set of 3 bronze-plated commemorative coins. Each coin features a different era: Off the Wall, Thriller, and HIStory. Presented in a velvet-lined wooden box.',
 'Collectibles', 2100.00, 12, 'New', 2010, 0),

('Neverland Ranch Snow Globe',
 'Collectible snow globe featuring a miniature replica of the Neverland Ranch main house. Wind-up music box base plays "Ben". Limited edition of 500 pieces.',
 'Collectibles', 3800.00, 4, 'Like New', 2005, 0),

-- POSTERS & PRINTS
('Thriller Original Movie Poster (27x41)',
 'Original US one-sheet promotional poster for the Thriller short film. 27 x 41 inches. Professionally linen-backed for preservation. Unfolded, stored flat.',
 'Posters & Prints', 8500.00, 2, 'Good', 1983, 0),

('Bad Era Promotional Photo Print - Signed Reprint',
 'High-quality 11x14 inch archival print from the 1987 Bad promotional photoshoot. Printed on 300gsm matte fine-art paper. Unframed.',
 'Posters & Prints', 650.00, 30, 'New', 1987, 0),

('Moonwalker Film Japanese Promo Poster',
 'Rare Japanese B2-size (28x20 inch) promotional poster for the 1988 film Moonwalker. Minor edge wear. Never folded.',
 'Posters & Prints', 4200.00, 1, 'Good', 1988, 0),

-- MULTIMEDIA
('Moonwalker VHS Tape (Original US Release)',
 'Original 1988 US VHS release of the Moonwalker film. Epic Music Video label. Tape plays perfectly. Clamshell case has light shelf wear.',
 'Multimedia', 799.00, 5, 'Good', 1988, 0),

('This Is It Concert Film DVD (Collector Edition)',
 'Two-disc collector edition DVD of the 2009 This Is It concert documentary. Includes bonus footage, behind-the-scenes material, and photo booklet. Sealed.',
 'Multimedia', 899.00, 18, 'New', 2009, 0),

('Michael Jackson: Number Ones DVD',
 'Official DVD compilation featuring music videos for 18 number-one hits. Region 0 (plays worldwide). Includes Making Of documentary for selected videos.',
 'Multimedia', 599.00, 14, 'New', 2003, 0),

('Thriller 3D Blu-ray Disc',
 'The landmark short film remastered in stunning 3D and 4K resolution. Directed by John Landis. Includes original 2D version and director commentary track.',
 'Multimedia', 1100.00, 9, 'New', 2017, 0),

-- BOOKS & MAGAZINES
('Moonwalk Autobiography - First Edition Hardcover',
 'First edition hardcover of Michael Jackson\'s 1988 autobiography Moonwalk. Published by Doubleday. Dust jacket intact with minor edge wear. Interior pages crisp.',
 'Books & Magazines', 3500.00, 3, 'Good', 1988, 0),

('Rolling Stone Magazine - MJ Tribute Issue (2009)',
 'Special double-issue tribute edition of Rolling Stone Magazine following Michael Jackson\'s passing. July 2009. Unread. Stored flat in a protective sleeve.',
 'Books & Magazines', 850.00, 6, 'Like New', 2009, 0),

('The Magic and the Madness Biography by J. Randy Taraborrelli',
 'Updated 2003 edition of the acclaimed Michael Jackson biography. Hardcover. 706 pages. No writing or highlighting. Minor spine crease.',
 'Books & Magazines', 780.00, 8, 'Good', 2003, 0);


-- =============================================================
--  INSERT: product_images
--  Placeholder paths - replace with real uploaded file paths
--  via your Multer upload endpoint before going live
-- =============================================================
INSERT INTO `product_images` (`product_id`, `file_path`, `is_primary`) VALUES
-- Product 1: Thriller Vinyl
(1, 'uploads/products/1/thriller_vinyl_front.jpg', 1),
(1, 'uploads/products/1/thriller_vinyl_back.jpg', 0),
-- Product 2: Bad Japan CD
(2, 'uploads/products/2/bad_japan_cd_front.jpg', 1),
(2, 'uploads/products/2/bad_japan_cd_obi.jpg', 0),
-- Product 3: HIStory Double CD
(3, 'uploads/products/3/history_cd_case.jpg', 1),
(3, 'uploads/products/3/history_cd_discs.jpg', 0),
-- Product 4: Dangerous 2LP
(4, 'uploads/products/4/dangerous_vinyl_front.jpg', 1),
-- Product 5: Off the Wall Vinyl
(5, 'uploads/products/5/off_the_wall_vinyl.jpg', 1),
-- Product 6: Thriller Jacket
(6, 'uploads/products/6/thriller_jacket_front.jpg', 1),
(6, 'uploads/products/6/thriller_jacket_back.jpg', 0),
(6, 'uploads/products/6/thriller_jacket_detail.jpg', 0),
-- Product 7: Bad Tour T-Shirt
(7, 'uploads/products/7/bad_tour_tshirt_front.jpg', 1),
(7, 'uploads/products/7/bad_tour_tshirt_back.jpg', 0),
-- Product 8: Sequined Glove
(8, 'uploads/products/8/sequined_glove_main.jpg', 1),
(8, 'uploads/products/8/sequined_glove_box.jpg', 0),
-- Product 9: HIStory Hoodie
(9, 'uploads/products/9/history_hoodie.jpg', 1),
-- Product 10: Dangerous Tour Cap
(10, 'uploads/products/10/dangerous_cap.jpg', 1),
-- Product 11: Signed Programme
(11, 'uploads/products/11/bad_tour_programme_signed.jpg', 1),
(11, 'uploads/products/11/bad_tour_programme_coa.jpg', 0),
-- Product 12: 40th Anniversary Box Set
(12, 'uploads/products/12/thriller_40th_box_open.jpg', 1),
(12, 'uploads/products/12/thriller_40th_box_closed.jpg', 0),
(12, 'uploads/products/12/thriller_40th_contents.jpg', 0),
-- Product 13: Funko Pop
(13, 'uploads/products/13/funko_pop_thriller.jpg', 1),
-- Product 14: Coin Set
(14, 'uploads/products/14/coin_set_display.jpg', 1),
(14, 'uploads/products/14/coin_set_box.jpg', 0),
-- Product 15: Neverland Snow Globe
(15, 'uploads/products/15/neverland_snow_globe.jpg', 1),
-- Product 16: Thriller Poster
(16, 'uploads/products/16/thriller_poster_full.jpg', 1),
-- Product 17: Bad Era Photo Print
(17, 'uploads/products/17/bad_era_photo_print.jpg', 1),
-- Product 18: Moonwalker Poster
(18, 'uploads/products/18/moonwalker_jp_poster.jpg', 1),
-- Product 19: Moonwalker VHS
(19, 'uploads/products/19/moonwalker_vhs.jpg', 1),
-- Product 20: This Is It DVD
(20, 'uploads/products/20/this_is_it_dvd.jpg', 1),
(20, 'uploads/products/20/this_is_it_dvd_discs.jpg', 0),
-- Product 21: Number Ones DVD
(21, 'uploads/products/21/number_ones_dvd.jpg', 1),
-- Product 22: Thriller 3D Blu-ray
(22, 'uploads/products/22/thriller_3d_bluray.jpg', 1),
-- Product 23: Moonwalk Book
(23, 'uploads/products/23/moonwalk_book_cover.jpg', 1),
(23, 'uploads/products/23/moonwalk_book_interior.jpg', 0),
-- Product 24: Rolling Stone Tribute
(24, 'uploads/products/24/rolling_stone_2009.jpg', 1),
-- Product 25: Taraborrelli Biography
(25, 'uploads/products/25/magic_madness_book.jpg', 1);