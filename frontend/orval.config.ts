import { defineConfig } from 'orval';

export default defineConfig({
  myApi: {
    input: {
      target: 'http://backend:8000/api/schema',
    },
    output: {
      mode: 'tags-split',      
      target: 'src/api',
      schemas: 'src/api/model',
      client: 'react-query',
      httpClient: 'axios',
      clean: true, // clean-up of old files before gen. new
    },
  },
});