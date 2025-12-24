/**
 * 과거 100회차 초기 데이터 생성 스크립트
 * 
 * 실제 크롤링은 최신 회차만 하고, 
 * 과거 데이터는 수동으로 추가하거나 이 스크립트로 초기화합니다.
 */

const fs = require('fs');
const path = require('path');

// 최신 회차 번호 (수동 입력 필요)
const LATEST_ROUND = 2061;

// 과거 100회차 데이터 생성 (더미 데이터)
function generateHistoricalData() {
  const dataDir = path.join(__dirname, 'data', 'loto6');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const allData = [];
  
  for (let i = 0; i < 100; i++) {
    const round = LATEST_ROUND - i;
    
    // 더미 번호 생성 (1-43 중 6개 + 보너스 1개)
    const numbers = [];
    while (numbers.length < 6) {
      const num = Math.floor(Math.random() * 43) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    numbers.sort((a, b) => a - b);
    
    let bonus;
    do {
      bonus = Math.floor(Math.random() * 43) + 1;
    } while (numbers.includes(bonus));
    
    // 추첨일 계산 (매주 월/목, 대략 3-4일 간격)
    const daysAgo = i * 3.5;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const dateStr = date.toISOString().split('T')[0];
    
    const data = {
      type: 'loto6',
      round,
      date: dateStr,
      numbers,
      bonus
    };
    
    // 회차별 JSON 파일 생성
    fs.writeFileSync(
      path.join(dataDir, `${round}.json`),
      JSON.stringify(data, null, 2)
    );
    
    allData.push(data);
    
    if (i < 5) {
      console.log(`✓ 생성: 第${round}回 (${numbers.join(', ')}) + Bonus: ${bonus}`);
    }
  }
  
  // all.json 생성
  allData.sort((a, b) => b.round - a.round);
  fs.writeFileSync(
    path.join(dataDir, 'all.json'),
    JSON.stringify(allData, null, 2)
  );
  
  // latest.json = 최신 회차
  fs.writeFileSync(
    path.join(dataDir, 'latest.json'),
    JSON.stringify(allData[0], null, 2)
  );
  
  console.log(`\n✅ 총 ${allData.length}개 회차 데이터 생성 완료!`);
  console.log(`📊 회차 범위: 第${LATEST_ROUND - 99}回 ~ 第${LATEST_ROUND}回`);
  console.log(`\n⚠️  주의: 이것은 더미 데이터입니다!`);
  console.log(`실제 당첨번호로 교체하려면 crawl.js를 실행하거나`);
  console.log(`data/loto6/{회차번호}.json 파일을 직접 수정하세요.`);
}

if (require.main === module) {
  generateHistoricalData();
}
