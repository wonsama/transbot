const steem = require('steem');

const {sleep} = require ('./wutil');						// async 처리
const {to} = require ('./wutil');						// async 처리
const wblock = require ('./wblock');				// 블록처리 관련 메소드 모음
const wlog = require('./wlog');							// 로그

const SEC = 1000;
const TIME_TO_SLEEP = 2*SEC;
const BLOCK_PER_READ = 1000;								// 100(5 sec), 1000(12 sec)

const SHOW_DEBUG = true;

let lastnumber = 0;													// 파일에 작업이 끝난 번호 정보
let fn = {};

fn.monitor = async () =>{
	
	let err;
	let blockStart,blockEnd;
	let replies = [];

	// 네트워크 연결 끈김 등이 발생하면 약 90초 이후 timeout이 발생함. 기다리자... ㅜㅜ
	try{

		// 최근 읽어들인 번호 확인
		let blockRead;
		[err,blockRead] = await to(wblock.readBlockNumber());
		if(!err){
			lastnumber = Number(blockRead);
		}

		[err,blockEnd] = await to(wblock.getLastBlockNumer());	// 최근 블럭번호 조회 
		if(!err){

			// 최근 읽어들였던 번호인지 여부 확인
			if(blockEnd>lastnumber){

				// 최근번호 초기화
				if(lastnumber==0){
					blockStart = blockEnd - BLOCK_PER_READ;
					// blockEnd = blockEnd;
				}else{
					blockStart = lastnumber+1;
					blockEnd = Math.min(lastnumber+BLOCK_PER_READ, blockEnd);
				}

				// 블록 목록 조회 
				[err,blockArr] = await to(wblock.getBlocks(blockStart, blockEnd));	
				if(!err){

					// 거래 목록에서 명령 목록 추출
					let transactions = wblock.getTransactions(blockArr);
					let operations = wblock.getOperations(transactions);

					// 최근 읽어들인 번호 기록
					let blockWrite;
					[err,blockWrite] = await to(wblock.saveBlockNumber(blockEnd));
					if(!err){

						// 댓글 목록만 추출
						// 굳이 정렬(sort)할 필요는 없을 듯 블록내부에 특정 커맨드가 들어갈 확률 희박
						// 또한 들어가도 그냥 순서대로 처리하면 됨
						replies = operations.filter(wblock.filterReplies);
						lastnumber = blockEnd;

						// 읽어들인 블록 목록 출력
						wlog.log(`[ ${blockStart} ~ ${blockEnd} ( block : ${blockEnd - blockStart +1}, replies : ${replies.length} ) ]`);	
						wlog.log(`--------------------------------------------------`);
					}
				}
			}
		} else{
			// 블록 목록 조회 - 실패, 파일저장 오류는 현저히 낮음
			wlog.error(err, 'getLastBlockNumer');	
			return Promise.reject(err);
		}
	}catch(e){
		// 최근 블럭번호 조회 - 실패
		wlog.error(e, 'getBlocks');
		return Promise.reject(e);
	}

	// TODO : 멈추는 경우를 대비하여 마지막 기동 시간이 1분이상 차이가 나는 경우에는 프로그램을 kill 한 이후 재기동 처리 고려

	// 다시 첨부터 시작 !	
	await to(wblock.saveTime());	// 오류나도 딱히 처리할 필요 없음 마지막 기동시간 저장용
	wlog.log('[ end ]\n');

	// 쉬어가기
	await sleep(TIME_TO_SLEEP);

	return Promise.resolve(replies);
}

module.exports = fn;