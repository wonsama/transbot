////////////////////////////////////////////////////////////
//
// information (소개)
//

/*
   소개정보
*/

////////////////////////////////////////////////////////////
//
// require (라이브러리 로딩)
//

// const a = require('a');				// 전체를 가져오고 싶은 경우
// const {fn_a, fn_b} = require('b');	// 특정 함수만 가져오고 싶은 경우

const steem = require('steem');											// steem api
const wfile = require('../util/wfile');									// file util

const PATH_VOTING_TIME = './voting_time.json';
const PATH_VOTING_LIST = './voting_list.json';

const TIME_HOUR = 1000 * 60 * 60;
const TIME_HOUR_20 = TIME_HOUR * 20;

// 보팅 대상 아이디
const WHITE_LIST = [
	"lucky2", "knight4sky", "anpigon", "happyberrysboy", "jayplayco", 
	"fenrir78", "tradingideas", "jinuking", "newbijohn", "y-o-u-t-h-m-e", "goodhello",
	"hyokhyok", "ioioioioi", "ryanhkr", "jacobyu", "wonsama", "ukk"
];

////////////////////////////////////////////////////////////
//
// const (상수정의)
//

// const WHAT_YOU_DEFINE = 'c1';	// 상수 정의 1

////////////////////////////////////////////////////////////
//
// let (변수정의)
//


////////////////////////////////////////////////////////////
//
// private function (비공개 함수) 함수명을 _(언더스코어) 로 시작 
//

// 초기화 함수
const _init = () => {
	// 파일이 없는 경우는 만들어 주도록 한다
	if(wfile.isNotExist(PATH_VOTING_LIST)){
		wfile.write(PATH_VOTING_LIST, JSON.stringify([]));
	}
	// 파일이 없는 경우는 만들어 주도록 한다
	if(wfile.isNotExist(PATH_VOTING_TIME)){
		wfile.write(PATH_VOTING_TIME, JSON.stringify({}));
	}
}
_init();

// 해당 계정이 보팅 목록에 추가 되었는지 여부 
const _is_listup = (author) => {
	let json = wfile.read(PATH_VOTING_LIST);
	for(let j of json){
		if(j.author == author){
			return true;
		}
	}
	return false;
}

// 보팅 했는지 여부
const _is_voted = (author) => {
	let json = wfile.read(PATH_VOTING_TIME);

	let va = json[author];

	if(va){
		if(va.time + TIME_HOUR_20 < new Date().getTime() ){
			return false;
		}else{
			return true;
		}
	}
	return false;
}	

////////////////////////////////////////////////////////////
//
// public function (공개 함수)
//



command = async (item) =>{
	
	let json_metadata = JSON.parse(item.json_metadata);
	let tags = json_metadata.tags?json_metadata.tags:undefined;

	let permlink = item.permlink;
	let author = item.author;

	// 태그 포함 여부 확인
	if( tags && tags.includes('sct') && WHITE_LIST.includes(author) && !_is_voted(author) && !_is_listup(author) ){

		let data = {
			permlink : permlink, 
			author : author,
			time : new Date().getTime() // TODO : 컨텐츠 정보 가져와서 시간으로 변형, headblock 아니여서 음 ...
		};

		let list = JSON.parse(wfile.read(PATH_VOTING_LIST));
		list.push(data);

		wfile.write(PATH_VOTING_LIST, JSON.stringify(list) );
	}
}

////////////////////////////////////////////////////////////
//
// exports (외부 노출 함수 지정)
//

module.exports = {
	command
}; // public function 에서 지정하여 외부 노출을 시켜준다 (개발진척에 따라서 노출여부 결정)



/*

{ parent_author: '',
  parent_permlink: 'blockchain',
  author: 'mexite',
  permlink:
   'ferrum-network-breaking-beyond-the-limitations-of-blockchain-technology',
  title:
   'FERRUM NETWORK - BREAKING BEYOND THE LIMITATIONS OF BLOCKCHAIN TECHNOLOGY',
  body: '@@ -3293,12 +3293,8 @@\n %0A%0A**\n-I\'m \n Conc\n',
  json_metadata:
   '{"tags":["blockchain","cryptocurrency","ico","dag","ferrum"],"image":["https://cdn.steemitimages.com/DQmaQCbmhUiJfCphBvPEvGNwdu7uB7Bx7xV9k3fmF2ziVfG/IMG_20190514_153653.jpg","https://cdn.steemitimages.com/DQmXVZLP889vY3RhLJd976ZvfCfhxcc7he4HXzCdQh1thDF/IMG_20190520_181246.jpg"],"app":"steemit/0.1","format":"markdown"}' }

*/