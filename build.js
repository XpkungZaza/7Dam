import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('⚡ [1/2] Building with Vite...');
execSync('npx vite build', { stdio: 'inherit' });

console.log('📁 [2/2] Copying agent runtime assets to dist/ ...');
const foldersToCopy = ['Frey_AI', 'Torine_AI', 'js', 'css', 'assets'];
for (const folder of foldersToCopy) {
    if (fs.existsSync(folder)) {
        console.log(`  -> Copying ${folder} to dist/${folder}`);
        fs.cpSync(folder, path.join('dist', folder), { recursive: true });
    }
}

console.log('✅ Production bundle ready in dist/ !');
