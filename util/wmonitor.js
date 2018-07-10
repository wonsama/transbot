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

fn.monitor = async () =>{
	
	let err;
	let blockStart,blockEnd;
	let replies = [];

	
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

						// apply filter(extract replies)
						replies = operations.filter(wblock.filterReplies);
						lastnumber = blockEnd;

						// print read block number range
						wlog.log(`[ ${blockStart} ~ ${blockEnd} ( block : ${blockEnd - blockStart +1}, replies : ${replies.length} ) ]`);	
						wlog.log(`--------------------------------------------------`);
					}
				}
			}
		} else{
			// search block - fail : get last block number 
			wlog.error(err, 'getLastBlockNumer');	
			return Promise.reject(err);
		}
	}catch(e){
		// search block - occured unknown exception.
		wlog.error(e, 'getBlocks');
		return Promise.reject(e);
	}

	// write time & restart
	await to(wblock.saveTime());
	wlog.log('[ end ]\n');

	// sleep process
	await sleep(TIME_TO_SLEEP);

	return Promise.resolve(replies);
}

module.exports = fn;