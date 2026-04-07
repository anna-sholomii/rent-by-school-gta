// Approximate 800m x 800m rectangular catchment zones
// Centered on each school's actual location
// ±0.0036 lat (~400m), ±0.005 lng (~400m at Toronto's latitude)

const catchmentAreas = {

  // ── Public Elementary ───────────────────────────────────────────────────────

  "WHITNEY JR PUBLIC SCHOOL": {
    board: "tdsb",
    coordinates: [[
      [-79.3834, 43.6836],
      [-79.3834, 43.6908],
      [-79.3734, 43.6908],
      [-79.3734, 43.6836],
      [-79.3834, 43.6836],
    ]],
  },

  "BEDFORD PARK PUBLIC SCHOOL": {
    board: "tdsb",
    coordinates: [[
      [-79.4003, 43.7242],
      [-79.4003, 43.7314],
      [-79.3903, 43.7314],
      [-79.3903, 43.7242],
      [-79.4003, 43.7242],
    ]],
  },

  "ALLENBY JR PUBLIC SCHOOL": {
    board: "tdsb",
    coordinates: [[
      [-79.4178, 43.7058],
      [-79.4178, 43.7130],
      [-79.4078, 43.7130],
      [-79.4078, 43.7058],
      [-79.4178, 43.7058],
    ]],
  },

  "BLYTHWOOD JR PUBLIC SCHOOL": {
    board: "tdsb",
    coordinates: [[
      [-79.3945, 43.7163],
      [-79.3945, 43.7235],
      [-79.3845, 43.7235],
      [-79.3845, 43.7163],
      [-79.3945, 43.7163],
    ]],
  },

  "COTTINGHAM JR PUBLIC SCHOOL": {
    board: "tdsb",
    coordinates: [[
      [-79.4006, 43.6768],
      [-79.4006, 43.6840],
      [-79.3906, 43.6840],
      [-79.3906, 43.6768],
      [-79.4006, 43.6768],
    ]],
  },

  "JOHN ROSS ROBERTSON JR PUBLIC SCHOOL": {
    board: "tdsb",
    coordinates: [[
      [-79.4139, 43.7147],
      [-79.4139, 43.7219],
      [-79.4039, 43.7219],
      [-79.4039, 43.7147],
      [-79.4139, 43.7147],
    ]],
  },

  "JACKMAN AVENUE JR PUBLIC SCHOOL": {
    board: "tdsb",
    coordinates: [[
      [-79.3589, 43.6771],
      [-79.3589, 43.6843],
      [-79.3489, 43.6843],
      [-79.3489, 43.6771],
      [-79.3589, 43.6771],
    ]],
  },

  "ROSEDALE JR PUBLIC SCHOOL ": {
    board: "tdsb",
    coordinates: [[
      [-79.3867, 43.6741],
      [-79.3867, 43.6813],
      [-79.3767, 43.6813],
      [-79.3767, 43.6741],
      [-79.3867, 43.6741],
    ]],
  },

  "JESSE KETCHUM JR & SR PUBLIC SCHOOL": {
    board: "tdsb",
    coordinates: [[
      [-79.3971, 43.6694],
      [-79.3971, 43.6766],
      [-79.3871, 43.6766],
      [-79.3871, 43.6694],
      [-79.3971, 43.6694],
    ]],
  },

  "WITHROW AVE JR & QUEST ALTERNATIVE SR": {
    board: "tdsb",
    coordinates: [[
      [-79.3571, 43.6669],
      [-79.3571, 43.6741],
      [-79.3471, 43.6741],
      [-79.3471, 43.6669],
      [-79.3571, 43.6669],
    ]],
  },

  "HILLCREST COMMUNITY SCHOOL": {
    board: "tdsb",
    coordinates: [[
      [-79.4208, 43.6754],
      [-79.4208, 43.6826],
      [-79.4108, 43.6826],
      [-79.4108, 43.6754],
      [-79.4208, 43.6754],
    ]],
  },

  "SWANSEA JR & SR PUBLIC SCHOOL": {
    board: "tdsb",
    coordinates: [[
      [-79.4820, 43.6401],
      [-79.4820, 43.6473],
      [-79.4720, 43.6473],
      [-79.4720, 43.6401],
      [-79.4820, 43.6401],
    ]],
  },

  "RUNNYMEDE JR & SR PUBLIC SCHOOL": {
    board: "tdsb",
    coordinates: [[
      [-79.4825, 43.6523],
      [-79.4825, 43.6595],
      [-79.4725, 43.6595],
      [-79.4725, 43.6523],
      [-79.4825, 43.6523],
    ]],
  },

  "PALMERSTON AVENUE JR PUBLIC SCHOOL": {
    board: "tdsb",
    coordinates: [[
      [-79.4202, 43.6645],
      [-79.4202, 43.6717],
      [-79.4102, 43.6717],
      [-79.4102, 43.6645],
      [-79.4202, 43.6645],
    ]],
  },

  "NORWAY JR PUBLIC SCHOOL ": {
    board: "tdsb",
    coordinates: [[
      [-79.3112, 43.6728],
      [-79.3112, 43.6800],
      [-79.3012, 43.6800],
      [-79.3012, 43.6728],
      [-79.3112, 43.6728],
    ]],
  },

  "KEW BEACH JR PUBLIC SCHOOL": {
    board: "tdsb",
    coordinates: [[
      [-79.3077, 43.6649],
      [-79.3077, 43.6721],
      [-79.2977, 43.6721],
      [-79.2977, 43.6649],
      [-79.3077, 43.6649],
    ]],
  },

  "WILLIAMSON ROAD JR PUBLIC SCHOOL ": {
    board: "tdsb",
    coordinates: [[
      [-79.3025, 43.6709],
      [-79.3025, 43.6781],
      [-79.2925, 43.6781],
      [-79.2925, 43.6709],
      [-79.3025, 43.6709],
    ]],
  },

  "ADAM BECK JR PUBLIC SCHOOL": {
    board: "tdsb",
    coordinates: [[
      [-79.2935, 43.6796],
      [-79.2935, 43.6868],
      [-79.2835, 43.6868],
      [-79.2835, 43.6796],
      [-79.2935, 43.6796],
    ]],
  },

  "BROWN JR PUBLIC SCHOOL": {
    board: "tdsb",
    coordinates: [[
      [-79.4063, 43.6813],
      [-79.4063, 43.6885],
      [-79.3963, 43.6885],
      [-79.3963, 43.6813],
      [-79.4063, 43.6813],
    ]],
  },

  "DEER PARK JR & SR PUBLIC SCHOOL": {
    board: "tdsb",
    coordinates: [[
      [-79.3966, 43.6861],
      [-79.3966, 43.6933],
      [-79.3866, 43.6933],
      [-79.3866, 43.6861],
      [-79.3966, 43.6861],
    ]],
  },

  // ── Catholic Elementary ─────────────────────────────────────────────────────

  "ST SEBASTIAN CATHOLIC ELEMENTARY SCHOOL": {
    board: "tcdsb",
    coordinates: [[
      [-79.4449, 43.6592],
      [-79.4449, 43.6664],
      [-79.4349, 43.6664],
      [-79.4349, 43.6592],
      [-79.4449, 43.6592],
    ]],
  },

  "OUR LADY OF PERPETUAL HELP CATHOLIC ELEMENTARY SCHOOL": {
    board: "tcdsb",
    coordinates: [[
      [-79.3885, 43.6835],
      [-79.3885, 43.6907],
      [-79.3785, 43.6907],
      [-79.3785, 43.6835],
      [-79.3885, 43.6835],
    ]],
  },

  "ST EDWARD CATHOLIC ELEMENTARY SCHOOL": {
    board: "tcdsb",
    coordinates: [[
      [-79.4185, 43.7498],
      [-79.4185, 43.7570],
      [-79.4085, 43.7570],
      [-79.4085, 43.7498],
      [-79.4185, 43.7498],
    ]],
  },

  "ST ANTHONY CATHOLIC ELEMENTARY SCHOOL": {
    board: "tcdsb",
    coordinates: [[
      [-79.4399, 43.6600],
      [-79.4399, 43.6672],
      [-79.4299, 43.6672],
      [-79.4299, 43.6600],
      [-79.4399, 43.6600],
    ]],
  },

  "ST SYLVESTER CATHOLIC ELEMENTARY SCHOOL": {
    board: "tcdsb",
    coordinates: [[
      [-79.3072, 43.8018],
      [-79.3072, 43.8090],
      [-79.2972, 43.8090],
      [-79.2972, 43.8018],
      [-79.3072, 43.8018],
    ]],
  },

  "ST VINCENT DE PAUL CATHOLIC ELEMENTARY SCHOOL": {
    board: "tcdsb",
    coordinates: [[
      [-79.4529, 43.6432],
      [-79.4529, 43.6504],
      [-79.4429, 43.6504],
      [-79.4429, 43.6432],
      [-79.4529, 43.6432],
    ]],
  },

  "HOLY ROSARY CATHOLIC ELEMENTARY SCHOOL": {
    board: "tcdsb",
    coordinates: [[
      [-79.4191, 43.6814],
      [-79.4191, 43.6886],
      [-79.4091, 43.6886],
      [-79.4091, 43.6814],
      [-79.4191, 43.6814],
    ]],
  },

  "ST ISAAC JOGUES CATHOLIC ELEMENTARY SCHOOL": {
    board: "tcdsb",
    coordinates: [[
      [-79.3268, 43.7588],
      [-79.3268, 43.7660],
      [-79.3168, 43.7660],
      [-79.3168, 43.7588],
      [-79.3268, 43.7588],
    ]],
  },

  "BLESSED SACRAMENT CATHOLIC ELEMENTARY SCHOOL": {
    board: "tcdsb",
    coordinates: [[
      [-79.4140, 43.7239],
      [-79.4140, 43.7311],
      [-79.4040, 43.7311],
      [-79.4040, 43.7239],
      [-79.4140, 43.7239],
    ]],
  },

  "ST CECILIA CATHOLIC ELEMENTARY SCHOOL": {
    board: "tcdsb",
    coordinates: [[
      [-79.4797, 43.6572],
      [-79.4797, 43.6644],
      [-79.4697, 43.6644],
      [-79.4697, 43.6572],
      [-79.4797, 43.6572],
    ]],
  },

  "ST JOHN CATHOLIC ELEMENTARY SCHOOL": {
    board: "tcdsb",
    coordinates: [[
      [-79.2996, 43.6766],
      [-79.2996, 43.6838],
      [-79.2896, 43.6838],
      [-79.2896, 43.6766],
      [-79.2996, 43.6766],
    ]],
  },

  "ST HENRY CATHOLIC ELEMENTARY SCHOOL": {
    board: "tcdsb",
    coordinates: [[
      [-79.3328, 43.8101],
      [-79.3328, 43.8173],
      [-79.3228, 43.8173],
      [-79.3228, 43.8101],
      [-79.3328, 43.8101],
    ]],
  },

  "ST DEMETRIUS CATHOLIC ELEMENTARY SCHOOL": {
    board: "tcdsb",
    coordinates: [[
      [-79.5270, 43.6811],
      [-79.5270, 43.6883],
      [-79.5170, 43.6883],
      [-79.5170, 43.6811],
      [-79.5270, 43.6811],
    ]],
  },

  "ST GREGORY CATHOLIC ELEMENTARY SCHOOL": {
    board: "tcdsb",
    coordinates: [[
      [-79.5499, 43.6571],
      [-79.5499, 43.6643],
      [-79.5399, 43.6643],
      [-79.5399, 43.6571],
      [-79.5499, 43.6571],
    ]],
  },

  "ST AMBROSE CATHOLIC ELEMENTARY SCHOOL": {
    board: "tcdsb",
    coordinates: [[
      [-79.5551, 43.6048],
      [-79.5551, 43.6120],
      [-79.5451, 43.6120],
      [-79.5451, 43.6048],
      [-79.5551, 43.6048],
    ]],
  },

  "ST MARGARET - BEATRICE CAMPUS AND BAYCREST PUBLIC": {
    board: "tcdsb",
    coordinates: [[
      [-79.4467, 43.7251],
      [-79.4467, 43.7323],
      [-79.4367, 43.7323],
      [-79.4367, 43.7251],
      [-79.4467, 43.7251],
    ]],
  },

  "ST THOMAS MORE CATHOLIC ELEMENTARY SCHOOL": {
    board: "tcdsb",
    coordinates: [[
      [-79.2302, 43.7748],
      [-79.2302, 43.7820],
      [-79.2202, 43.7820],
      [-79.2202, 43.7748],
      [-79.2302, 43.7748],
    ]],
  },

  "CANADIAN MARTYRS CATHOLIC ELEMENTARY SCHOOL": {
    board: "tcdsb",
    coordinates: [[
      [-79.3243, 43.6946],
      [-79.3243, 43.7018],
      [-79.3143, 43.7018],
      [-79.3143, 43.6946],
      [-79.3243, 43.6946],
    ]],
  },

  "ST MONICA CATHOLIC ELEMENTARY SCHOOL": {
    board: "tcdsb",
    coordinates: [[
      [-79.4026, 43.7066],
      [-79.4026, 43.7138],
      [-79.3926, 43.7138],
      [-79.3926, 43.7066],
      [-79.4026, 43.7066],
    ]],
  },

  "SACRED HEART CATHOLIC ELEMENTARY SCHOOL": {
    board: "tcdsb",
    coordinates: [[
      [-79.2251, 43.8086],
      [-79.2251, 43.8158],
      [-79.2151, 43.8158],
      [-79.2151, 43.8086],
      [-79.2251, 43.8086],
    ]],
  },

};

export default catchmentAreas;
