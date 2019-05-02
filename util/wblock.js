const {to} = require ('./wutil');					// async
const {getNumber} = require ('./wutil');	// change to number
const wlog = require('./wlog');						// log

const steem = require('steem');
const fs = require('fs').promises;				// Experimental promise, support over v10.

const FILE_CHARSET_UTF8 = 'utf-8';
const STEEM_TRANS_ROOT = process.env.STEEM_TRANS_ROOT?process.env.STEEM_TRANS_ROOT:'.';
const LAST_LAUNCHED_FILE = `${STEEM_TRANS_ROOT}/last_launched.txt`;
const LAST_BLOCK_NUMBER = 0;
const LAST_BLOCK_FILE = `${STEEM_TRANS_ROOT}/last_block.txt`;

let fn = {}

// file ----------------------------------------------- 

/*
* record last activated time
*/
fn.saveTime = () =>{
	return fs.writeFile( LAST_LAUNCHED_FILE,new Date().toISOString(), FILE_CHARSET_UTF8);
}

/*
* read last activated time
*/
fn.readTime = () =>{
	return fs.readFile(LAST_LAUNCHED_FILE,FILE_CHARSET_UTF8);
}

/*
* record last processing block number
*/
fn.saveBlockNumber = (blockNumber) =>{
	return fs.writeFile( LAST_BLOCK_FILE, blockNumber.toString(), FILE_CHARSET_UTF8);
}

/*
* read last processing block number
*/
fn.readBlockNumber = () =>{
	return fs.readFile(LAST_BLOCK_FILE, FILE_CHARSET_UTF8)
}

// block ----------------------------------------------- 

/*
* return last block number
* @return last block number
*/
fn.getLastBlockNumer = async () => {
	let err, data;
	[err,data] = await to(steem.api.getDynamicGlobalPropertiesAsync());

	if(!err){
		// check : head_block_number, last_irreversible_block_num / There is a gap of about twenty blocks between the two. ( almost 2 min. )
		return Promise.resolve(data.head_block_number);
	}else{
		return Promise.reject(err);
	}
}

/*
* Gets the block number base block list information
* @param sblocknum start block number
* @param eblocknum end block number(optional, if not exist, use start block number)
* @return block list information
*/
fn.getBlocks = async (sblocknum, eblocknum) => {

	let err, data;

	if(getNumber(sblocknum)!==null && getNumber(eblocknum)!==null){

		let start = Math.min(sblocknum, eblocknum);
		let end = Math.max(sblocknum, eblocknum);

		// validation check
		if(start<=0){
			return Promise.reject(`start number(${start}) is must over then zero(0).`);
		}

		// push block infomation list
		let slist = [];
		for(let i=start;i<=end;i++){
			slist.push(steem.api.getBlockAsync(i));
		}

		// search items
		[err,data] = await to(Promise.all(slist));

	}else if(getNumber(sblocknum)!==null){
		// search single item
		[err,data] = await to(steem.api.getBlockAsync(sblocknum));
	}else{
		// not matched
		return Promise.reject(`check : paramters [ ${sblocknum}, ${eblocknum} ] is null`);
	}

	// return values
	if(!err){
		if(!data){
			return Promise.reject(`data is empty but success -_-;`);
		}
		// single item to array
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
* Extract trading information from block list information, if error occured value is null
* @param blockArr block array 
* @return transactions transactions
*/
fn.getTransactions = ( blockArr ) =>{

	let transactions = [];

	try{
		for(let block of blockArr){
				transactions = transactions.concat(block.transactions);
			}
			transactions.sort((a,b)=>{
				// sort by transaction number desc
				return Number(""+a.block_num+a.transaction_num.toString().padStart(3, "0")) - Number(""+b.block_num+b.transaction_num.toString().padStart(3, "0"));
			});
	}catch(e){
		wlog.error(e, 'getTransactions');
		return null;
	}

	return transactions;
}

// operations ----------------------------------------------- 

/*
* Extract commands from the list of transactions, if error occured value is null
* @param transactions transactions
* @return operations operations
*/
fn.getOperations = ( transactions ) =>{
	let operations = [];

	try{
		for(let tran of transactions){
			operations = operations.concat(tran.operations);
		}
	}catch(e){
		wlog.error(e, 'getOperations');
		return null;	
	}

	return operations;
}

// filter ----------------------------------------------- 

/*
* get unique array values
* @return unique arries
*/
fn.filterUnique = (value, index, self) => self.indexOf(value) === index;	// get unique array values

fn.filterReplies = operations=>{
	let op = operations[0];
	let data = operations[1];
	return operations[0]=='comment' && data && data.parent_author && data.parent_author!='';
}

fn.filterContents = operations=>{
	let op = operations[0];
	let data = operations[1];
	return operations[0]=='comment' && data && data.parent_author=='' && data.title!='';
}

/*
* get comment information.
* @return replies
*/
fn.filterVotes = operations=>{
	let op = operations[0];
	let data = operations[1];
	return operations[0]=='vote';
}


fn.filterTransfer = operations=>operations[0]=='transfer';
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

// fn.filterAccountCreateWithDelegation 	= operations=>operations[0]=='account_create_with_delegation';	// 계정생성
// fn.filterAccountUpdate 								= operations=>operations[0]=='account_update';									// 계정정보 변경
// fn.filterAccountWitnessVote 					= operations=>operations[0]=='account_witness_vote';						// 증인투표
// fn.filterClaimRewardBalance 					= operations=>operations[0]=='claim_reward_balance';						// 보상청구
// fn.filterComment 											= operations=>operations[0]=='comment';													// 글 쓰기
// fn.filterCommentOptions 							= operations=>operations[0]=='comment_options';									// 베니피셔리 설정
// fn.filterCustomJson 									= operations=>operations[0]=='custom_json';											// 팔로우/팔로잉
// fn.filterdelegateVestingShares 				= operations=>operations[0]=='delegate_vesting_shares';					// 스파임대
// fn.filterDeleteComment 								= operations=>operations[0]=='delete_comment';									// 글 삭제 
// fn.filterTransfer 										= operations=>operations[0]=='transfer';												// 송금
// fn.filtertransferToSavings 						= operations=>operations[0]=='transfer_to_savings';							// 저축하기
// fn.filterTransferToVesting 						= operations=>operations[0]=='transfer_to_vesting';							// 스파업
// fn.filterVote 												= operations=>operations[0]=='vote';														// 보팅
// fn.filterWithdrawVesting 							= operations=>operations[0]=='withdraw_vesting';								// 파워다운
// if(command=='comment' && data && data.parent_author && data.parent_author!='' && data.parent_author!=STEEM_TRANS_AUTHOR){

// -----------------------------------------------

module.exports = fn;