import { defineConfig } from 'vite';
import path from 'path';

// If this is a project page like https://USERNAME.github.io/REPO,
// set base to '/REPO/'. If it's your user site (USERNAME.github.io),
// set base to '/' or just omit it.
const base = '/';

export default defineConfig({
  base,
  build: {
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'index.html'),
        cv: path.resolve(__dirname, 'cv.html'),
        recipes: path.resolve(__dirname, 'recipes.html'),
        hikes: path.resolve(__dirname, 'hikes.html'),
        portfolio: path.resolve(__dirname, 'portfolio.html'),
      },
    },
  },
});
