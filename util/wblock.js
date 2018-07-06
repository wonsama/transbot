const {to} = require ('./wutil');					// async 처리
const {getNumber} = require ('./wutil');	// 숫자 변환

const steem = require('steem');
const fs = require('fs').promises;	// 참고로 promises 는 v10 부터 나왔고, 실험용 이라는 디버깅로그가 찍힘에 유의

const FILE_CHARSET_UTF8 = 'utf-8';
const ROOT_FOLDER = '/Users/wonsama/Documents/GitHub/transbot';
const LAST_LAUNCHED_FILE = `${ROOT_FOLDER}/last_launched.txt`;
const LAST_BLOCK_NUMBER = 0;
const LAST_BLOCK_FILE = `${ROOT_FOLDER}/last_block.txt`;

let fn = {}

// file ----------------------------------------------- 

/*
* 마지막으로 기동된 시간의 정보를 기록한다
*/
fn.saveTime = () =>{
	return fs.writeFile( LAST_LAUNCHED_FILE,new Date().toISOString(), FILE_CHARSET_UTF8);
}

/*
* 마지막으로 기동된 시간의 정보를 읽어들인다
*/
fn.readTime = () =>{
	return fs.readFile(LAST_LAUNCHED_FILE,FILE_CHARSET_UTF8);
}

/*
* 마지막으로 처리한 블록 번호를 기록한다
*/
fn.saveBlockNumber = (blockNumber) =>{
	return fs.writeFile( LAST_BLOCK_FILE, blockNumber.toString(), FILE_CHARSET_UTF8);
}

/*
* 마지막으로 처리한 블록 번호를 읽어들인다
*/
fn.readBlockNumber = () =>{
	return fs.readFile(LAST_BLOCK_FILE, FILE_CHARSET_UTF8)
}

// TODO : 파일에서 마지막으로 로드(처리)한 블록 번호를 기록한다

// block ----------------------------------------------- 

/*
* 최근 블록 번호를 반환한다
* @return 최근블록번호
*/
fn.getLastBlockNumer = async () => {
	let err, data;
	[err,data] = await to(steem.api.getDynamicGlobalPropertiesAsync());

	if(!err){
		// head_block_number : 최근 블록 넘버
		// last_irreversible_block_num : 뒤집을 수 없는 블록 넘버 , 대략 gap 20 blocks 안팍, 대략 시간으로는 1~2분 차이를 보여줌
		// return Promise.resolve(data.last_irreversible_block_num);
		return Promise.resolve(data.head_block_number);
	}else{
		return Promise.reject(err);
	}
}

/*
* 블록 번호 기준 블록 목록 정보를 가져온다
* @param sblocknum 시작 블록 번호
* @param eblocknum 종료 블록 번호 (옵션, 없으면 시작 블록 번호 기준 단건 조회)
* @return 블록 목록 정보
*/
fn.getBlocks = async (sblocknum, eblocknum) => {

	let err, data;

	if(getNumber(sblocknum)!==null && getNumber(eblocknum)!==null){

		let start = Math.min(sblocknum, eblocknum);
		let end = Math.max(sblocknum, eblocknum);

		// 유효성 검증
		if(start<=0){
			return Promise.reject(`start number(${start}) is must over then zero(0).`);
		}

		// 시작 & 종료 존재 - 다건 조회
		let slist = [];
		for(let i=start;i<=end;i++){
			slist.push(steem.api.getBlockAsync(i));
		}

		// 다건 조회
		[err,data] = await to(Promise.all(slist));

	}else if(getNumber(sblocknum)!==null){
		// 시작 존재 - 단건 조회
		[err,data] = await to(steem.api.getBlockAsync(sblocknum));
	}else{
		// 값 없음
		return Promise.reject(`check : paramters [ ${sblocknum}, ${eblocknum} ] is null`);
	}

	// 결과 값 반환 
	if(!err){
		// 말도 안되는 경우 확인
		if(!data){
			return Promise.reject(`data is empty but success -_-;`);
		}
		// 배열이 아닌 경우 배열로 변경하여 반환
		if(!Array.isArray(data)){
			data = [data];
		}
		return Promise.resolve(data);
	}else{
		return Promise.reject(err);
	}
}

// transactions ----------------------------------------------- 

/*
* 블록 목록 정보에서 거래 정보를 추출한다, 오류 발생 시 null
* @param blockArr 블록 배열
* @return transactions(거래 배열)
*/
fn.getTransactions = ( blockArr ) =>{

	let transactions = [];

	try{
		for(let block of blockArr){
				transactions = transactions.concat(block.transactions);
			}
			transactions.sort((a,b)=>{
				// 오래 된 것을 배열 앞에 배치(0)
				return Number(""+a.block_num+a.transaction_num.toString().padStart(3, "0")) - Number(""+b.block_num+b.transaction_num.toString().padStart(3, "0"));
			});
	}catch(e){
		console.error('getTransactions', e);
		return null;
	}

	return transactions;
}

// operations ----------------------------------------------- 

/*
* 입력받은 거래 목록(transactions)에서 명령 목록(operations)을 추출한다, 오류 발생 시 null
* @param transactions 거래 목록
* @return operations 명령 목록
*/
fn.getOperations = ( transactions ) =>{
	let operations = [];

	try{
		for(let tran of transactions){
			operations = operations.concat(tran.operations);
		}
	}catch(e){
		console.error('getOperations', e);
		return null;	
	}

	return operations;
}

// filter ----------------------------------------------- 

/*	
	증인용 

	feed_publish : 거래소 교환비 설정
	witness_update : 증인 정보 설정

	내부거래소
	limit_order_cancel : 내부거래소 거래등록 취소
	limit_order_create : 내부거래소 거래등록

	기타 

	convert : 3.5일 평균시세에 맞춰 SBD <-> STEEM 교환
	pow : 1000 블록 넘어가면 그때 즈음해서 채굴함 ...
	
	본 적 없음

	request_account_recovery : 계정복원 요청
	recover_account : 계정 복원 
	custom : -

	see : https://steemit.com/steem/@furion/developers-guide-to-steem-s-blockchain
*/

fn.filterUnique = (value, index, self) => self.indexOf(value) === index;	// get unique array values

// fn.filterAccountCreateWithDelegation 	= operations=>operations[0]=='account_create_with_delegation';	// 계정생성
// fn.filterAccountUpdate 								= operations=>operations[0]=='account_update';									// 계정정보 변경
// fn.filterAccountWitnessVote 					= operations=>operations[0]=='account_witness_vote';						// 증인투표
// fn.filterClaimRewardBalance 					= operations=>operations[0]=='claim_reward_balance';						// 보상청구
fn.filterComment 											= operations=>operations[0]=='comment';													// 글 쓰기
// fn.filterCommentOptions 							= operations=>operations[0]=='comment_options';									// 베니피셔리 설정
fn.filterCustomJson 									= operations=>operations[0]=='custom_json';											// 팔로우/팔로잉
// fn.filterdelegateVestingShares 				= operations=>operations[0]=='delegate_vesting_shares';					// 스파임대
// fn.filterDeleteComment 								= operations=>operations[0]=='delete_comment';									// 글 삭제 
fn.filterTransfer 										= operations=>operations[0]=='transfer';												// 송금
// fn.filtertransferToSavings 						= operations=>operations[0]=='transfer_to_savings';							// 저축하기
// fn.filterTransferToVesting 						= operations=>operations[0]=='transfer_to_vesting';							// 스파업
fn.filterVote 												= operations=>operations[0]=='vote';														// 보팅
// fn.filterWithdrawVesting 							= operations=>operations[0]=='withdraw_vesting';								// 파워다운

// if(command=='comment' && data && data.parent_author && data.parent_author!='' && data.parent_author!=STEEM_TRANS_AUTHOR){

/*
* 댓글 정보만 가져온다
* @return 댓글 유무
*/
fn.filterReplies = operations=>{
	let op = operations[0];
	let data = operations[1];
	return operations[0]=='comment' && data && data.parent_author && data.parent_author!='';
}

// -----------------------------------------------

module.exports = fn;