const https = require('https');
const fs = require('fs');

function download(url, dest) {
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'Accept': 'image/jpeg,image/png,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Connection': 'keep-alive'
    }
  };
  https.get(url, options, (res) => {
    if (res.statusCode === 301 || res.statusCode === 302) {
      return download(res.headers.location, dest);
    }
    const file = fs.createWriteStream(dest);
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Downloaded ' + dest + ' Size: ' + fs.statSync(dest).size);
    });
  }).on('error', (err) => {
    console.error('Error downloading ' + url + ': ' + err.message);
  });
}

download('https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/The_Jackson_5_1972.JPG/800px-The_Jackson_5_1972.JPG', 'c:/xamppprojs2/htdocs/HStore/media/images/history_pg/mj_jackson5.jpg');
download('https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Michael_Jackson_in_1988.jpg/800px-Michael_Jackson_in_1988.jpg', 'c:/xamppprojs2/htdocs/HStore/media/images/history_pg/mj_thriller.jpg');
download('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Michael_Jackson_1993.jpg/800px-Michael_Jackson_1993.jpg', 'c:/xamppprojs2/htdocs/HStore/media/images/history_pg/mj_king_of_pop.jpg');
download('https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Michael_Jackson_in_1988.jpg/1280px-Michael_Jackson_in_1988.jpg', 'c:/xamppprojs2/htdocs/HStore/media/images/history_pg/mj_bg.jpg');
