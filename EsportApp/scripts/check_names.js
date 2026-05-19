const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://api.pandascore.co',
  headers: { Authorization: `Bearer ${process.env.PANDASCORE_TOKEN}` },
});

(async () => {
  const { data } = await api.get('/valorant/matches', {
    params: { per_page: 10, sort: '-begin_at' },
  });
  data.forEach((m) => {
    console.log(
      `league="${m.league?.name}" | serie="${m.serie?.full_name}" (season=${m.serie?.season}) | tournament="${m.tournament?.name}"`,
    );
  });
})();
