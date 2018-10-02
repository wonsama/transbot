const steem = require('steem');

const {sleep} = require ('./wutil');				// sleep
const {to} = require ('./wutil');						// async
const wblock = require ('./wblock');				// block handling
const wlog = require('./wlog');							// logs

const SEC = 1000;
const TIME_TO_SLEEP = 2*SEC;
const BLOCK_PER_READ = 1000;								// 100(5 sec), 1000(12 sec)

const SHOW_DEBUG = true;

let lastnumber = 0;													// last block number
let fn = {};

fn.monitor = async (type=['reply']) =>{
	
	let err;
	let blockStart,blockEnd;
	let filtered = {};

	
	// if network error occured, restart after 90 sec. wait...
	try{

		// read last work block number
		let blockRead;
		[err,blockRead] = await to(wblock.readBlockNumber());
		if(!err){
			lastnumber = Number(blockRead);
		}

		[err,blockEnd] = await to(wblock.getLastBlockNumer());	// search lastest block number
		if(!err){

			// check last block number
			if(blockEnd>lastnumber){

				// init search block number range
				if(lastnumber==0){
					blockStart = blockEnd - BLOCK_PER_READ;
				}else{
					blockStart = lastnumber+1;
					blockEnd = Math.min(lastnumber+BLOCK_PER_READ, blockEnd);
				}

				// search block information 
				[err,blockArr] = await to(wblock.getBlocks(blockStart, blockEnd));	
				if(!err){

					// extract operations from block 
					let transactions = wblock.getTransactions(blockArr);
					let operations = wblock.getOperations(transactions);

					// write lastest block number
					let blockWrite;
					[err,blockWrite] = await to(wblock.saveBlockNumber(blockEnd));
					if(!err){

						// apply filter(extract reply)
						if(type.includes('reply')){
							let f_reply = operations.filter(wblock.filterReplies);
							filtered.reply = f_reply;
							wlog.log(`[ ${blockStart} ~ ${blockEnd} ( block : ${blockEnd - blockStart +1}, reply : ${f_reply.length} ) ]`);	
						}

						if(type.includes('content')){
							let f_content = operations.filter(wblock.filterContents);
							filtered.content = f_content;
							wlog.log(`[ ${blockStart} ~ ${blockEnd} ( block : ${blockEnd - blockStart +1}, content : ${f_content.length} ) ]`);	
						}

						if(type.includes('vote')){
							let f_vote = operations.filter(wblock.filterVotes);
							filtered.vote = f_vote;
							wlog.log(`[ ${blockStart} ~ ${blockEnd} ( block : ${blockEnd - blockStart +1}, vote : ${f_vote.length} ) ]`);	
						}

						lastnumber = blockEnd;

						// print read block number range
						
						wlog.log(`--------------------------------------------------`);
					}
				}
			}else{
				// 마지막으로 읽어들인 블록 정보가 최신 블록 정보와 동일하거나 작은 경우, 일반적으로 동일한 경우임
				blockStart = lastnumber;
				wlog.info(`${lastnumber} block is already read block. (blockEnd : ${blockEnd}, lastnumber : ${lastnumber})`);
			}

			// 처리 결과에 읽어들인 블록 정보를 추가
			filtered.eblock=blockEnd;
			filtered.sblock=blockStart;

		} else{
			// search block - fail : get last block number 
			wlog.error(err, `getLastBlockNumer :: ${blockStart} ~ ${blockEnd}`);	
			return Promise.reject(err);
		}
	}catch(e){
		// search block - occured unknown exception.
		wlog.error(e, `getBlocks :: ${blockStart} ~ ${blockEnd}`);
		return Promise.reject(e);
	}

	// write time & restart
	await to(wblock.saveTime());
	wlog.log('[ end ]\n');

	// sleep process
	await sleep(TIME_TO_SLEEP);

	return Promise.resolve(filtered);
}

module.exports = fn;