const https = require('https');
https.get('https://youtube-clone-neon-nine.vercel.app/', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const jsFiles = [...data.matchAll(/src=\"(\/_next\/static\/chunks\/[^\"]+)\"/g)].map(m => m[1]);
    console.log('Found chunks:', jsFiles.length);
    let count = 0;
    let found = false;
    jsFiles.forEach(file => {
      https.get('https://youtube-clone-neon-nine.vercel.app' + file, (res2) => {
        let jsData = '';
        res2.on('data', (chunk) => { jsData += chunk; });
        res2.on('end', () => {
          if (jsData.includes('Please use correct password to link account or sign in')) {
            console.log('FOUND NEW STRING IN:', file);
            found = true;
          }
          count++;
          if (count === jsFiles.length) {
              console.log('Done checking. Found:', found);
          }
        });
      });
    });
  });
});
