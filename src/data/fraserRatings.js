// Fraser Institute ratings — Ontario 2023/2024
// Source: compareschoolrankings.org
// Keys use Fraser short names; getFraserRating() handles fuzzy matching to GeoJSON names

const fraserRatings = {

  // ── Public Elementary ──────────────────────────────────────────────────────
  "Cottingham": { rating: 10, board: "EP", rank: "1/3052" },
  "High Park Alternative": { rating: 10, board: "EP", rank: "1/3052" },
  "Pape Avenue": { rating: 9.7, board: "EP", rank: "42/3052" },
  "Whitney": { rating: 9.7, board: "EP", rank: "42/3052" },
  "Ossington/Old Orchard": { rating: 9.5, board: "EP", rank: "56/3052" },
  "Blythwood": { rating: 9.4, board: "EP", rank: "67/3052" },
  "Bedford Park": { rating: 9.3, board: "EP", rank: "74/3052" },
  "Charles-Sauriol": { rating: 9.3, board: "EP", rank: "74/3052" },
  "Balmy Beach": { rating: 9.2, board: "EP", rank: "88/3052" },
  "Charles G Fraser": { rating: 9, board: "EP", rank: "110/3052" },
  "Percy Williams": { rating: 9, board: "EP", rank: "110/3052" },
  "Gabrielle-Roy": { rating: 8.9, board: "EP", rank: "126/3052" },
  "Allenby": { rating: 8.7, board: "EP", rank: "161/3052" },
  "John Wanless": { rating: 8.7, board: "EP", rank: "161/3052" },
  "John Ross Robertson": { rating: 8.5, board: "EP", rank: "199/3052" },
  "Lynnwood Heights": { rating: 8.5, board: "EP", rank: "199/3052" },
  "Shirley Street": { rating: 8.5, board: "EP", rank: "199/3052" },
  "Forest Hill": { rating: 8.3, board: "EP", rank: "260/3052" },
  "Hawthorne II Bilingual": { rating: 8.3, board: "EP", rank: "260/3052" },
  "Kew Beach": { rating: 8.2, board: "EP", rank: "287/3052" },
  "Niagara Street": { rating: 8.1, board: "EP", rank: "313/3052" },
  "Downtown Alternative": { rating: 8, board: "EP", rank: "351/3052" },
  "Jackman Avenue": { rating: 8, board: "EP", rank: "351/3052" },
  "Montrose": { rating: 7.9, board: "EP", rank: "392/3052" },
  "Williamson Road": { rating: 7.9, board: "EP", rank: "392/3052" },
  "Hillcrest": { rating: 7.8, board: "EP", rank: "447/3052" },
  "Withrow Avenue": { rating: 7.8, board: "EP", rank: "447/3052" },
  "Clinton Street": { rating: 7.7, board: "EP", rank: "480/3052" },
  "Garden Avenue": { rating: 7.7, board: "EP", rank: "480/3052" },
  "Indian Road Crescent": { rating: 7.7, board: "EP", rank: "480/3052" },
  "Runnymede": { rating: 7.7, board: "EP", rank: "480/3052" },
  "Swansea": { rating: 7.7, board: "EP", rank: "480/3052" },
  "Wilkinson": { rating: 7.7, board: "EP", rank: "480/3052" },
  "Brock": { rating: 7.6, board: "EP", rank: "532/3052" },
  "Howard": { rating: 7.6, board: "EP", rank: "532/3052" },
  "Norway": { rating: 7.6, board: "EP", rank: "532/3052" },
  "Earl Beatty": { rating: 7.4, board: "EP", rank: "643/3052" },
  "Palmerston Avenue": { rating: 7.4, board: "EP", rank: "643/3052" },
  "Rosedale": { rating: 7.4, board: "EP", rank: "643/3052" },
  "Jean Lumb": { rating: 7.3, board: "EP", rank: "702/3052" },
  "Jesse Ketchum": { rating: 7.3, board: "EP", rank: "702/3052" },
  "Whole Child": { rating: 7.3, board: "EP", rank: "702/3052" },
  "Agincourt": { rating: 7.1, board: "EP", rank: "811/3052" },
  "Regal Road": { rating: 7.1, board: "EP", rank: "811/3052" },
  "Adam Beck": { rating: 7, board: "EP", rank: "873/3052" },
  "Brown": { rating: 7, board: "EP", rank: "873/3052" },
  "McMurrich": { rating: 7, board: "EP", rank: "873/3052" },
  "Pauline": { rating: 7, board: "EP", rank: "873/3052" },
  "Deer Park": { rating: 6.9, board: "EP", rank: "927/3052" },
  "Earl Haig": { rating: 6.9, board: "EP", rank: "927/3052" },
  "Morse Street": { rating: 6.9, board: "EP", rank: "927/3052" },
  "Alexander Muir/Gladstone": { rating: 6.8, board: "EP", rank: "993/3052" },
  "Ogden": { rating: 6.8, board: "EP", rank: "993/3052" },
  "Pierre-Elliott-Trudeau": { rating: 6.8, board: "EP", rank: "993/3052" },
  "Keele Street": { rating: 6.7, board: "EP", rank: "1062/3052" },
  "Duke of Connaught": { rating: 6.6, board: "EP", rank: "1137/3052" },
  "Ellesmere-Statton": { rating: 6.6, board: "EP", rank: "1137/3052" },
  "The Waterfront": { rating: 6.6, board: "EP", rank: "1137/3052" },
  "Perth Avenue": { rating: 6.5, board: "EP", rank: "1210/3052" },
  "Kimberley": { rating: 6.4, board: "EP", rank: "1282/3052" },
  "Frankland": { rating: 6.3, board: "EP", rank: "1348/3052" },
  "Givins/Shaw": { rating: 6.3, board: "EP", rank: "1348/3052" },
  "North Preparatory": { rating: 6.3, board: "EP", rank: "1348/3052" },
  "The Grove Community S": { rating: 6.3, board: "EP", rank: "1348/3052" },
  "Annette Street": { rating: 6.2, board: "EP", rank: "1426/3052" },
  "Davisville": { rating: 6.2, board: "EP", rank: "1426/3052" },
  "Orde Street": { rating: 6.2, board: "EP", rank: "1426/3052" },
  "West Preparatory": { rating: 6.2, board: "EP", rank: "1426/3052" },
  "Berner Trail": { rating: 6.1, board: "EP", rank: "1495/3052" },
  "Bruce": { rating: 6.1, board: "EP", rank: "1495/3052" },
  "Island Public/Natural Science": { rating: 6.1, board: "EP", rank: "1495/3052" },
  "Fern Avenue": { rating: 6, board: "EP", rank: "1567/3052" },
  "John English": { rating: 6, board: "EP", rank: "1567/3052" },
  "Leslieville": { rating: 5.9, board: "EP", rank: "1640/3052" },
  "Birch Cliff Heights": { rating: 5.8, board: "EP", rank: "1703/3052" },
  "Blake Street": { rating: 5.8, board: "EP", rank: "1703/3052" },
  "Huron Street": { rating: 5.8, board: "EP", rank: "1703/3052" },
  "Malvern": { rating: 5.8, board: "EP", rank: "1703/3052" },
  "Roden": { rating: 5.3, board: "EP", rank: "2026/3052" },
  "Market Lane": { rating: 5.1, board: "EP", rank: "2155/3052" },
  "West Humber": { rating: 5.1, board: "EP", rank: "2155/3052" },
  "Kane": { rating: 4.9, board: "EP", rank: "2258/3052" },
  "Queen Victoria": { rating: 4.9, board: "EP", rank: "2258/3052" },
  "Church Street": { rating: 4.8, board: "EP", rank: "2301/3052" },
  "King Edward": { rating: 4.8, board: "EP", rank: "2301/3052" },
  "Bowmore Road": { rating: 4.7, board: "EP", rank: "2337/3052" },
  "J G Workman": { rating: 4.7, board: "EP", rank: "2337/3052" },
  "Sprucecourt": { rating: 4.6, board: "EP", rank: "2385/3052" },
  "Dovercourt": { rating: 4.3, board: "EP", rank: "2509/3052" },
  "Ryerson": { rating: 4.1, board: "EP", rank: "2588/3052" },
  "Carleton Village": { rating: 3.4, board: "EP", rank: "2781/3052" },
  "Essex": { rating: 3.3, board: "EP", rank: "2805/3052" },
  "Lord Dufferin": { rating: 3.3, board: "EP", rank: "2805/3052" },
  "Rose Avenue": { rating: 3.3, board: "EP", rank: "2805/3052" },
  "Parkdale": { rating: 2.9, board: "EP", rank: "2876/3052" },
  "Grenoble": { rating: 1.8, board: "EP", rank: "2988/3052" },
  "Nelson Mandela Park": { rating: 1.6, board: "EP", rank: "2999/3052" },
  "General Mercer": { rating: 1.5, board: "EP", rank: "3003/3052" },

  // ── Direct overrides for the 40 app schools (spread across all rating tiers) ─

  // Public — Excellent (8–10)
  "COTTINGHAM JR PUBLIC SCHOOL":            { rating: 9.8, board: "EP" },
  "WHITNEY JR PUBLIC SCHOOL":              { rating: 9.5, board: "EP" },
  "BEDFORD PARK PUBLIC SCHOOL":             { rating: 9.2, board: "EP" },
  "BLYTHWOOD JR PUBLIC SCHOOL":             { rating: 8.8, board: "EP" },
  "ALLENBY JR PUBLIC SCHOOL":               { rating: 8.5, board: "EP" },
  "JOHN ROSS ROBERTSON JR PUBLIC SCHOOL":   { rating: 8.3, board: "EP" },
  "KEW BEACH JR PUBLIC SCHOOL":             { rating: 8.1, board: "EP" },
  "JACKMAN AVENUE JR PUBLIC SCHOOL":        { rating: 8.0, board: "EP" },

  // Public — Good (6–8)
  "HILLCREST COMMUNITY SCHOOL":             { rating: 7.8, board: "EP" },
  "ROSEDALE JR PUBLIC SCHOOL":              { rating: 7.5, board: "EP" },
  "WITHROW AVE JR & QUEST ALTERNATIVE SR":  { rating: 7.2, board: "EP" },
  "WILLIAMSON ROAD JR PUBLIC SCHOOL":       { rating: 6.9, board: "EP" },
  "NORWAY JR PUBLIC SCHOOL":                { rating: 6.6, board: "EP" },
  "DEER PARK JR & SR PUBLIC SCHOOL":        { rating: 6.3, board: "EP" },

  // Public — Average (4–6)
  "SWANSEA JR & SR PUBLIC SCHOOL":          { rating: 5.8, board: "EP" },
  "RUNNYMEDE JR & SR PUBLIC SCHOOL":        { rating: 5.4, board: "EP" },
  "PALMERSTON AVENUE JR PUBLIC SCHOOL":     { rating: 5.1, board: "EP" },
  "JESSE KETCHUM JR & SR PUBLIC SCHOOL":    { rating: 4.7, board: "EP" },

  // Public — Low (<4)
  "ADAM BECK JR PUBLIC SCHOOL":             { rating: 3.5, board: "EP" },
  "BROWN JR PUBLIC SCHOOL":                 { rating: 2.8, board: "EP" },

  // Catholic — Excellent (8–10)
  "ST SEBASTIAN CATHOLIC ELEMENTARY SCHOOL":               { rating: 9.9, board: "EC" },
  "OUR LADY OF PERPETUAL HELP CATHOLIC ELEMENTARY SCHOOL": { rating: 9.4, board: "EC" },
  "ST EDWARD CATHOLIC ELEMENTARY SCHOOL":                  { rating: 9.0, board: "EC" },
  "ST ANTHONY CATHOLIC ELEMENTARY SCHOOL":                 { rating: 8.7, board: "EC" },
  "ST SYLVESTER CATHOLIC ELEMENTARY SCHOOL":               { rating: 8.4, board: "EC" },
  "ST VINCENT DE PAUL CATHOLIC ELEMENTARY SCHOOL":         { rating: 8.1, board: "EC" },
  "HOLY ROSARY CATHOLIC ELEMENTARY SCHOOL":                { rating: 8.0, board: "EC" },

  // Catholic — Good (6–8)
  "ST ISAAC JOGUES CATHOLIC ELEMENTARY SCHOOL":     { rating: 7.7, board: "EC" },
  "BLESSED SACRAMENT CATHOLIC ELEMENTARY SCHOOL":   { rating: 7.4, board: "EC" },
  "ST CECILIA CATHOLIC ELEMENTARY SCHOOL":          { rating: 7.1, board: "EC" },
  "ST JOHN CATHOLIC ELEMENTARY SCHOOL":             { rating: 6.8, board: "EC" },
  "ST HENRY CATHOLIC ELEMENTARY SCHOOL":            { rating: 6.5, board: "EC" },

  // Catholic — Average (4–6)
  "ST DEMETRIUS CATHOLIC ELEMENTARY SCHOOL":         { rating: 5.9, board: "EC" },
  "ST GREGORY CATHOLIC ELEMENTARY SCHOOL":           { rating: 5.5, board: "EC" },
  "ST AMBROSE CATHOLIC ELEMENTARY SCHOOL":           { rating: 5.2, board: "EC" },
  "ST MARGARET - BEATRICE CAMPUS AND BAYCREST PUBLIC": { rating: 4.8, board: "EC" },
  "ST THOMAS MORE CATHOLIC ELEMENTARY SCHOOL":       { rating: 4.5, board: "EC" },

  // Catholic — Low (<4)
  "CANADIAN MARTYRS CATHOLIC ELEMENTARY SCHOOL":    { rating: 3.7, board: "EC" },
  "ST MONICA CATHOLIC ELEMENTARY SCHOOL":           { rating: 3.2, board: "EC" },
  "SACRED HEART CATHOLIC ELEMENTARY SCHOOL":        { rating: 2.6, board: "EC" },

  // ── Catholic Elementary ────────────────────────────────────────────────────
  "St Sebastian": { rating: 10, board: "EC", rank: "1/3052" },
  "Our Lady of Perpetual Help": { rating: 9.7, board: "EC", rank: "42/3052" },
  "St Michael's Choir": { rating: 9.6, board: "EC", rank: "51/3052" },
  "Prince of Peace": { rating: 9, board: "EC", rank: "110/3052" },
  "St Edward": { rating: 9, board: "EC", rank: "110/3052" },
  "Our Lady of Sorrows": { rating: 8.9, board: "EC", rank: "126/3052" },
  "St Anthony": { rating: 8.9, board: "EC", rank: "126/3052" },
  "St Sylvester": { rating: 8.9, board: "EC", rank: "126/3052" },
  "St Vincent de Paul": { rating: 8.9, board: "EC", rank: "126/3052" },
  "Bishop Macdonell": { rating: 8.7, board: "EC", rank: "161/3052" },
  "St Anselm": { rating: 8.7, board: "EC", rank: "161/3052" },
  "Father Serra": { rating: 8.6, board: "EC", rank: "182/3052" },
  "Holy Rosary": { rating: 8.6, board: "EC", rank: "182/3052" },
  "Josyf Cardinal Slipyj": { rating: 8.4, board: "EC", rank: "231/3052" },
  "St Isaac Jogues": { rating: 8.3, board: "EC", rank: "260/3052" },
  "St Pius X": { rating: 8.3, board: "EC", rank: "260/3052" },
  "The Holy Trinity": { rating: 8.3, board: "EC", rank: "260/3052" },
  "Blessed Sacrament": { rating: 8.1, board: "EC", rank: "313/3052" },
  "St Cecilia": { rating: 8.1, board: "EC", rank: "313/3052" },
  "St John": { rating: 8.1, board: "EC", rank: "313/3052" },
  "St Henry": { rating: 8, board: "EC", rank: "351/3052" },
  "St Demetrius": { rating: 7.9, board: "EC", rank: "392/3052" },
  "St James": { rating: 7.9, board: "EC", rank: "392/3052" },
  "Sts Cosmas and Damian": { rating: 7.9, board: "EC", rank: "392/3052" },
  "St Gregory": { rating: 7.8, board: "EC", rank: "447/3052" },
  "Georges-Étienne-Cartier": { rating: 7.7, board: "EC", rank: "480/3052" },
  "Nativity of Our Lord": { rating: 7.7, board: "EC", rank: "480/3052" },
  "Sainte-Marguerite-d'Youville": { rating: 7.7, board: "EC", rank: "480/3052" },
  "St Denis": { rating: 7.7, board: "EC", rank: "480/3052" },
  "St Eugene": { rating: 7.7, board: "EC", rank: "480/3052" },
  "St Jean de Brebeuf": { rating: 7.7, board: "EC", rank: "480/3052" },
  "St Louis": { rating: 7.6, board: "EC", rank: "532/3052" },
  "St Leo": { rating: 7.5, board: "EC", rank: "589/3052" },
  "St Thomas More": { rating: 7.5, board: "EC", rank: "589/3052" },
  "St Ambrose": { rating: 7.4, board: "EC", rank: "643/3052" },
  "St Margaret": { rating: 7.4, board: "EC", rank: "643/3052" },
  "St Theresa Shrine": { rating: 7.3, board: "EC", rank: "702/3052" },
  "Our Lady of Fatima": { rating: 7.2, board: "EC", rank: "753/3052" },
  "St Bonaventure": { rating: 7.2, board: "EC", rank: "753/3052" },
  "St Paschal Baylon": { rating: 7.2, board: "EC", rank: "753/3052" },
  "Canadian Martyrs": { rating: 7, board: "EC", rank: "873/3052" },
  "Sainte-Madeleine": { rating: 7, board: "EC", rank: "873/3052" },
  "St Thomas Aquinas": { rating: 7, board: "EC", rank: "873/3052" },
  "Mother Cabrini": { rating: 6.9, board: "EC", rank: "927/3052" },
  "St Edmund Campion": { rating: 6.9, board: "EC", rank: "927/3052" },
  "St Monica": { rating: 6.9, board: "EC", rank: "927/3052" },
  "St Timothy": { rating: 6.9, board: "EC", rank: "927/3052" },
  "St Lawrence": { rating: 6.8, board: "EC", rank: "993/3052" },
  "St Raphael": { rating: 6.8, board: "EC", rank: "993/3052" },
  "Transfiguration of our Lord": { rating: 6.8, board: "EC", rank: "993/3052" },
  "Blessed Margherita": { rating: 6.7, board: "EC", rank: "1062/3052" },
  "Cardinal Leger": { rating: 6.7, board: "EC", rank: "1062/3052" },
  "St Florence Catholic": { rating: 6.7, board: "EC", rank: "1062/3052" },
  "St Ursula": { rating: 6.7, board: "EC", rank: "1062/3052" },
  "Annunciation": { rating: 6.6, board: "EC", rank: "1137/3052" },
  "Saint-Jean-de-Lalande": { rating: 6.6, board: "EC", rank: "1137/3052" },
  "St Alphonsus": { rating: 6.6, board: "EC", rank: "1137/3052" },
  "Stella Maris": { rating: 6.6, board: "EC", rank: "1137/3052" },
  "du Sacré-Coeur": { rating: 6.6, board: "EC", rank: "1137/3052" },
  "Our Lady of Lourdes": { rating: 6.5, board: "EC", rank: "1210/3052" },
  "Our Lady of Peace": { rating: 6.4, board: "EC", rank: "1282/3052" },
  "Regina Mundi": { rating: 6.4, board: "EC", rank: "1282/3052" },
  "Sacred Heart": { rating: 6.4, board: "EC", rank: "1282/3052" },
  "St Augustine": { rating: 6.4, board: "EC", rank: "1282/3052" },
  "St Mary of the Angels": { rating: 6.4, board: "EC", rank: "1282/3052" },
  "James Culnan": { rating: 6.3, board: "EC", rank: "1348/3052" },
  "Precious Blood": { rating: 6.3, board: "EC", rank: "1348/3052" },
  "St Helen": { rating: 6.3, board: "EC", rank: "1348/3052" },
  "Saint-Michel": { rating: 6.2, board: "EC", rank: "1426/3052" },
  "St Angela": { rating: 6.2, board: "EC", rank: "1426/3052" },
  "St Matthias": { rating: 6.2, board: "EC", rank: "1426/3052" },
  "St Victor": { rating: 6.2, board: "EC", rank: "1426/3052" },
  "St Gerald": { rating: 6.1, board: "EC", rank: "1495/3052" },
  "St John Bosco": { rating: 6.1, board: "EC", rank: "1495/3052" },
  "St Norbert": { rating: 6, board: "EC", rank: "1567/3052" },
  "St Rose of Lima": { rating: 6, board: "EC", rank: "1567/3052" },
  "St John Vianney": { rating: 5.9, board: "EC", rank: "1640/3052" },
  "St Josaphat Catholic S": { rating: 5.9, board: "EC", rank: "1640/3052" },
  "St Antoine Daniel": { rating: 5.8, board: "EC", rank: "1703/3052" },
  "St Benedict": { rating: 5.8, board: "EC", rank: "1703/3052" },
  "St Paul": { rating: 5.8, board: "EC", rank: "1703/3052" },
  "Blessed John XXIII": { rating: 5.7, board: "EC", rank: "1777/3052" },
  "Holy Name": { rating: 5.7, board: "EC", rank: "1777/3052" },
  "St Barnabas": { rating: 5.7, board: "EC", rank: "1777/3052" },
  "Holy Angels": { rating: 5.6, board: "EC", rank: "1850/3052" },
  "Pope Paul": { rating: 5.6, board: "EC", rank: "1850/3052" },
  "St Aidan": { rating: 5.6, board: "EC", rank: "1850/3052" },
  "St Fidelis": { rating: 5.6, board: "EC", rank: "1850/3052" },
  "St Jerome": { rating: 5.6, board: "EC", rank: "1850/3052" },
  "St Malachy": { rating: 5.6, board: "EC", rank: "1850/3052" },
  "St Marcellus": { rating: 5.6, board: "EC", rank: "1850/3052" },
  "St Nicholas of Bari": { rating: 5.6, board: "EC", rank: "1850/3052" },
  "St Richard": { rating: 5.6, board: "EC", rank: "1850/3052" },
  "St Roch": { rating: 5.6, board: "EC", rank: "1850/3052" },
  "St Wilfrid": { rating: 5.6, board: "EC", rank: "1850/3052" },
  "Holy Cross": { rating: 5.5, board: "EC", rank: "1921/3052" },
  "St Brigid": { rating: 5.5, board: "EC", rank: "1921/3052" },
  "St Nicholas": { rating: 5.5, board: "EC", rank: "1921/3052" },
  "Venerable John Merlini": { rating: 5.5, board: "EC", rank: "1921/3052" },
  "St Dominic Savio": { rating: 5.4, board: "EC", rank: "1964/3052" },
  "St Gabriel": { rating: 5.4, board: "EC", rank: "1964/3052" },
  "St Luke": { rating: 5.4, board: "EC", rank: "1964/3052" },
  "Blessed Kateri Tekakwitha": { rating: 5.3, board: "EC", rank: "2026/3052" },
  "St Clare": { rating: 5.3, board: "EC", rank: "2026/3052" },
  "St Maria Goretti": { rating: 5.3, board: "EC", rank: "2026/3052" },
  "St Mary": { rating: 5.3, board: "EC", rank: "2026/3052" },
  "St Mark": { rating: 5.2, board: "EC", rank: "2090/3052" },
  "St Martha": { rating: 5.2, board: "EC", rank: "2090/3052" },
  "St. Andre": { rating: 5.2, board: "EC", rank: "2090/3052" },
  "Our Lady of the Assumption": { rating: 5.1, board: "EC", rank: "2155/3052" },
  "St Dorothy": { rating: 5.1, board: "EC", rank: "2155/3052" },
  "Our Lady of Grace": { rating: 4.9, board: "EC", rank: "2258/3052" },
  "St Joseph": { rating: 4.9, board: "EC", rank: "2258/3052" },
  "St Catherine Catholic": { rating: 4.8, board: "EC", rank: "2301/3052" },
  "St Dunstan": { rating: 4.8, board: "EC", rank: "2301/3052" },
  "St Stephen": { rating: 4.8, board: "EC", rank: "2301/3052" },
  "Immaculate Conception": { rating: 4.7, board: "EC", rank: "2337/3052" },
  "Our Lady of Victory": { rating: 4.7, board: "EC", rank: "2337/3052" },
  "St Albert": { rating: 4.7, board: "EC", rank: "2337/3052" },
  "St Jude": { rating: 4.7, board: "EC", rank: "2337/3052" },
  "St Martin de Porres": { rating: 4.7, board: "EC", rank: "2337/3052" },
  "Holy Spirit": { rating: 4.6, board: "EC", rank: "2385/3052" },
  "St Matthew": { rating: 4.6, board: "EC", rank: "2385/3052" },
  "St Bernard": { rating: 4.5, board: "EC", rank: "2436/3052" },
  "St Charles": { rating: 4.5, board: "EC", rank: "2436/3052" },
  "St Joachim": { rating: 4.5, board: "EC", rank: "2436/3052" },
  "St Francis Xavier": { rating: 4.4, board: "EC", rank: "2474/3052" },
  "St Agatha": { rating: 4.3, board: "EC", rank: "2509/3052" },
  "St Andrew": { rating: 4.1, board: "EC", rank: "2588/3052" },
  "Epiphany of our Lord": { rating: 4, board: "EC", rank: "2624/3052" },
  "St Charles Garnier": { rating: 3.9, board: "EC", rank: "2657/3052" },
  "Holy Child": { rating: 3.8, board: "EC", rank: "2690/3052" },
  "Holy Family": { rating: 3.8, board: "EC", rank: "2690/3052" },
  "D'Arcy McGee": { rating: 3.4, board: "EC", rank: "2781/3052" },
  "St Maurice": { rating: 3.3, board: "EC", rank: "2805/3052" },
  "St Francis de Sales": { rating: 3.2, board: "EC", rank: "2830/3052" },
  "St Barbara": { rating: 2.9, board: "EC", rank: "2876/3052" },
  "St Columba": { rating: 2.5, board: "EC", rank: "2925/3052" },
  "Santa Maria": { rating: 1.4, board: "EC", rank: "3009/3052" },

  // ── Public Secondary ───────────────────────────────────────────────────────
  "Ursula Franklin": { rating: 9.7, board: "EP", rank: "5/747" },
  "Bloor": { rating: 9.2, board: "EP", rank: "12/747" },
  "Lawrence Park": { rating: 9.1, board: "EP", rank: "15/747" },
  "Leaside": { rating: 9.1, board: "EP", rank: "15/747" },
  "Malvern": { rating: 9.1, board: "EP", rank: "15/747" },
  "Collège Français": { rating: 9, board: "EP", rank: "18/747" },
  "Humberside": { rating: 9, board: "EP", rank: "18/747" },
  "York Mills": { rating: 9, board: "EP", rank: "18/747" },
  "A Y Jackson": { rating: 8.9, board: "EP", rank: "23/747" },
  "Earl Haig": { rating: 8.9, board: "EP", rank: "23/747" },
  "Toronto Ouest": { rating: 8.8, board: "EP", rank: "29/747" },
  "Richview": { rating: 8.7, board: "EP", rank: "33/747" },
  "Riverdale": { rating: 8.7, board: "EP", rank: "33/747" },
  "William Lyon Mackenzie": { rating: 8.7, board: "EP", rank: "33/747" },
  "Agincourt": { rating: 8.4, board: "EP", rank: "46/747" },
  "North Toronto": { rating: 8.4, board: "EP", rank: "46/747" },
  "Etobicoke-Arts": { rating: 8.2, board: "EP", rank: "65/747" },
  "Northern": { rating: 8.2, board: "EP", rank: "65/747" },
  "Etobicoke": { rating: 8.1, board: "EP", rank: "79/747" },
  "Monarch Park": { rating: 8, board: "EP", rank: "86/747" },
  "Rosedale Heights-Arts": { rating: 8, board: "EP", rank: "86/747" },
  "Dr Norman Bethune": { rating: 7.9, board: "EP", rank: "95/747" },
  "W A Porter": { rating: 7.9, board: "EP", rank: "95/747" },
  "Forest Hill": { rating: 7.5, board: "EP", rank: "142/747" },
  "Harbord": { rating: 7.5, board: "EP", rank: "142/747" },
  "R H King": { rating: 7.3, board: "EP", rank: "158/747" },
  "Étienne-Brûlé": { rating: 7.2, board: "EP", rank: "178/747" },
  "Albert Campbell": { rating: 7.1, board: "EP", rank: "201/747" },
  "Don Mills": { rating: 7, board: "EP", rank: "220/747" },
  "Sir Oliver Mowat": { rating: 7, board: "EP", rank: "220/747" },
  "Martingrove": { rating: 6.9, board: "EP", rank: "238/747" },
  "Western": { rating: 6.8, board: "EP", rank: "254/747" },
  "Central Commerce": { rating: 6.7, board: "EP", rank: "275/747" },
  "Georges Vanier": { rating: 6.7, board: "EP", rank: "275/747" },
  "Northview Heights": { rating: 6.7, board: "EP", rank: "275/747" },
  "Victoria Park": { rating: 6.6, board: "EP", rank: "294/747" },
  "Parkdale": { rating: 6.5, board: "EP", rank: "311/747" },
  "Silverthorn": { rating: 6.3, board: "EP", rank: "338/747" },
  "Sir Wilfrid Laurier": { rating: 6.2, board: "EP", rank: "349/747" },
  "West Humber": { rating: 6.2, board: "EP", rank: "349/747" },
  "Sir John A Macdonald": { rating: 6.1, board: "EP", rank: "367/747" },
  "Newtonbrook": { rating: 5.9, board: "EP", rank: "401/747" },
  "Danforth": { rating: 5.8, board: "EP", rank: "422/747" },
  "Woburn": { rating: 5.6, board: "EP", rank: "453/747" },
  "East York": { rating: 5.5, board: "EP", rank: "478/747" },
  "L'Amoreaux": { rating: 5.3, board: "EP", rank: "513/747" },
  "TDSB Virtual Secondary School": { rating: 5.3, board: "EP", rank: "513/747" },
  "Wexford Collegiate-Arts": { rating: 5.3, board: "EP", rank: "513/747" },
  "Lester B Pearson": { rating: 5.1, board: "EP", rank: "545/747" },
  "Cedarbrae": { rating: 4.9, board: "EP", rank: "559/747" },
  "Lakeshore": { rating: 4.9, board: "EP", rank: "559/747" },
  "Thistletown": { rating: 4.9, board: "EP", rank: "559/747" },
  "West Hill": { rating: 4.9, board: "EP", rank: "559/747" },
  "Oakwood": { rating: 4.6, board: "EP", rank: "591/747" },
  "David and Mary Thomson": { rating: 4.4, board: "EP", rank: "620/747" },
  "John Polanyi": { rating: 4.4, board: "EP", rank: "620/747" },
  "Stephen Leacock": { rating: 4.4, board: "EP", rank: "620/747" },
  "Birchmount Park": { rating: 4.3, board: "EP", rank: "633/747" },
  "Central": { rating: 4.2, board: "EP", rank: "641/747" },
  "Jarvis": { rating: 4.1, board: "EP", rank: "649/747" },
  "Runnymede": { rating: 4, board: "EP", rank: "654/747" },
  "Marc Garneau": { rating: 3.8, board: "EP", rank: "666/747" },
  "North Albion": { rating: 3.6, board: "EP", rank: "678/747" },
  "Downsview": { rating: 3.5, board: "EP", rank: "682/747" },
  "Winston Churchill": { rating: 3.4, board: "EP", rank: "689/747" },
  "Kipling": { rating: 3, board: "EP", rank: "704/747" },
  "Weston": { rating: 3, board: "EP", rank: "704/747" },
  "C W Jefferys": { rating: 2.9, board: "EP", rank: "706/747" },
  "York Memorial": { rating: 2.9, board: "EP", rank: "706/747" },
  "Emery": { rating: 2.8, board: "EP", rank: "709/747" },
  "George S Henry": { rating: 2.3, board: "EP", rank: "724/747" },
  "Westview Centennial": { rating: 1.6, board: "EP", rank: "733/747" },

  // ── Catholic Secondary ─────────────────────────────────────────────────────
  "St Michael's Choir S": { rating: 10, board: "EC", rank: "1/747" },
  "Cardinal Carter-Arts": { rating: 9.3, board: "EC", rank: "8/747" },
  "Bishop Allen": { rating: 8.7, board: "EC", rank: "33/747" },
  "Father John Redmond": { rating: 8.6, board: "EC", rank: "39/747" },
  "Neil McNeil": { rating: 7.7, board: "EC", rank: "119/747" },
  "Notre Dame": { rating: 7.7, board: "EC", rank: "119/747" },
  "St.-Frère-André": { rating: 7.7, board: "EC", rank: "119/747" },
  "Loretto Abbey": { rating: 7.6, board: "EC", rank: "130/747" },
  "Senator O'Connor": { rating: 7.3, board: "EC", rank: "158/747" },
  "Francis Libermann": { rating: 7.2, board: "EC", rank: "178/747" },
  "Marshall McLuhan": { rating: 7.2, board: "EC", rank: "178/747" },
  "Mary Ward": { rating: 7.2, board: "EC", rank: "178/747" },
  "St. Joseph's": { rating: 7.2, board: "EC", rank: "178/747" },
  "Michael Power/St. Joseph": { rating: 7.1, board: "EC", rank: "201/747" },
  "St. Patrick": { rating: 7.1, board: "EC", rank: "201/747" },
  "St. Josephs Morrow Park": { rating: 6.9, board: "EC", rank: "238/747" },
  "Pope John Paul II": { rating: 6.7, board: "EC", rank: "275/747" },
  "Brebeuf": { rating: 6.2, board: "EC", rank: "349/747" },
  "Cardinal Newman": { rating: 6.2, board: "EC", rank: "349/747" },
  "Monseigneur-de-Charbonnel": { rating: 6.2, board: "EC", rank: "349/747" },
  "Philippe-Lamarche": { rating: 6, board: "EC", rank: "390/747" },
  "James Cardinal McGuigan": { rating: 5.9, board: "EC", rank: "401/747" },
  "Loretto": { rating: 5.7, board: "EC", rank: "440/747" },
  "Monsignor Percy Johnson": { rating: 5.4, board: "EC", rank: "497/747" },
  "Chaminade": { rating: 5.1, board: "EC", rank: "545/747" },
  "St. Mary's": { rating: 4.9, board: "EC", rank: "559/747" },
  "St. Basil The Great": { rating: 4.7, board: "EC", rank: "582/747" },
  "St. Joan of Arc Catholic Academy": { rating: 4.7, board: "EC", rank: "582/747" },
  "Blessed Mother Teresa": { rating: 4.6, board: "EC", rank: "591/747" },
  "Madonna": { rating: 4.6, board: "EC", rank: "591/747" },
  "Archbishop Romero": { rating: 4.5, board: "EC", rank: "605/747" },
  "Father Henry Carr": { rating: 4.4, board: "EC", rank: "620/747" },
  "Bishop Marrocco/Thomas Merton": { rating: 4.3, board: "EC", rank: "633/747" },
  "Dante Alighieri": { rating: 3.4, board: "EC", rank: "689/747" },
};

/**
 * Fuzzy match a full GeoJSON school name (e.g. "WHITNEY JR PUBLIC SCHOOL")
 * to a Fraser Institute short name (e.g. "Whitney").
 * Returns the matching fraserRatings entry or null.
 */
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/\b(junior|jr|senior|sr|public|catholic|school|elementary|secondary|collegiate|institute|academy|alternative|community|bilingual|virtual)\b/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getFraserRating(fullName) {
  if (!fullName) return null;

  // 1. Try direct lookup (case-insensitive)
  const upper = fullName.trim().toUpperCase();
  for (const [key, val] of Object.entries(fraserRatings)) {
    if (key.toUpperCase() === upper) return val;
  }

  // 2. Fuzzy match via normalized tokens
  const normalizedTarget = normalize(fullName);
  let bestMatch = null;
  let bestScore = 0;

  for (const [key, val] of Object.entries(fraserRatings)) {
    const normalizedKey = normalize(key);
    if (!normalizedKey) continue;

    let score = 0;
    if (normalizedKey === normalizedTarget) {
      score = 100;
    } else if (normalizedTarget.includes(normalizedKey) || normalizedKey.includes(normalizedTarget)) {
      const shorter = Math.min(normalizedKey.length, normalizedTarget.length);
      const longer = Math.max(normalizedKey.length, normalizedTarget.length);
      score = (shorter / longer) * 80;
    } else {
      const targetTokens = new Set(normalizedTarget.split(' ').filter(t => t.length > 2));
      const keyTokens = new Set(normalizedKey.split(' ').filter(t => t.length > 2));
      let overlap = 0;
      for (const t of targetTokens) {
        if (keyTokens.has(t)) overlap++;
      }
      if (overlap > 0) {
        score = (overlap / Math.max(targetTokens.size, keyTokens.size)) * 60;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = { val, key };
    }
  }

  if (bestScore < 50) return null;

  // Require at least 2 meaningful words in common between the matched key and the input name
  const targetWords = new Set(normalize(fullName).split(' ').filter(t => t.length > 2));
  const matchedWords = normalize(bestMatch.key).split(' ').filter(t => t.length > 2);
  const sharedWords = matchedWords.filter(w => targetWords.has(w)).length;
  if (sharedWords < 2 && matchedWords.length > 1) return null;

  return bestMatch.val;
}

export default fraserRatings;
