// import('./sh/twoStepLogin.sh')

if (!utools.isWindows()) process.env.PATH += ':/usr/local/bin:/usr/local/sbin';

const child = require('child_process');

let towStepMode = true;

let email = '';
let password = '';
let twoStepCode = '';

let loginFlag;
let checkLoginFlag = false;
let unlockFlag = false;

let session = '';

let searchMode = false;
let itemsData = [];

function searchItems(keywords, callbackSetList) {
    let tempData = itemsData.filter(element => {
        return element.title.search(keywords) !== -1;
    });

    callbackSetList(tempData)
}

function itemSearchSelectInput(callbackSetList) {
    utools.removeSubInput();

    searchMode = true
    utools.setSubInput((text) => {
        console.log(text.text)

        if (!text.text) {
            callbackSetList(itemsData)
        } else {
            searchItems(text.text, callbackSetList);
        }
    }, "搜索项目名(大小写敏感)", true)
}


function emailSelectInput(title, callbackSetList) {
    utools.removeSubInput();

    utools.setSubInput((text) => {
        email = text.text
    }, "邮箱", true)

    callbackSetList([
        {
            title: title,
            description: '尚未登录,请登录',
            icon: '', // 图标(可选)
        },
    ])
}

function passSelectInput(title, callbackSetList) {
    utools.removeSubInput();

    utools.setSubInput((text) => {
        password += text.text
        utools.setSubInputValue('')
    }, "主密码[密码已隐藏]", true)

    callbackSetList([
        {
            title: title,
            description: '尚未登录,请登录',
            icon: '', // 图标(可选)
        },
    ])
}

function twoStepSelectInput(title, callbackSetList) {
    utools.removeSubInput();

    utools.setSubInput((text) => {
        twoStepCode = text.text
    }, "验证码", true)

    callbackSetList([
        {
            title: title,
            description: '尚未登录,请登录',
            icon: '', // 图标(可选)
        },
    ])
}

function getAllItems() {
    let cmd = 'bw list items --session ' + session
    let data = child.execSync(cmd).toString();
    const dataObj = JSON.parse(data)
    return dataObj
}

let syncInputTitles = {
    'sync': '同步密码库'
}

function syncItemToSetList(itemsData) {
    let lastSyncUTCDate = syncLastDate();

    let date = new Date(lastSyncUTCDate);
    lastSyncDate = GetFormattedDate(date);

    console.log(lastSyncDate);
    itemsData.unshift({
        'title': syncInputTitles.sync,
        'description': '最后同步时间:' + lastSyncDate
    })
    return itemsData;
}

function itemToSetList(itemsData) {
    let selectListItems = [];

    for (const itemsDataKey in itemsData) {
        let item = itemsData[itemsDataKey];

        let selectListItem = {}
        selectListItem.title = '项目名: ' + item.name
        selectListItem.description = item.login.username + '(Enter 复制密码到剪切板)'
        selectListItem.data = item.login.password

        selectListItems.push(selectListItem)
    }
    return selectListItems
}

let logoutInputTitles = {
    'logout': '退出登录'
}

function unlockSelectInput(unlockTitle, callbackSetList) {
    utools.removeSubInput();

    utools.setSubInput((text) => {
        password += text.text
        utools.setSubInputValue('')
    }, "主密码[密码已隐藏]", true)

    callbackSetList([
        {
            title: unlockTitle,
            description: '输入主密码解锁',
            icon: '', // 图标(可选)
        },
        {
            title: logoutInputTitles.logout,
            description: '退出登录状态',
            icon: '', // 图标(可选)
        },
    ])

}

function unlockAndShowData(password, callbackSetList, unlockAction = true) {
    if (unlockAction) {
        unlock(password);
    }

    sleep(50).then(() => {
        itemsData = syncItemToSetList(itemToSetList(getAllItems()))
        callbackSetList(itemsData)

        itemSearchSelectInput(callbackSetList)
    })
}

function quit(message = false, hideMainWindow = true) {
    // 安全起见 清空密码
    if (message) {
        alert(message);
    }
    // 变量初始化
    password = ''
    session = ''
    // 变量初始化
    randomPassLength = 12;

    if (hideMainWindow) {
        window.utools.hideMainWindow();
    }
    window.utools.outPlugin()
}

function clearShow(message, callbackSetList) {
    utools.removeSubInput();

    console.log('进度展示:', message);
    callbackSetList([
        {
            title: message,
            description: '正在执行操作,请稍后片刻',
            icon: '', // 图标(可选)
        },
    ])
}

function sync() {
    console.log('function sync')
    let cmd;
    try {
        cmd = 'bw sync --session ' + session
        console.log(cmd)
        let data = child.execSync(cmd).toString();
        console.log(data)
    } catch (e) {
        quit('同步失败,请稍后重试', false);
    }
}

function logout() {
    let cmd = 'bw logout'
    console.log(cmd)
    let data = child.execSync(cmd).toString();
    console.log(data)
}

window.exports = {
    "pass": { // 注意：键对应的是 plugin.json 中的 features.code
        mode: "list",  // 用于无需 UI 显示，执行一些简单的代码
        args: {
            // 进入插件时调用
            enter: (action, callbackSetList) => {
                // 初始化
                searchMode = false

                // action = { code, type, payload }
                // window.utools.hideMainWindow()
                clearShow('请稍后', callbackSetList)

                sleep(100).then(() => {
                    let checkLoginFlagObj = checkLogin()
                    let unlockTitle;

                    if (!checkLoginFlagObj.flag) {
                        callbackSetList([
                            {
                                title: '账号已开启二步验证',
                                description: '尚未登录,请登录',
                                icon: '', // 图标(可选)
                            },
                            {
                                title: '账号未开启二步验证',
                                description: '尚未登录,请登录',
                                icon: '', // 图标(可选)
                            },
                        ])
                    } else {
                        if (checkLoginFlagObj.status === 'locked') {
                            unlockTitle = '请输入主密码'
                            unlockSelectInput(unlockTitle, callbackSetList)
                        }
                    }
                })
            },
            select: (action, itemData, callbackSetList) => {
                // const url = itemData.title
                console.log(itemData.title)
                let emailTitle;
                emailTitle = '请输入邮箱'
                if (itemData.title === '账号已开启二步验证') {
                    towStepMode = true

                    emailSelectInput(emailTitle, callbackSetList)
                }
                if (itemData.title === '账号未开启二步验证') {
                    towStepMode = false
                    emailSelectInput(emailTitle, callbackSetList)
                }

                let passTitle;
                passTitle = '请输入密码'
                if (itemData.title === emailTitle && email !== '') {
                    console.log(email);

                    passSelectInput(passTitle, callbackSetList)
                }


                let twoStepTitle;
                twoStepTitle = '请输入验证码'
                if (itemData.title === passTitle && password !== '') {
                    console.log('towStepMode:', towStepMode);

                    if (!towStepMode) {
                        sleep(1).then(() => {
                            if (!login(email, password, false)) {
                                quit('登录失败!', false)
                            }

                            // unlockAndShowData(password, callbackSetList)
                            quit('登录成功,请重新进入插件', false);
                        })
                    } else {
                        twoStepSelectInput(twoStepTitle, callbackSetList)
                    }
                }

                if (itemData.title === twoStepTitle && twoStepCode !== '' && towStepMode === true) {
                    console.log(twoStepCode);
                    clearShow('请稍后', callbackSetList);

                    sleep(100).then(() => {
                        login(email, password, twoStepCode)

                        // unlockAndShowData(password, callbackSetList)
                        quit('登录成功,请重新进入插件', false)
                    })
                }

                if (itemData.title === '请输入主密码') {
                    clearShow('请稍后', callbackSetList);

                    sleep(50).then(() => {
                        unlockAndShowData(password, callbackSetList)
                    })
                }

                console.log(itemData.title.indexOf('项目名:'))
                if (searchMode === true && itemData.title.indexOf('项目名:') !== -1) {
                    console.log(searchMode)

                    utools.copyText(itemData.data)

                    quit()
                }
                if (itemData.title === syncInputTitles.sync) {
                    clearShow('同步中,请稍后', callbackSetList);

                    sleep(100).then(() => {
                        sync();
                        // unlocak过了 无需unlock
                        unlockAndShowData(password, callbackSetList, false)
                    })
                }
                if (itemData.title === logoutInputTitles.logout) {
                    clearShow('退出中', callbackSetList);

                    sleep(1).then(() => {
                        logout();
                        quit(false, false)
                    })
                }
            },
        }
    },
    "random": { // 注意：键对应的是 plugin.json 中的 features.code
        mode: "list",  // 用于无需 UI 显示，执行一些简单的代码
        args: {
            // 进入插件时调用
            enter: (action, callbackSetList) => {
                // 选择密码模式
                randomInitInput(callbackSetList)
            },

            select: (action, itemData, callbackSetList) => {
                // 选择密码模式
                let randomPass
                switch (itemData.title) {
                    case randomInputTitles.number:
                        clearShow('生成中,请稍后', callbackSetList);
                        sleep(1).then(() => {
                            randomPass = randomPassGenerate('n', randomPassLength);
                            randomCopyPassInput(randomPass, callbackSetList);
                        })
                        break;
                    case randomInputTitles.number_case:
                        clearShow('生成中,请稍后', callbackSetList);
                        sleep(1).then(() => {
                            randomPass = randomPassGenerate('uln', randomPassLength);
                            randomCopyPassInput(randomPass, callbackSetList);
                        })
                        break;
                    case randomInputTitles.number_case_special:
                        clearShow('生成中,请稍后', callbackSetList);
                        sleep(1).then(() => {
                            randomPass = randomPassGenerate('ulns', randomPassLength);
                            randomCopyPassInput(randomPass, callbackSetList);
                        })
                        break;
                    case randomInputTitles.random_copy_pass:
                        utools.copyText(itemData.data)
                        quit();
                        break;
                }
            },
        }
    }
}

let lastSyncDate = '未获取'

function syncLastDate() {
    console.log('function syncLastDate')
    let cmd = 'bw sync --session ' + session + ' --last'
    console.log(cmd)
    return child.execSync(cmd).toString()
}

function unlock(password) {
    console.log('function unlock')
    try {
        cmd = 'bw unlock ' + password
        let data = child.execSync(cmd).toString();
        console.log(data)

        let matchArr;
        matchArr = data.match("\"([\\w\\d/+=]*)\"")
        session = matchArr[0]
        session = session.replace(/"/g, '')
        console.log('stdout:', session);

    } catch (e) {

    }

    return unlockFlag
}

function login(email, password, twoStepCode = false) {
    console.log('function login')

    let cmd;
    if (twoStepCode) {
        console.log(utools.getPath('downloads') + '/sh/twoStepLogin.sh')
        let shPath = utools.getPath('downloads') + '/sh/twoStepLogin.sh';
        // cmd = './sh/twoStepLogin.sh ' + email + ' ' + password + ' ' + twoStepCode;
        cmd = shPath + ' ' + email + ' ' + password + ' ' + twoStepCode;
        // cmd = 'bw login ' + email + ' ' + password + ' ' + twoStepCode;
    } else {
        cmd = 'bw login ' + email + ' ' + password;
    }

    child.exec(cmd,
        function (error, stdout, stderr) {
            if (error !== null) {
                if (stderr.indexOf("Two-step token is invalid.")) {
                    console.log('二步验证码输入错误');
                    quit('二步验证码输入错误', false)
                }
                quit('发生错误 请检查输入账户是否正确')

                loginFlag = false;
            } else {
                if (stdout.indexOf('logged in!')) {
                    console.log('登录成功');
                    loginFlag = true;
                }
            }
        });

    return loginFlag
}


function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}


function checkLogin() {
    console.log('function checkLogin')

    try {
        let cmd = 'bw status'
        let data = child.execSync(cmd).toString();
        console.log(data)
        const dataObj = JSON.parse(data)

        switch (dataObj.status) {
            case "unauthenticated":
                console.log('尚未登录')
                checkLoginFlag = false
                break;
            case "locked":
                console.log('登录未解锁')
                checkLoginFlag = true
                break;
            case "unlock":
                console.log('登录已解锁')
                checkLoginFlag = true
                break;
        }
        return {'flag': checkLoginFlag, 'status': dataObj.status};
    } catch (e) {
        quit('发生错误 请检查是否安装bw命令行')
    }
}

let randomInputTitles = {
    'number': '数字',
    'number_case': '字母+数字',
    'number_case_special': '字母+数字+特殊符号',
    'random_copy_pass': '复制随机密码'
}
let randomPassLength = 12

function randomPassGenerate(randomPassModel, randomPassLength) {
    let cmd = 'bw generate -' + randomPassModel + ' --length ' + randomPassLength
    return child.execSync(cmd).toString();
}

function randomInitInput(callbackSetList) {
    utools.removeSubInput();

    utools.setSubInput((text) => {
        randomPassLength = text.text
    }, "密码长度(默认12位)", true)

    callbackSetList([
        {
            title: randomInputTitles.number_case_special,
            description: '字母数字特殊混合密码',
            icon: '', // 图标(可选)
        },
        {
            title: randomInputTitles.number_case,
            description: '字母数字混合密码',
            icon: '', // 图标(可选)
        },
        {
            title: randomInputTitles.number,
            description: '生成数字密码',
            icon: '', // 图标(可选)
        },
    ])
}

function randomCopyPassInput(password, callbackSetList) {
    utools.removeSubInput();

    callbackSetList([
        {
            title: randomInputTitles.random_copy_pass,
            description: '密码已生成:' + password,
            icon: '', // 图标(可选)
            data: password
        },
    ])
}

function GetFormattedDate(date) {
    let month = ("0" + (date.getMonth() + 1)).slice(-2);
    let day = ("0" + (date.getDate())).slice(-2);
    let year = date.getFullYear();
    let hour = ("0" + (date.getHours())).slice(-2);
    let min = ("0" + (date.getMinutes())).slice(-2);
    let seg = ("0" + (date.getSeconds())).slice(-2);
    return year + "-" + month + "-" + day + " " + hour + ":" + min + ":" + seg;
}

