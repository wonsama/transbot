const fn = {};

fn._getLang = (key) => {
	let langs = {
	    'auto': 'Automatic',
	    'af': 'Afrikaans',
	    'sq': 'Albanian',
	    'am': 'Amharic',
	    'ar': 'Arabic',
	    'hy': 'Armenian',
	    'az': 'Azerbaijani',
	    'eu': 'Basque',
	    'be': 'Belarusian',
	    'bn': 'Bengali',
	    'bs': 'Bosnian',
	    'bg': 'Bulgarian',
	    'ca': 'Catalan',
	    'ceb': 'Cebuano',
	    'ny': 'Chichewa',
	    'zh-cn': 'Chinese Simplified',
	    'zh-tw': 'Chinese Traditional',
	    'co': 'Corsican',
	    'hr': 'Croatian',
	    'cs': 'Czech',
	    'da': 'Danish',
	    'nl': 'Dutch',
	    'en': 'English',
	    'eo': 'Esperanto',
	    'et': 'Estonian',
	    'tl': 'Filipino',
	    'fi': 'Finnish',
	    'fr': 'French',
	    'fy': 'Frisian',
	    'gl': 'Galician',
	    'ka': 'Georgian',
	    'de': 'German',
	    'el': 'Greek',
	    'gu': 'Gujarati',
	    'ht': 'Haitian Creole',
	    'ha': 'Hausa',
	    'haw': 'Hawaiian',
	    'iw': 'Hebrew',
	    'hi': 'Hindi',
	    'hmn': 'Hmong',
	    'hu': 'Hungarian',
	    'is': 'Icelandic',
	    'ig': 'Igbo',
	    'id': 'Indonesian',
	    'ga': 'Irish',
	    'it': 'Italian',
	    'ja': 'Japanese',
	    'jw': 'Javanese',
	    'kn': 'Kannada',
	    'kk': 'Kazakh',
	    'km': 'Khmer',
	    'ko': 'Korean',
	    'ku': 'Kurdish (Kurmanji)',
	    'ky': 'Kyrgyz',
	    'lo': 'Lao',
	    'la': 'Latin',
	    'lv': 'Latvian',
	    'lt': 'Lithuanian',
	    'lb': 'Luxembourgish',
	    'mk': 'Macedonian',
	    'mg': 'Malagasy',
	    'ms': 'Malay',
	    'ml': 'Malayalam',
	    'mt': 'Maltese',
	    'mi': 'Maori',
	    'mr': 'Marathi',
	    'mn': 'Mongolian',
	    'my': 'Myanmar (Burmese)',
	    'ne': 'Nepali',
	    'no': 'Norwegian',
	    'ps': 'Pashto',
	    'fa': 'Persian',
	    'pl': 'Polish',
	    'pt': 'Portuguese',
	    'ma': 'Punjabi',
	    'ro': 'Romanian',
	    'ru': 'Russian',
	    'sm': 'Samoan',
	    'gd': 'Scots Gaelic',
	    'sr': 'Serbian',
	    'st': 'Sesotho',
	    'sn': 'Shona',
	    'sd': 'Sindhi',
	    'si': 'Sinhala',
	    'sk': 'Slovak',
	    'sl': 'Slovenian',
	    'so': 'Somali',
	    'es': 'Spanish',
	    'su': 'Sundanese',
	    'sw': 'Swahili',
	    'sv': 'Swedish',
	    'tg': 'Tajik',
	    'ta': 'Tamil',
	    'te': 'Telugu',
	    'th': 'Thai',
	    'tr': 'Turkish',
	    'uk': 'Ukrainian',
	    'ur': 'Urdu',
	    'uz': 'Uzbek',
	    'vi': 'Vietnamese',
	    'cy': 'Welsh',
	    'xh': 'Xhosa',
	    'yi': 'Yiddish',
	    'yo': 'Yoruba',
	    'zu': 'Zulu'
	};

	return langs[key];
}

/*
* 명령어(내용) 내용을 반환한다, 처음 명령을 변환처리 한다, 찾지 못하면 null
* @param source 문자열
* @param commands 명령어  
* @return 찾은(내용) 
*/
fn.getCommand = (source, commands) => {
	const FIND_STR = commands;
	const FIND_CMD_STR = `${FIND_STR}(`;
	const FIND_CMD_END = `)`;

	if(!source || !commands){
		return null;
	}

	if(source.includes(FIND_CMD_STR)){

		let idxStart = source.indexOf(FIND_CMD_STR);
		let idxEnd = source.indexOf(FIND_CMD_END,idxStart);
		let len = idxEnd - idxStart - FIND_CMD_STR.length;
		let cmd = source.substr(idxStart+FIND_CMD_STR.length, len);

		return cmd;
	}

	return null;
}

/*
* source 에서 commands 를 포함하는 경우 파싱하여 언어 타입 정보를 가져온다
* @return 언어타입
*/
fn.getLang = (source, commands, defaults='ko') => {

	const FIND_STR = commands;
	const FIND_CMD_STR = `${FIND_STR}(`;
	const FIND_CMD_END = `)`;

	if(!source){
		return null;
	}

	let cmd = fn.getCommand(source, commands);
	if(cmd){
		if(fn._getLang(cmd)){
			return cmd;
		}else{
			return defaults;	
		}	
	}else if(source.includes(FIND_STR)){
		// 기본값으로 영어 변환
		return defaults;
	}
	// 존재하지 않음
	return null;
}

module.exports = fn;