const PRODUCTION_URL = 'https://campus-connect-api-kq3u.onrender.com';

export function pingServer() {
  fetch(`${PRODUCTION_URL}/api/health`)
    .then(() => console.log('Server warm'))
    .catch(() => {});
}
