// postcss.config.js
import tailwindcss from '@tailwindcss/postcss'; // Changed import
import autoprefixer from 'autoprefixer';

export default {
  plugins: [
    tailwindcss,
    autoprefixer,
  ],
}
