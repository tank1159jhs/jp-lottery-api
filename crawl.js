const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function crawlLatestLoto6() {
  let browser;
  try {
    console.log('🔍 로또6 실제 크롤링 시작...');
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    console.log('📄 페이지 로딩 중...');
    
    await page.goto('https://www.mizuhobank.co.jp/retail/takarakuji/loto/loto6/index.html', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('🔎 당첨번호 추출 중...');
    
    // 페이지에서 당첨번호 정보 추출
    const result = await page.evaluate(() => {
      // 회차 번호 찾기
      const roundElement = document.querySelector('.box-winning-no .heading-lv3-01');
      if (!roundElement) return null;
      
      const roundText = roundElement.textContent;
      const roundMatch = roundText.match(/第(\d+)回/);
      if (!roundMatch) return null;
      
      const round = parseInt(roundMatch[1]);
      
      // 추첨일 찾기
      const dateElement = document.querySelector('.box-winning-no .date');
      let date = new Date().toISOString().split('T')[0];
      
      if (dateElement) {
        const dateText = dateElement.textContent.trim();
        const dateMatch = dateText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
        if (dateMatch) {
          const year = dateMatch[1];
          const month = dateMatch[2].padStart(2, '0');
          const day = dateMatch[3].padStart(2, '0');
          date = `${year}-${month}-${day}`;
        }
      }
      
      // 본수字 (당첨번호) 찾기
      const numberElements = document.querySelectorAll('.box-winning-no .win-num01 .num');
      const numbers = Array.from(numberElements)
        .map(el => parseInt(el.textContent.trim()))
        .filter(n => !isNaN(n))
        .sort((a, b) => a - b);
      
      // ボーナス数字 (보너스 번호) 찾기
      const bonusElement = document.querySelector('.box-winning-no .win-num02 .num');
      const bonus = bonusElement ? parseInt(bonusElement.textContent.trim()) : null;
      
      if (numbers.length !== 6 || !bonus) {
        return null;
      }
      
      return {
        type: 'loto6',
        round,
        date,
        numbers,
        bonus
      };
    });
    
    if (!result) {
      throw new Error('당첨번호를 찾을 수 없습니다');
    }
    
    console.log('✅ 크롤링 성공!');
    console.log(JSON.stringify(result, null, 2));
    
    return result;
    
  } catch (error) {
    console.error('❌ 크롤링 실패:', error.message);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function saveToFile(data) {
  if (!data) {
    console.error('❌ 크롤링 실패: 데이터가 없어 저장하지 않습니다.');
    console.error('⚠️  더미 데이터 대신 에러 상태를 유지합니다.');
    process.exit(1); // 실패 코드로 종료
  }
  
  const dataDir = path.join(__dirname, 'data', 'loto6');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // 회차별 파일 저장
  fs.writeFileSync(
    path.join(dataDir, `${data.round}.json`),
    JSON.stringify(data, null, 2)
  );
  
  // 최신 데이터 저장
  fs.writeFileSync(
    path.join(dataDir, 'latest.json'),
    JSON.stringify(data, null, 2)
  );
  
  // 전체 목록 업데이트 (최대 100회차 유지)
  const allFile = path.join(dataDir, 'all.json');
  let allData = [];
  
  if (fs.existsSync(allFile)) {
    allData = JSON.parse(fs.readFileSync(allFile, 'utf8'));
  }
  
  // 중복 제거 (같은 회차가 있으면 새 데이터로 교체)
  allData = allData.filter(item => item.round !== data.round);
  allData.push(data);
  
  // 회차 내림차순 정렬
  allData.sort((a, b) => b.round - a.round);
  
  // 최대 100회차만 유지
  if (allData.length > 100) {
    const removed = allData.slice(100);
    allData = allData.slice(0, 100);
    
    // 오래된 회차별 JSON 파일 삭제
    removed.forEach(item => {
      const oldFile = path.join(dataDir, `${item.round}.json`);
      if (fs.existsSync(oldFile)) {
        fs.unlinkSync(oldFile);
        console.log(`🗑️  삭제: ${item.round}.json (100회차 이전)`);
      }
    });
  }
  
  fs.writeFileSync(allFile, JSON.stringify(allData, null, 2));
  
  console.log(`📝 저장 완료: data/loto6/${data.round}.json, latest.json`);
  console.log(`📊 전체 회차: ${allData.length}개 (최대 100개 유지)`);
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
