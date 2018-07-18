const fs = require('fs');
const dateformat = require('dateformat');

let fn = {};

const LOG_DATE_FORMAT = 'yyyymmdd';
const FILE_CHARSET_UTF8 = 'utf-8';
const STEEM_TRANS_ROOT = process.env.STEEM_TRANS_ROOT?process.env.STEEM_TRANS_ROOT:'.';
const STEEM_TRANS_FOLDER_ERR = process.env.STEEM_TRANS_FOLDER_ERR?STEEM_TRANS_ROOT+process.env.STEEM_TRANS_FOLDER_ERR:STEEM_TRANS_ROOT+'/error';
const STEEM_TRANS_FOLDER_INFO = process.env.STEEM_TRANS_FOLDER_INFO?STEEM_TRANS_ROOT+process.env.STEEM_TRANS_FOLDER_INFO:STEEM_TRANS_ROOT+'/info';

/*
* print log message
* @param msg message
* @param isShow visibility
*/ 
fn.log = (msg, isShow=true) => {
  if(isShow){
    console.log(new Date().toISOString(), msg);  
  }
}

/*
* make folder with recursive
* @param path path of folder
*/ 
fn.makeFolder = (path) =>{
  const sep = require('path').sep;
  const folders = path.split(sep);

  // check path is exist
  if(!fs.existsSync(path)){
    let paths = [];
    try{

      // make folder with recursivly
      for(let f of folders){
        paths.push(f);
        let p = paths.join(sep);
        if(p!='' && !fs.existsSync(p)){
          fs.mkdirSync(p);
        }
      }
    }catch(e){
      console.error(new Date().toISOString(), 'make folder is fail : ', e);  
    }
  }
}

/*
* write info message (ASYNC, APPEND, JSON)
* TODO : write on mongodb with batch process
* @param json write message (json)
* @param type type for division
*/ 
fn.info = (json, type='')=>{

  const now = new Date();
  const fileName = `info_${dateformat(now, LOG_DATE_FORMAT)}.log`;
  const filePath = `${STEEM_TRANS_FOLDER_INFO}/${fileName}`;
  let data = {};

  data.time = now.toISOString();
  data.type = type;
  data.json = json;

  if(!json){
    console.error(new Date().toISOString(), '[wlog info] error : input json empty');
    return false;
  }

  // check folder exist & make log folder
  fn.makeFolder(STEEM_TRANS_FOLDER_INFO);

  try{
    // append log with json
    fs.appendFile( filePath, JSON.stringify(data) + '\n', FILE_CHARSET_UTF8, (err)=>{
      if(err){
        // file write error 
        console.error(new Date().toISOString(), '[wlog info] write error : ', err);
      }else{

        // print info script
        console.log(new Date().toISOString(), JSON.stringify(data) );
      }
    } );
  }catch(e){
    console.error(new Date().toISOString(), '[wlog info] unknown error : ', e);
  } 
}

/*
* write error message (ASYNC, APPEND, JSON)
* TODO : write on mongodb with batch process
* @param json write message (json)
* @param type type for division
*/ 
fn.error = (json, type='')=>{

  const now = new Date();
  const fileName = `error_${dateformat(now, LOG_DATE_FORMAT)}.log`;
  const filePath = `${STEEM_TRANS_FOLDER_ERR}/${fileName}`;
  let data = {};

  data.time = now.toISOString();
  data.type = type;
  data.json = json;
  data.jsonString = json.toString();
  // if(json.stack){
  //   data.jsonStack = json.stack;  // error
  // }

  if(!json){
    console.error(new Date().toISOString(), '[wlog error] error : input json empty');
    return false;
  }

  // append log with json
  fn.makeFolder(STEEM_TRANS_FOLDER_ERR);

  try{
    // append log with json
    fs.appendFile( filePath, JSON.stringify(data) + '\n', FILE_CHARSET_UTF8, (err)=>{
      if(err){

        // file write error 
        console.error(new Date().toISOString(), '[wlog error] write error : ', err);
      }else{

        // print error script
        console.error(new Date().toISOString(), JSON.stringify(data) );
      }
    } );
  }catch(e){
    console.error(new Date().toISOString(), '[wlog error] unknown error : ', e);
  } 
}

module.exports = fn;