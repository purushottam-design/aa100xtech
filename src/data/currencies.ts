export type Currency = {
  code: string;
  symbol: string;
  name: string;
  country: string;
  countryCode: string;
};

/** Display currencies offered in the navbar selector. Base of all site prices is INR. */
export const currencies: Currency[] = [
  { code: "INR", symbol: "₹", name: "Indian Rupee", country: "India", countryCode: "IN" },
  { code: "USD", symbol: "$", name: "US Dollar", country: "United States", countryCode: "US" },
  { code: "EUR", symbol: "€", name: "Euro", country: "European Union", countryCode: "EU" },
  { code: "GBP", symbol: "£", name: "British Pound", country: "United Kingdom", countryCode: "GB" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", country: "United Arab Emirates", countryCode: "AE" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal", country: "Saudi Arabia", countryCode: "SA" },
  { code: "QAR", symbol: "﷼", name: "Qatari Riyal", country: "Qatar", countryCode: "QA" },
  { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar", country: "Kuwait", countryCode: "KW" },
  { code: "BHD", symbol: ".د.ب", name: "Bahraini Dinar", country: "Bahrain", countryCode: "BH" },
  { code: "OMR", symbol: "﷼", name: "Omani Rial", country: "Oman", countryCode: "OM" },
  { code: "NPR", symbol: "₨", name: "Nepalese Rupee", country: "Nepal", countryCode: "NP" },
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka", country: "Bangladesh", countryCode: "BD" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee", country: "Pakistan", countryCode: "PK" },
  { code: "LKR", symbol: "Rs", name: "Sri Lankan Rupee", country: "Sri Lanka", countryCode: "LK" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", country: "Malaysia", countryCode: "MY" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", country: "Singapore", countryCode: "SG" },
  { code: "THB", symbol: "฿", name: "Thai Baht", country: "Thailand", countryCode: "TH" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah", country: "Indonesia", countryCode: "ID" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso", country: "Philippines", countryCode: "PH" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong", country: "Vietnam", countryCode: "VN" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", country: "Japan", countryCode: "JP" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", country: "China", countryCode: "CN" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar", country: "Hong Kong", countryCode: "HK" },
  { code: "TWD", symbol: "NT$", name: "New Taiwan Dollar", country: "Taiwan", countryCode: "TW" },
  { code: "KRW", symbol: "₩", name: "South Korean Won", country: "South Korea", countryCode: "KR" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", country: "Australia", countryCode: "AU" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar", country: "New Zealand", countryCode: "NZ" },
  { code: "FJD", symbol: "FJ$", name: "Fijian Dollar", country: "Fiji", countryCode: "FJ" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", country: "Canada", countryCode: "CA" },
  { code: "MXN", symbol: "Mex$", name: "Mexican Peso", country: "Mexico", countryCode: "MX" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", country: "Brazil", countryCode: "BR" },
  { code: "ARS", symbol: "AR$", name: "Argentine Peso", country: "Argentina", countryCode: "AR" },
  { code: "CLP", symbol: "CLP$", name: "Chilean Peso", country: "Chile", countryCode: "CL" },
  { code: "COP", symbol: "COL$", name: "Colombian Peso", country: "Colombia", countryCode: "CO" },
  { code: "PEN", symbol: "S/", name: "Peruvian Sol", country: "Peru", countryCode: "PE" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", country: "Switzerland", countryCode: "CH" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona", country: "Sweden", countryCode: "SE" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone", country: "Norway", countryCode: "NO" },
  { code: "DKK", symbol: "kr", name: "Danish Krone", country: "Denmark", countryCode: "DK" },
  { code: "PLN", symbol: "zł", name: "Polish Zloty", country: "Poland", countryCode: "PL" },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna", country: "Czechia", countryCode: "CZ" },
  { code: "HUF", symbol: "Ft", name: "Hungarian Forint", country: "Hungary", countryCode: "HU" },
  { code: "RON", symbol: "lei", name: "Romanian Leu", country: "Romania", countryCode: "RO" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira", country: "Türkiye", countryCode: "TR" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble", country: "Russia", countryCode: "RU" },
  { code: "UAH", symbol: "₴", name: "Ukrainian Hryvnia", country: "Ukraine", countryCode: "UA" },
  { code: "ILS", symbol: "₪", name: "Israeli Shekel", country: "Israel", countryCode: "IL" },
  { code: "ZAR", symbol: "R", name: "South African Rand", country: "South Africa", countryCode: "ZA" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", country: "Nigeria", countryCode: "NG" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling", country: "Kenya", countryCode: "KE" },
  { code: "GHS", symbol: "₵", name: "Ghanaian Cedi", country: "Ghana", countryCode: "GH" },
  { code: "EGP", symbol: "E£", name: "Egyptian Pound", country: "Egypt", countryCode: "EG" },
  { code: "MAD", symbol: "د.م.", name: "Moroccan Dirham", country: "Morocco", countryCode: "MA" },
  { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling", country: "Tanzania", countryCode: "TZ" },
  { code: "MUR", symbol: "₨", name: "Mauritian Rupee", country: "Mauritius", countryCode: "MU" },
];

export const BASE_CURRENCY = "INR";

export const currencyByCode = new Map(currencies.map((c) => [c.code, c]));
