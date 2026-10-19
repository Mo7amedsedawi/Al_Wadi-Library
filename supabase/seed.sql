-- ==============================================================================
-- مكتبة الوادي (Al-Wadi Library) - Seed Data for Supabase SQL Editor
-- إدراج البيانات الأولية للأقسام والمؤلفين والكتب
-- ==============================================================================

-- 1. إدراج الأقسام الأساسية (Categories)
INSERT INTO public.categories (id, name, description, icon) VALUES
('cat-novels', 'روايات', 'أدب وسرد وروائع الرواية العربية الحديثة والتاريخية', 'Feather'),
('cat-history', 'تاريخ', 'حضارات وأحداث وذاكرة الأمم والشعوب', 'Landmark'),
('cat-philosophy', 'فلسفة', 'فكر ومنطق وأسئلة الوجود والوعي الكبرى', 'Compass'),
('cat-science', 'علوم', 'فيزياء وفلك وكيمياء واستكشاف أسرار الكون', 'Atom'),
('cat-tech', 'تكنولوجيا', 'ذكاء اصطناعي وأمن سيبراني ونظم برمجية حديثة', 'Cpu')
ON CONFLICT (id) DO NOTHING;

-- 2. إدراج المؤلفين (Authors)
INSERT INTO public.authors (id, name, bio, avatar_url, born, nationality) VALUES
('author-ibn-khaldun', 'عبد الرحمن بن خلدون', 'مؤسس علم الاجتماع وفلسفة التاريخ العربي، صاحب المقدمة الشهيرة.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80', '1332 م (تونس)', 'أندلسي / مغاربي'),
('author-zewail', 'د. أحمد زويل', 'عالم كيميائي مصري حائز على جائزة نوبل ومبتكر ميكروسكوب الفيمتو ثانية.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80', '1946 م (دمنهور)', 'مصري'),
('author-ibn-rushd', 'ابن رشد الأندلسي', 'فيلسوف وقاضي قرطبة وشارح أرسطو الأكبر وموفق العقل مع النقل.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80', '1126 م (قرطبة)', 'أندلسي'),
('author-mahfouz', 'نجيب محفوظ', 'أديب نوبل ورائد الرواية العربية الواقعية وصاحب الثلاثية الشهيرة.', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80', '1911 م (القاهرة)', 'مصري'),
('author-kanafani', 'غسان كنفاني', 'أديب المقاومة الفلسطينية وصاحب رجال في الشمس وعائد إلى حيفا.', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80', '1936 م (عكا)', 'فلسطيني'),
('author-ashour', 'رضوى عاشور', 'روائية وأكاديمية مصرية مبدعة ثلاثية غرناطة وأطياف والطنطورية.', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80', '1946 م (القاهرة)', 'مصرية'),
('author-mahmoud', 'د. مصطفى محمود', 'مفكر وطبيب مصري صاحب البرامج والكتب الفكرية التأملية الرائدة.', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80', '1921 م (مصر)', 'مصري'),
('author-wardi', 'د. علي الوردي', 'عالم اجتماع عراقي رائد وناقد المنطق الصوري وصاحب مهزلة العقل البشري.', 'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?auto=format&fit=crop&w=300&q=80', '1913 م (بغداد)', 'عراقي'),
('author-sanousi', 'سعود السنعوسي', 'روائي كويتي معاصر حائز على جائزة البوكر عن ساق البامبو.', 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=300&q=80', '1981 م (الكويت)', 'كويتي'),
('author-greene', 'برايان غرين', 'فيزيائي نظري عالمي وأستاذ فيزياء الأوتار الفائقة والكونيات.', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80', '1963 م (نيويورك)', 'أمريكي'),
('author-haydari', 'د. طارق الحيدري', 'باحث ومستشار تقني في خوارزميات الذكاء الاصطناعي وهندسة البيانات.', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80', '1985 م (السعودية)', 'سعودي'),
('author-najjar', 'م. سامي النجار', 'خبير أمن سيبراني وبنى تحتية سحابية ومكافحة التهديدات الرقمية.', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80', '1982 م (الأردن)', 'أردني'),
('author-sharif', 'م. ليلى الشريف', 'مهندسة برمجيات وباحثة في وكلاء الذكاء الاصطناعي وتطبيقات الموبايل.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80', '1990 م (لبنان)', 'لبنانية'),
('author-mounis', 'د. حسين مؤنس', 'مؤرخ وجغرافي مصري صاحب أطلس تاريخ الإسلام وشخصية مصر.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80', '1911 م (مصر)', 'مصري'),
('author-shadhli', 'د. أسامة الشاذلي', 'روائي وطبيب مصري صاحب أوراق شمعون المصري وروايات التيه الصحراوي.', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80', '1974 م (مصر)', 'مصري'),
('author-tyson', 'نيل ديغراس تايسون', 'عالم فيزياء فلكية وكاتب علمي ومقدم برامج كوزموس الفضائية.', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80', '1958 م (نيويورك)', 'أمريكي')
ON CONFLICT (id) DO NOTHING;

-- 3. عينة من الكتب الأساسية (Sample Books Seed)
INSERT INTO public.books (id, title, author_id, category_name, description, full_excerpt, cover_image, pages, rating, ratings_count, publish_date, is_trending, is_new, file_size, primary_format) VALUES
('book-1', 'مقدمة ابن خلدون', 'author-ibn-khaldun', 'تاريخ', 'أعظم مؤلف في فلسفة التاريخ وعلم الاجتماع الإنساني، يعرض فيه نشأة الأمم وسقوط الحضارات وقوانين العمران البشري برؤية استشرافية سابقة لعصرها.', 'إن فن التاريخ من الفنون التي يتداولها الأمم والأجيال...', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=700&q=80', 680, 4.9, 1420, '1377-01-01T00:00:00.000Z', true, false, '14.2 MB', 'pdf'),
('book-2', 'عصر العلم', 'author-zewail', 'علوم', 'سيرة ذاتية فكرية وعلمية للحائز على جائزة نوبل، يستعرض فيها رحلته العلمية ورؤيته لتطوير التعليم والبحث العلمي والنهوض المعرفي في العالم العربي.', 'العلم ليس مجرد تجميع للحقائق، بل هو منهج تفكير وأسلوب حياة...', 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=700&q=80', 320, 4.8, 980, '2005-06-15T00:00:00.000Z', true, false, '8.5 MB', 'epub'),
('book-3', 'تهافت التهافت', 'author-ibn-rushd', 'فلسفة', 'رد فلسفي محكم وفارق على كتاب الغزالي تهافت الفلاسفة، حيث دافع ابن رشد عن الفلسفة والعقل وحكمة البرهان والتوافق بين الشريعة والحكمة.', 'من أوجب النظر العقلي والاعتبار بالمخلوقات فقد أوجب معرفة الصانع من طريق البرهان...', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=700&q=80', 410, 4.7, 650, '1180-01-01T00:00:00.000Z', false, false, '11.0 MB', 'pdf'),
('book-4', 'ثلاثية القاهرة: بين القصرين', 'author-mahfouz', 'روايات', 'الجزء الأول من الملحمة الروائية الخالدة لنجيب محفوظ الحائز على نوبل، ترصد تحولات المجتمع المصري في مطلع القرن العشرين بأسلوب سردي بارع.', 'استيقظت أمينة في الهزيع الأخير من الليل كعادتها دائماً...', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=700&q=80', 560, 4.9, 2310, '1956-01-01T00:00:00.000Z', true, false, '9.2 MB', 'epub'),
('book-5', 'ثورة الذكاء الاصطناعي التوليدي', 'author-haydari', 'تكنولوجيا', 'دليل شامل ومبسط لفهم نماذج الذكاء الاصطناعي التوليدي، معالجة اللغات الطبيعية، وتأثيراتها الاقتصادية والاجتماعية على مستقبل العمل والإنسانية.', 'لسنا أمام مجرد قفزة برمجية، بل أمام إعادة هيكلة لطبيعة المعرفة والعمل البشري...', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=700&q=80', 280, 4.6, 840, '2024-03-20T00:00:00.000Z', true, true, '6.4 MB', 'pdf')
ON CONFLICT (id) DO NOTHING;

-- 4. إدراج الصيغ والكلمات المفتاحية
INSERT INTO public.book_formats (book_id, format, file_size) VALUES
('book-1', 'pdf', '14.2 MB'),
('book-1', 'epub', '6.8 MB'),
('book-2', 'epub', '8.5 MB'),
('book-2', 'pdf', '12.1 MB'),
('book-3', 'pdf', '11.0 MB'),
('book-4', 'epub', '9.2 MB'),
('book-5', 'pdf', '6.4 MB'),
('book-5', 'epub', '3.9 MB')
ON CONFLICT (book_id, format) DO NOTHING;

INSERT INTO public.book_keywords (book_id, keyword) VALUES
('book-1', 'تاريخ'), ('book-1', 'عمران'), ('book-1', 'حضارة'), ('book-1', 'ابن خلدون'),
('book-2', 'علوم'), ('book-2', 'نوبل'), ('book-2', 'أحمد زويل'), ('book-2', 'كيمياء'),
('book-3', 'فلسفة'), ('book-3', 'ابن رشد'), ('book-3', 'منطق'),
('book-4', 'روايات'), ('book-4', 'نجيب محفوظ'), ('book-4', 'القاهرة'),
('book-5', 'تكنولوجيا'), ('book-5', 'ذكاء اصطناعي'), ('book-5', 'برمجة')
ON CONFLICT (book_id, keyword) DO NOTHING;
