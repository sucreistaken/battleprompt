import { Poppins } from 'next/font/google';

/**
 * Single font family — Poppins (mirrors etkinkampus.com).
 * Weight hierarchy creates visual contrast:
 *   400 body, 500 mid, 600 strong, 700 h1, 800 display.
 */
export const poppins = Poppins({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});
