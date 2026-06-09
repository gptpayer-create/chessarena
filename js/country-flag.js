/* ═══════════════════════════════════════════════════════════════
   ChessArena — Country Flag Detector
   ──────────────────────────────────────────────────────────────
   Timezone se country detect karta hai (no API, no geolocation)
   Flag emoji = regional indicator letters (A=🇦, Z=🇿)
   localStorage mein cache karta hai
═══════════════════════════════════════════════════════════════ */

/* ── Timezone → Country Code map ── */
const TZ_COUNTRY = {
  // India
  'Asia/Kolkata'              : 'IN',
  'Asia/Calcutta'             : 'IN',
  // Pakistan
  'Asia/Karachi'              : 'PK',
  // Bangladesh
  'Asia/Dhaka'                : 'BD',
  // Nepal
  'Asia/Kathmandu'            : 'NP',
  'Asia/Katmandu'             : 'NP',
  // Sri Lanka
  'Asia/Colombo'              : 'LK',
  // Afghanistan
  'Asia/Kabul'                : 'AF',
  // UAE
  'Asia/Dubai'                : 'AE',
  // Saudi Arabia
  'Asia/Riyadh'               : 'SA',
  // Qatar
  'Asia/Qatar'                : 'QA',
  // Kuwait
  'Asia/Kuwait'               : 'KW',
  // Bahrain
  'Asia/Bahrain'              : 'BH',
  // Oman
  'Asia/Muscat'               : 'OM',
  // Iran
  'Asia/Tehran'               : 'IR',
  // Iraq
  'Asia/Baghdad'              : 'IQ',
  // Israel
  'Asia/Jerusalem'            : 'IL',
  'Asia/Tel_Aviv'             : 'IL',
  // Turkey
  'Europe/Istanbul'           : 'TR',
  'Asia/Istanbul'             : 'TR',
  // Russia
  'Europe/Moscow'             : 'RU',
  'Europe/Kaliningrad'        : 'RU',
  'Europe/Samara'             : 'RU',
  'Asia/Yekaterinburg'        : 'RU',
  'Asia/Omsk'                 : 'RU',
  'Asia/Novosibirsk'          : 'RU',
  'Asia/Krasnoyarsk'          : 'RU',
  'Asia/Irkutsk'              : 'RU',
  'Asia/Yakutsk'              : 'RU',
  'Asia/Vladivostok'          : 'RU',
  'Asia/Magadan'              : 'RU',
  'Asia/Sakhalin'             : 'RU',
  'Asia/Kamchatka'            : 'RU',
  // China
  'Asia/Shanghai'             : 'CN',
  'Asia/Hong_Kong'            : 'HK',
  'Asia/Urumqi'               : 'CN',
  // Japan
  'Asia/Tokyo'                : 'JP',
  // South Korea
  'Asia/Seoul'                : 'KR',
  // North Korea
  'Asia/Pyongyang'            : 'KP',
  // Taiwan
  'Asia/Taipei'               : 'TW',
  // Singapore
  'Asia/Singapore'            : 'SG',
  // Malaysia
  'Asia/Kuala_Lumpur'         : 'MY',
  'Asia/Kuching'              : 'MY',
  // Indonesia
  'Asia/Jakarta'              : 'ID',
  'Asia/Makassar'             : 'ID',
  'Asia/Jayapura'             : 'ID',
  // Philippines
  'Asia/Manila'               : 'PH',
  // Thailand
  'Asia/Bangkok'              : 'TH',
  // Vietnam
  'Asia/Ho_Chi_Minh'          : 'VN',
  'Asia/Saigon'               : 'VN',
  'Asia/Hanoi'                : 'VN',
  // Myanmar
  'Asia/Rangoon'              : 'MM',
  'Asia/Yangon'               : 'MM',
  // Cambodia
  'Asia/Phnom_Penh'           : 'KH',
  // Laos
  'Asia/Vientiane'            : 'LA',
  // Mongolia
  'Asia/Ulaanbaatar'          : 'MN',
  // Kazakhstan
  'Asia/Almaty'               : 'KZ',
  'Asia/Qyzylorda'            : 'KZ',
  'Asia/Aqtau'                : 'KZ',
  'Asia/Aqtobe'               : 'KZ',
  // Uzbekistan
  'Asia/Tashkent'             : 'UZ',
  // Azerbaijan
  'Asia/Baku'                 : 'AZ',
  // Georgia
  'Asia/Tbilisi'              : 'GE',
  // Armenia
  'Asia/Yerevan'              : 'AM',
  // Cyprus
  'Asia/Nicosia'              : 'CY',
  // UK
  'Europe/London'             : 'GB',
  'Europe/Belfast'            : 'GB',
  // Ireland
  'Europe/Dublin'             : 'IE',
  // France
  'Europe/Paris'              : 'FR',
  // Germany
  'Europe/Berlin'             : 'DE',
  'Europe/Busingen'           : 'DE',
  // Italy
  'Europe/Rome'               : 'IT',
  // Spain
  'Europe/Madrid'             : 'ES',
  'Atlantic/Canary'           : 'ES',
  // Portugal
  'Europe/Lisbon'             : 'PT',
  'Atlantic/Azores'           : 'PT',
  'Atlantic/Madeira'          : 'PT',
  // Netherlands
  'Europe/Amsterdam'          : 'NL',
  // Belgium
  'Europe/Brussels'           : 'BE',
  // Switzerland
  'Europe/Zurich'             : 'CH',
  // Austria
  'Europe/Vienna'             : 'AT',
  // Sweden
  'Europe/Stockholm'          : 'SE',
  // Norway
  'Europe/Oslo'               : 'NO',
  // Denmark
  'Europe/Copenhagen'         : 'DK',
  // Finland
  'Europe/Helsinki'           : 'FI',
  // Poland
  'Europe/Warsaw'             : 'PL',
  // Czech Republic
  'Europe/Prague'             : 'CZ',
  // Slovakia
  'Europe/Bratislava'         : 'SK',
  // Hungary
  'Europe/Budapest'           : 'HU',
  // Romania
  'Europe/Bucharest'          : 'RO',
  // Bulgaria
  'Europe/Sofia'              : 'BG',
  // Greece
  'Europe/Athens'             : 'GR',
  // Croatia
  'Europe/Zagreb'             : 'HR',
  // Serbia
  'Europe/Belgrade'           : 'RS',
  // Ukraine
  'Europe/Kiev'               : 'UA',
  'Europe/Kyiv'               : 'UA',
  // Belarus
  'Europe/Minsk'              : 'BY',
  // Lithuania
  'Europe/Vilnius'            : 'LT',
  // Latvia
  'Europe/Riga'               : 'LV',
  // Estonia
  'Europe/Tallinn'            : 'EE',
  // USA
  'America/New_York'          : 'US',
  'America/Chicago'           : 'US',
  'America/Denver'            : 'US',
  'America/Los_Angeles'       : 'US',
  'America/Phoenix'           : 'US',
  'America/Anchorage'         : 'US',
  'Pacific/Honolulu'          : 'US',
  'America/Detroit'           : 'US',
  'America/Indiana/Indianapolis': 'US',
  'America/Boise'             : 'US',
  // Canada
  'America/Toronto'           : 'CA',
  'America/Vancouver'         : 'CA',
  'America/Edmonton'          : 'CA',
  'America/Winnipeg'          : 'CA',
  'America/Halifax'           : 'CA',
  'America/St_Johns'          : 'CA',
  'America/Regina'            : 'CA',
  // Mexico
  'America/Mexico_City'       : 'MX',
  'America/Cancun'            : 'MX',
  'America/Monterrey'         : 'MX',
  // Brazil
  'America/Sao_Paulo'         : 'BR',
  'America/Manaus'            : 'BR',
  'America/Belem'             : 'BR',
  'America/Fortaleza'         : 'BR',
  'America/Recife'            : 'BR',
  'America/Bahia'             : 'BR',
  'America/Cuiaba'            : 'BR',
  'America/Porto_Velho'       : 'BR',
  'America/Rio_Branco'        : 'BR',
  'America/Noronha'           : 'BR',
  // Argentina
  'America/Argentina/Buenos_Aires': 'AR',
  'America/Buenos_Aires'      : 'AR',
  // Colombia
  'America/Bogota'            : 'CO',
  // Chile
  'America/Santiago'          : 'CL',
  // Peru
  'America/Lima'              : 'PE',
  // Venezuela
  'America/Caracas'           : 'VE',
  // Ecuador
  'America/Guayaquil'         : 'EC',
  // Bolivia
  'America/La_Paz'            : 'BO',
  // Uruguay
  'America/Montevideo'        : 'UY',
  // Paraguay
  'America/Asuncion'          : 'PY',
  // Australia
  'Australia/Sydney'          : 'AU',
  'Australia/Melbourne'       : 'AU',
  'Australia/Brisbane'        : 'AU',
  'Australia/Adelaide'        : 'AU',
  'Australia/Perth'           : 'AU',
  'Australia/Darwin'          : 'AU',
  'Australia/Hobart'          : 'AU',
  // New Zealand
  'Pacific/Auckland'          : 'NZ',
  // South Africa
  'Africa/Johannesburg'       : 'ZA',
  // Nigeria
  'Africa/Lagos'              : 'NG',
  // Kenya
  'Africa/Nairobi'            : 'KE',
  // Egypt
  'Africa/Cairo'              : 'EG',
  // Ethiopia
  'Africa/Addis_Ababa'        : 'ET',
  // Ghana
  'Africa/Accra'              : 'GH',
  // Tanzania
  'Africa/Dar_es_Salaam'      : 'TZ',
  // Uganda
  'Africa/Kampala'            : 'UG',
  // Morocco
  'Africa/Casablanca'         : 'MA',
  // Algeria
  'Africa/Algiers'            : 'DZ',
  // Tunisia
  'Africa/Tunis'              : 'TN',
  // Libya
  'Africa/Tripoli'            : 'LY',
  // Senegal
  'Africa/Dakar'              : 'SN',
  // Ivory Coast
  'Africa/Abidjan'            : 'CI',
  // Cameroon
  'Africa/Douala'             : 'CM',
  // Sudan
  'Africa/Khartoum'           : 'SD',
  // Zimbabwe
  'Africa/Harare'             : 'ZW',
  // Zambia
  'Africa/Lusaka'             : 'ZM',
  // Mozambique
  'Africa/Maputo'             : 'MZ',
  // Angola
  'Africa/Luanda'             : 'AO',
  // Pacific
  'Pacific/Fiji'              : 'FJ',
  'Pacific/Guam'              : 'GU',
  'Pacific/Port_Moresby'      : 'PG',
};

/* ── Country Code → Flag Emoji ── */
function countryCodeToFlag(code) {
  if (!code || code.length !== 2) return '🌐';
  const offset = 0x1F1E6 - 65; // 'A'.charCodeAt(0) = 65
  return String.fromCodePoint(code.charCodeAt(0) + offset) +
         String.fromCodePoint(code.charCodeAt(1) + offset);
}

/* ── Country Code → Country Name ── */
const COUNTRY_NAMES = {
  IN:'India', PK:'Pakistan', BD:'Bangladesh', NP:'Nepal', LK:'Sri Lanka',
  AF:'Afghanistan', AE:'UAE', SA:'Saudi Arabia', QA:'Qatar', KW:'Kuwait',
  BH:'Bahrain', OM:'Oman', IR:'Iran', IQ:'Iraq', IL:'Israel', TR:'Turkey',
  RU:'Russia', CN:'China', HK:'Hong Kong', JP:'Japan', KR:'South Korea',
  TW:'Taiwan', SG:'Singapore', MY:'Malaysia', ID:'Indonesia', PH:'Philippines',
  TH:'Thailand', VN:'Vietnam', MM:'Myanmar', KH:'Cambodia', LA:'Laos',
  MN:'Mongolia', KZ:'Kazakhstan', UZ:'Uzbekistan', AZ:'Azerbaijan',
  GE:'Georgia', AM:'Armenia', CY:'Cyprus',
  GB:'United Kingdom', IE:'Ireland', FR:'France', DE:'Germany', IT:'Italy',
  ES:'Spain', PT:'Portugal', NL:'Netherlands', BE:'Belgium', CH:'Switzerland',
  AT:'Austria', SE:'Sweden', NO:'Norway', DK:'Denmark', FI:'Finland',
  PL:'Poland', CZ:'Czech Republic', SK:'Slovakia', HU:'Hungary', RO:'Romania',
  BG:'Bulgaria', GR:'Greece', HR:'Croatia', RS:'Serbia', UA:'Ukraine',
  BY:'Belarus', LT:'Lithuania', LV:'Latvia', EE:'Estonia',
  US:'USA', CA:'Canada', MX:'Mexico', BR:'Brazil', AR:'Argentina',
  CO:'Colombia', CL:'Chile', PE:'Peru', VE:'Venezuela', EC:'Ecuador',
  BO:'Bolivia', UY:'Uruguay', PY:'Paraguay',
  AU:'Australia', NZ:'New Zealand',
  ZA:'South Africa', NG:'Nigeria', KE:'Kenya', EG:'Egypt', ET:'Ethiopia',
  GH:'Ghana', TZ:'Tanzania', UG:'Uganda', MA:'Morocco', DZ:'Algeria',
  TN:'Tunisia', LY:'Libya', SN:'Senegal', CI:'Ivory Coast', CM:'Cameroon',
  SD:'Sudan', ZW:'Zimbabwe', ZM:'Zambia', MZ:'Mozambique', AO:'Angola',
  FJ:'Fiji', GU:'Guam', PG:'Papua New Guinea', KP:'North Korea',
};

/* ── Detect My Country ── */
function detectMyCountry() {
  // Check cache first (valid for 7 days)
  const cached = localStorage.getItem('cm_country');
  const cachedAt = parseInt(localStorage.getItem('cm_country_at') || '0');
  if (cached && Date.now() - cachedAt < 7 * 24 * 60 * 60 * 1000) return cached;

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const code = TZ_COUNTRY[tz] || null;
    if (code) {
      localStorage.setItem('cm_country', code);
      localStorage.setItem('cm_country_at', Date.now().toString());
      return code;
    }
  } catch(e) {}
  return null;
}

/* ── Get Flag Emoji for current user ── */
function getMyFlag() {
  const code = detectMyCountry();
  return code ? countryCodeToFlag(code) : '🌐';
}

/* ── Get Flag HTML span (with tooltip) ── */
function flagHtml(code, size) {
  if (!code) return '';
  const flag = countryCodeToFlag(code);
  const name = COUNTRY_NAMES[code] || code;
  const fs   = size || '1rem';
  return `<span class="country-flag" title="${name}" style="font-size:${fs};line-height:1;">${flag}</span>`;
}

console.log('[ChessArena] Country Flag v1.0 loaded — ' + (detectMyCountry() || 'unknown') + ' ' + getMyFlag());
