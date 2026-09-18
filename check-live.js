async function check() {
  try {
    const res = await fetch('https://boltortlar.uz/?v=' + Date.now());
    const html = await res.text();
    const title = html.match(/<title>(.*?)<\/title>/)?.[1];
    const favicons = html.match(/<link rel=["']icon["'][^>]+>/g);
    console.log('HTTP Status:', res.status);
    console.log('Title:', title);
    console.log('Favicons:', favicons);

    // Check favicon.ico
    const icoRes = await fetch('https://boltortlar.uz/favicon.ico');
    console.log('favicon.ico HTTP:', icoRes.status, icoRes.headers.get('content-type'), icoRes.headers.get('content-length'));

    // Check favicon-48x48.png
    const pngRes = await fetch('https://boltortlar.uz/favicon-48x48.png');
    console.log('favicon-48x48.png HTTP:', pngRes.status, pngRes.headers.get('content-type'), pngRes.headers.get('content-length'));
  } catch (err) {
    console.error('Check error:', err.message);
  }
}

check();
