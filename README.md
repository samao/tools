# Tools

### 1. zip

`node zip.js -P filesfolder -E password -O outputfile`

* -P: 指定打包文件夹
* -E: 打包密码
* -O: 输出文件夹

### 2. unzip

`node unzip.js -P outputfile -E password -O outputfolder`

* -P: 指定解压文件
* -E: 解压密码
* -O: 解压输出目录

### 3. m3u8download

`node m3u8download playlist.m3u8`

会下载视频到项目 stream目录

### 4. bilibili

`node bilibili.js aid|url|range`

* aid B站对应aid
* url B站视频页地址
* range B站aid范围 1-xxxx

以上参数任选一执行

### 5. bilibili-dance-hot

`node bilibili-dance-hot [output]`

* output 可选保存文件夹，默认为downloads
