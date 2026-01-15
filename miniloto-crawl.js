const axios = require('axios');
const iconv = require('iconv-lite');
const fs = require('fs');
const path = require('path');

async function crawlLatestMiniloto() {
  try {
    console.log('🔍 미니로또 크롤링 시작...');
    
    // Step 1: 최신 CSV 파일명 가져오기
    const nameUrl = 'https://www.mizuhobank.co.jp/takarakuji/apl/txt/miniloto/name.txt';
    const nameResponse = await axios.get(nameUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    const lines = nameResponse.data.split('\n');
    const latestLine = lines.find(line => line.startsWith('NAME'));
    if (!latestLine) {
      throw new Error('CSV 파일명을 찾을 수 없습니다');
    }
    
    const csvFileName = latestLine.split('\t')[1].trim();
    console.log(`📄 최신 CSV 파일: ${csvFileName}`);
    
    // [추가] 중복 실행 방지: 로컬에 이미 최신 회차가 있으면 다운로드 건너뜀
    try {
      const latestFile = path.join(__dirname, 'data', 'miniloto', 'latest.json');
      if (fs.existsSync(latestFile)) {
        const localData = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
        const match = csvFileName.match(/A101(\d{4})\.CSV/i); // Mini Loto는 A101
        if (match && localData.round === parseInt(match[1])) {
          console.log(`✅ 이미 최신 회차(${localData.round}회)가 존재합니다. 스킵합니다.`);
          return { skipped: true };
        }
      }
    } catch (e) { /* 무시하고 진행 */ }
    
    // Step 2: CSV 파일 다운로드 (Shift-JIS 인코딩)
    const csvUrl = `https://www.mizuhobank.co.jp/retail/takarakuji/loto/miniloto/csv/${csvFileName}`;
    const csvResponse = await axios.get(csvUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    // Shift-JIS → UTF-8 변환
    const csvText = iconv.decode(Buffer.from(csvResponse.data), 'shift-jis');
    const csvLines = csvText.split('\n').map(line => line.trim()).filter(line => line);
    
    console.log(`📝 CSV 라인 수: ${csvLines.length}`);
    console.log(`첫 3줄:\n${csvLines.slice(0, 3).join('\n')}`);
    
    // Step 3: CSV 파싱
    const firstLine = csvLines[1];
    const roundMatch = firstLine.match(/第(\d+)回/);
    if (!roundMatch) {
      throw new Error('회차 번호를 찾을 수 없습니다');
    }
    const round = parseInt(roundMatch[1]);
    
    const dateMatch = firstLine.match(/令和(\d+)年(\d+)月(\d+)日/);
    if (!dateMatch) {
      throw new Error('추첨일을 찾을 수 없습니다');
    }
    const year = 2018 + parseInt(dateMatch[1]);
    const month = dateMatch[2].padStart(2, '0');
    const day = dateMatch[3].padStart(2, '0');
    const date = `${year}-${month}-${day}`;
    
    const numbersLine = csvLines[3];
    const numbersParts = numbersLine.split(',');
    
    const numbers = [];
    let bonus = null;
    
    for (let i = 1; i < numbersParts.length; i++) {
      const part = numbersParts[i].trim();
      if (part === 'ボーナス数字') {
        bonus = parseInt(numbersParts[i + 1]);
        break;
      } else if (part && !isNaN(parseInt(part))) {
        numbers.push(parseInt(part));
      }
    }
    
    if (numbers.length !== 5 || !bonus) {
      throw new Error(`데이터 불완전: 본수자 ${numbers.length}개, 보너스 ${bonus}`);
    }
    
    const result = {
      type: 'miniloto',
      round,
      date,
      numbers: numbers.sort((a, b) => a - b),
      bonus
    };
    
    console.log('✅ 크롤링 성공!');
    console.log(JSON.stringify(result, null, 2));
    
    return result;
    
  } catch (error) {
    console.error('❌ 크롤링 실패:', error.message);
    console.error(error.stack);
    return null;
  }
}

async function saveToFile(data) {
  if (!data) {
    console.error('❌ 크롤링 실패: 데이터가 없어 저장하지 않습니다.');
    console.error('⚠️  더미 데이터 대신 에러 상태를 유지합니다.');
    process.exit(1);
  }
  
  const dataDir = path.join(__dirname, 'data', 'miniloto');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(dataDir, `${data.round}.json`),
    JSON.stringify(data, null, 2)
  );
  
  fs.writeFileSync(
    path.join(dataDir, 'latest.json'),
    JSON.stringify(data, null, 2)
  );
  
  const allFile = path.join(dataDir, 'all.json');
  let allData = [];
  
  if (fs.existsSync(allFile)) {
    allData = JSON.parse(fs.readFileSync(allFile, 'utf8'));
  }
  
  allData = allData.filter(item => item.round !== data.round);
  allData.push(data);
  
  allData.sort((a, b) => b.round - a.round);
  
  if (allData.length > 100) {
    const removed = allData.slice(100);
    allData = allData.slice(0, 100);
    
    removed.forEach(item => {
      const oldFile = path.join(dataDir, `${item.round}.json`);
      if (fs.existsSync(oldFile)) {
        fs.unlinkSync(oldFile);
        console.log(`🗑️  삭제: ${item.round}.json (100회차 이전)`);
      }
    });
  }
  
  fs.writeFileSync(allFile, JSON.stringify(allData, null, 2));
  
  console.log(`📝 저장 완료: data/miniloto/${data.round}.json, latest.json`);
  console.log(`📊 전체 회차: ${allData.length}개 (최대 100개 유지)`);
}

async function main() {
  console.log('🎰 Miniloto Crawler');
  const data = await crawlLatestMiniloto();
  if (data && data.skipped) {
    console.log('⏭️  변경사항 없음 - 종료');
    return;
  }
  await saveToFile(data);
  console.log('✅ 완료!');
}

if (require.main === module) {
  main().catch(console.error);
}
