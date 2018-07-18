// project utils
const {monitor} = require ('./util/wmonitor');		// monitoring
const {toBoolean} = require ('./util/wutil');			// is true ?
const wlog = require('./util/wlog');							// logs

const wjankenpo = require ('./cmd/wjankenpo');		// wjankenpo
const wdice 		= require ('./cmd/wdice');				// wdice
const wtransdel = require ('./cmd/wtransdel');		// wtransdel
const wtransme 	= require ('./cmd/wtransme');			// wtransdel
const wtransup 	= require ('./cmd/wtransup');			// wtransdel

const STEEM_TRANS_AUTHOR = process.env.STEEM_TRANS_AUTHOR;
const STEEM_TRANS_IS_TEST = toBoolean(process.env.STEEM_TRANS_IS_TEST);

/*
* entry point
*/
function init(){

	// start monitoring
	monitor()

	// get comments information to perform next actions.
	.then(async replies=>{

		// Filter with command + Not equal parent writer and reply author.
		try{

			const mon_fn = [
				wtransup, wtransme, wtransdel, wdice, wjankenpo
			];

			for(let mon of mon_fn){
				let replies_filtered = replies.filter(data=>data[1].body.indexOf(mon.name)>=0 && data[1].author!=STEEM_TRANS_AUTHOR);
				for(let item of replies_filtered){
					// Perform Analysis
					await mon.command(item[1]);	// No need to error handling
				}
			}

		}catch(e){
			wlog.error(e, 'monitor_e');
		}
		
		// Perform monitoring again when an error occurs.
		init();

	})
	.catch(err=>{

		// Perform monitoring again
		wlog.error(err, 'monitor_err');
		init();
	});
}
init();
wlog.info(`start program as ${STEEM_TRANS_IS_TEST?'test mode':'production mode'}`);