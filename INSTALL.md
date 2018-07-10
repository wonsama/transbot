### How to install with nodejs

#### step 0. install nodejs

```
goto : https://nodejs.org/en/

and download lastest nodejs version 
```

#### step 1. clone project

`$ git clone https://github.com/wonsama/transbot`

#### step 2. install dependencies

```
$ cd transbot
$ npm install
```
#### step 3. add environment properties in .profile

~/.profile
```
# wtrans
export STEEM_TRANS_AUTHOR=author_name
export STEEM_TRANS_KEY_POSTING=posting_key
export STEEM_TRANS_ROOT=work_root_dir
export STEEM_TRANS_FOLDER_ERR=error_path
export STEEM_TRANS_FOLDER_INFO=info_path
export STEEM_TRANS_APP=version
```

#### step 4. run project

`$ node .`

### Cutomize to project

> You can change the command and function by referring to the source code below.

#### modify command in index.js

> change your monitoring commands in replies

```

const MONITOR_COMMAND_WTRANSUP = IS_TEST_MODE?'#testup':'#wtransup';
const MONITOR_COMMAND_WTRANSME = IS_TEST_MODE?'#testme':'#wtransme';
const MONITOR_COMMAND_WTRANSDEL = IS_TEST_MODE?'#testdel':'#wtransdel';

```

#### you can add & modify functions in index.js

> make your own like this `wtransup() , wtransme(), wtransdel()`  functions
