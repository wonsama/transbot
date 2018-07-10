### How to install with nodejs

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
