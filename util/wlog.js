const fs = require('fs');  // 참고로 promises 는 v10 부터 나왔고, 실험용 이라는 디버깅로그가 찍힘에 유의
const dateformat = require('dateformat');

let fn = {};

const LOG_DATE_FORMAT = 'yyyymmdd';
const FILE_CHARSET_UTF8 = 'utf-8';
const STEEM_TRANS_ROOT = process.env.STEEM_TRANS_ROOT?process.env.STEEM_TRANS_ROOT:'.';
const STEEM_TRANS_FOLDER_ERR = process.env.STEEM_TRANS_FOLDER_ERR?STEEM_TRANS_ROOT+process.env.STEEM_TRANS_FOLDER_ERR:STEEM_TRANS_ROOT+'/error';
const STEEM_TRANS_FOLDER_INFO = process.env.STEEM_TRANS_FOLDER_INFO?STEEM_TRANS_ROOT+process.env.STEEM_TRANS_FOLDER_INFO:STEEM_TRANS_ROOT+'/info';

/*
* 로그성 메시지를 출력한다
*/ 
fn.log = (msg, isShow=true) => {
  if(isShow){
    console.log(new Date().toISOString(), msg);  
  }
}

/*
* 입력경로 기준으로 폴더를 생성한다 ( recursive 하게 생성 )
* @param path 경로 
*/ 
fn.makeFolder = (path) =>{
  const sep = require('path').sep;
  const folders = path.split(sep);

  // 전체 경로가 존재하는지 여부 확인 
  if(!fs.existsSync(path)){
    let paths = [];
    try{

      // 상위 폴더 부터 해서 차근차근 만들어 간다, SYNC
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
* 알림 메시지를 파일에 기록한다(ASYNC, APPEND, JSON)
* TODO : 나중에는 mongodb에 기록
* @param json 기록할 메시지 (JSON)
* @param type 구분 분류를 위한 타입 (STRING)
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

  // 로그를 저장할 폴더 확인 또는 생성
  fn.makeFolder(STEEM_TRANS_FOLDER_INFO);

  try{
    // 로그를 JSON 형태로 append 하여 기록
    console.log('STEEM_TRANS_ROOT', STEEM_TRANS_ROOT);
    console.log('STEEM_TRANS_FOLDER_INFO', STEEM_TRANS_FOLDER_INFO);

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
* 애러 메시지를 파일에 기록한다(ASYNC, APPEND, JSON)
* TODO : 나중에는 mongodb에 기록
* @param json 기록할 메시지 (JSON)
* @param type 구분 분류를 위한 타입 (STRING)
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
  if(json.stack){
    data.jsonStack = json.stack;  // error
  }

  if(!json){
    console.error(new Date().toISOString(), '[wlog error] error : input json empty');
    return false;
  }

  // 로그를 저장할 폴더 확인 또는 생성
  fn.makeFolder(STEEM_TRANS_FOLDER_ERR);

  try{
    // 로그를 JSON 형태로 append 하여 기록
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