// 미즈호은행 공식 CSV에서 과거 Miniloto 전체 회차 데이터를 파싱해 최신 99회차를 저장하는 스크립트

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

async function crawlHistoricalMinilotoFromCSV() {
  try {
    // Step 1: 최신 CSV 파일명 목록 가져오기
    const nameUrl = 'https://www.mizuhobank.co.jp/takarakuji/apl/txt/miniloto/name.txt';
    const nameResponse = await axios.get(nameUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    const lines = nameResponse.data.split('\n').map(line => line.trim()).filter(line => line.startsWith('NAME'));
    if (lines.length === 0) throw new Error('CSV 파일명을 찾을 수 없습니다');

    // 최신값에서 회차 추출 (miniloto: A101)
    const latestFileName = lines[0].split('\t')[1].trim();
    const roundMatch = latestFileName.match(/A101(\d{4})\.CSV/i);
    if (!roundMatch) throw new Error('최신 회차 번호 추출 실패');
    const latestRound = parseInt(roundMatch[1]);

    const results = [];
    for (let i = 0; i < 99; i++) {
      const round = latestRound - i;
      const fileName = `A101${round.toString().padStart(4, '0')}.CSV`;
      const csvUrl = `https://www.mizuhobank.co.jp/retail/takarakuji/loto/miniloto/csv/${fileName}`;
      
      try {
        const csvResponse = await axios.get(csvUrl, {
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        });

        const csvText = iconv.decode(Buffer.from(csvResponse.data), 'shift-jis');
        const csvLines = csvText.split('\n').map(line => line.trim()).filter(line => line);

        const firstLine = csvLines[1];
        const roundMatch2 = firstLine.match(/第(\d+)回/);
        if (!roundMatch2) throw new Error('회차 번호를 찾을 수 없습니다');
        const currentRound = parseInt(roundMatch2[1]);

        const dateMatch = firstLine.match(/令和(\d+)年(\d+)月(\d+)日/);
        if (!dateMatch) throw new Error('추첨일을 찾을 수 없습니다');
        const year = 2018 + parseInt(dateMatch[1]);
        const month = dateMatch[2].padStart(2, '0');
        const day = dateMatch[3].padStart(2, '0');
        const date = `${year}-${month}-${day}`;
        
        const numbersLine = csvLines[3];
        const numbersParts = numbersLine.split(',');
        const numbers = [];
        let bonus = null;

        for (let j = 1; j < numbersParts.length; j++) {
          const part = numbersParts[j].trim();
          if (part === 'ボーナス数字') {
            bonus = parseInt(numbersParts[j + 1]);
            break;
          } else if (part && !isNaN(parseInt(part))) {
            numbers.push(parseInt(part));
          }
        }

        if (numbers.length !== 5 || !bonus) throw new Error('데이터 불완전');

        const result = {
          type: 'miniloto',
          round: currentRound,
          date,
          numbers: numbers.sort((a, b) => a - b),
          bonus
        };
        results.push(result);

        const dataDir = path.join(__dirname, 'data', 'miniloto');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(
          path.join(dataDir, `${currentRound}.json`),
          JSON.stringify(result, null, 2)
        );
        console.log(`✓ 저장: ${currentRound}회 (${date})`);

      } catch (e) {
        console.error(`❌ ${fileName} 파싱 실패:`, e.message);
      }
    }

    results.sort((a, b) => b.round - a.round);
    const dataDir = path.join(__dirname, 'data', 'miniloto');
    
    fs.writeFileSync(
      path.join(dataDir, 'all.json'),
      JSON.stringify(results, null, 2)
    );
    if (results.length > 0) {
      fs.writeFileSync(
        path.join(dataDir, 'latest.json'),
        JSON.stringify(results[0], null, 2)
      );
    }
    console.log(`✅ 과거 99회차 데이터 저장 완료! (${results[results.length-1]?.round}~${results[0]?.round})`);

  } catch (e) {
    console.error('❌ 전체 처리 실패:', e.message);
    process.exit(1);
  }
}

if (require.main === module) {
  crawlHistoricalMinilotoFromCSV();
}
