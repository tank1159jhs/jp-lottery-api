const axios = require('axios');
const iconv = require('iconv-lite');

(async () => {
  const url = 'https://www.mizuhobank.co.jp/retail/takarakuji/loto/loto6/csv/A1022062.CSV';
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const text = iconv.decode(Buffer.from(response.data), 'shift-jis');
  const lines = text.split('\n');
  console.log('=== 첫 5줄 ===');
  lines.slice(0, 5).forEach((line, i) => console.log(`${i}: [${line.trim()}]`));
})();
