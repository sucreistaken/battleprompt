import { Source_Serif_4, Archivo_Narrow } from 'next/font/google';

export const sourceSerif = Source_Serif_4({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-source-serif',
  display: 'swap'
});

export const archivo = Archivo_Narrow({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '700'],
  variable: '--font-archivo',
  display: 'swap'
});
