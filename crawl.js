const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

async function crawlLatestLoto6() {
  try {
    console.log('🔍 로또6 크롤링 시작 (더미 데이터)...');
    
    // 실제 크롤링 대신 더미 데이터 생성
    const now = new Date();
    const round = 2061;
    
    const result = {
      type: 'loto6',
      round,
      date: now.toISOString().split('T')[0],
      numbers: [3, 12, 17, 24, 31, 42],
      bonus: 15,
    };
    
    console.log('✅ 데이터 생성 완료');
    console.log(JSON.stringify(result, null, 2));
    
    return result;
    
  } catch (error) {
    console.error('❌ 실패:', error.message);
    return null;
  }
}

async function saveToFile(data) {
  if (!data) return;
  
  const dataDir = path.join(__dirname, 'data', 'loto6');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // 회차별 파일
  fs.writeFileSync(
    path.join(dataDir, `${data.round}.json`),
    JSON.stringify(data, null, 2)
  );
  
  // 최신 데이터
  fs.writeFileSync(
    path.join(dataDir, 'latest.json'),
    JSON.stringify(data, null, 2)
  );
  
  // 전체 목록
  const allFile = path.join(dataDir, 'all.json');
  let allData = [];
  
  if (fs.existsSync(allFile)) {
    allData = JSON.parse(fs.readFileSync(allFile, 'utf8'));
  }
  
  allData = allData.filter(item => item.round !== data.round);
  allData.push(data);
  allData.sort((a, b) => b.round - a.round);
  
  fs.writeFileSync(allFile, JSON.stringify(allData, null, 2));
  
  console.log(`📝 저장 완료: data/loto6/${data.round}.json, latest.json, all.json`);
}

async function main() {
  console.log('🎰 Loto6 Crawler');
  const data = await crawlLatestLoto6();
  await saveToFile(data);
  console.log('✅ 완료!');
}

if (require.main === module) {
  main().catch(console.error);
}
