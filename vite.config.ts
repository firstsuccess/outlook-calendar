import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],build:{rollupOptions:{input:{main:'index.html',addin:'addin.html'},output:{manualChunks(id){if(id.includes('@azure/msal'))return 'identity';if(id.includes('@js-temporal')||id.includes('/jsbi/'))return 'time';if(id.includes('read-excel-file')||id.includes('/fflate/'))return 'workbook';}}}}});
