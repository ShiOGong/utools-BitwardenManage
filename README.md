# Bitwarden管理插件

#### 配合Bitwarden命令行的管理工具 目前只支持mac系统

### 什么是Bitwarden?

请看这里 https://bitwarden.com/

### 使用前的准备

#### 1. 需要安装bw命令行(https://bitwarden.com/help/article/cli/)

macOS 可以使用命令行进行安装

`brew install bitwarden-cli`

linux

`sudo snap install bw`

#### 2. 如果您的账户开启了二步验证码 请执行以下操作 如果未开启则跳过这步 在登录时请选择不使用二步登录

#### 2.1 在mac的下载文件夹下 建立名为sh的文件夹

#### 2.2 在sh文件夹下 新建文件twoStepLogin.sh 并写入以下代码

```shell
#!/bin/bash
bw login "$1" "$2" <<EOF
$3
EOF 
```

#### 2.3 给sh文件足够的权限 执行以下命令

`chmod 755 ~/Downloads/sh/twoStepLogin.sh`

这个脚本只是用来辅助命令的输入 不会记录任何密码和信息 后面会想办法去掉这么麻烦的操作

### 如何使用

插件极为简单 按操作提示进行操作即可 首次登陆后 直到关机前都可以只用主密码解锁密码库

由于插件不会记录任何密码 所以每次使用的时候都需要进行主密码解锁的操作 为了安全考虑后续也不会记录用户的主密码 而账户登陆状态则由bitwarden自己管理 插件同样不会记录

#### 密码获取 [关键字 pass]

#### 生成随机密码 [关键字 random]

### 未来规划

1. 想办法去掉二步验证那麻烦的辅助脚本 寻找方法能让代码直接执行shell的交互式命令
2. 密码输入框 目前输入没有遮盖输入的效果 后面会想办法处理或遮盖密码的输入过程
3. 支持windows版本, linux未经测试 不过考虑到它和mac近似 应该没啥问题
4. 用ts重写一遍 现在代码~~不优雅~~非常乱
5. 优化提示信息和交互体验 弄点进度条或者进度提示
6. ~~密码生成器~~
7. 同步代码库
8. 添加 修改 删除密码项

### 如果因为bw更新或者插件不工作 请联系我的邮箱说明问题