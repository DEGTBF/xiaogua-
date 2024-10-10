// 更新后的 token
const token = "377e0b95f8c02a74107fc55c0e6bda07";

// 查询用户余额的函数
async function getUserInfo() {
    const response = await fetch("https://copxgame.copx.ai/miniapp/User/UserInfo", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0"
        },
        body: JSON.stringify({
            token: token
        })
    });

    if (!response.ok) {
        console.error("网络响应不正常:", response.status);
        return null; // 返回 null 表示网络问题
    }

    const data = await response.json();
    if (data.error !== 0) {
        console.error("查询用户信息失败:", data.msg);
        if (data.msg === "TOKEN 失效" || data.error === 401) { // 检测 token 失效
            console.log("TOKEN 失效，停止操作。");
            return "TOKEN_INVALID"; // 返回 token 失效标记
        }
        return null; // 返回 null 作为失败标记
    }

    console.log("用户余额:", data.data.vu); // 输出用户余额
    return parseFloat(data.data.vu); // 返回余额
}

// 下注的函数
async function placeBet(betAmount, direction) {
    const response = await fetch("https://copxgame.copx.ai/miniapp/User/GameJoin", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0"
        },
        body: JSON.stringify({
            token: token,
            num: betAmount,
            gametype: direction // 使用下注方向
        })
    });

    const data = await response.json();
    if (data.error !== 0) {
        console.error("下注失败:", data.msg);
        if (data.msg === "TOKEN 失效" || data.error === 401) { // 检测 token 失效
            console.log("TOKEN 失效，停止下注。");
            return "TOKEN_INVALID"; // 返回 token 失效标记
        }
    }
    console.log("下注结果:", data);
    return data; // 返回下注结果
}

// 随机生成下注金额的函数
function getRandomBetAmount(baseAmount) {
    const minAmount = Math.max(0, baseAmount - 2000); // 确保最小下注金额不为负
    const maxAmount = baseAmount + 2000;
    return Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount; // 生成随机下注金额
}

// 主循环函数
async function mainLoop() {
    let previousBalance; // 存储上一个余额
    let betDirection = 1; // 初始下注方向：1表示上涨，2表示下跌
    let totalLosses = 0; // 记录总输的次数
    let totalWins = 0; // 记录总赢的次数

    while (true) {
        // 查询用户余额
        const balance = await getUserInfo();

        // 检测 token 是否失效
        if (balance === "TOKEN_INVALID") {
            console.log("TOKEN 已失效，终止程序。");
            break; // 退出主循环
        }

        // 如果余额查询失败，则继续下一次循环
        if (balance === null) {
            console.log("查询用户信息失败，跳过本次操作。");
            continue;
        }

        // 检查是否有前一次的下注结果
        if (previousBalance !== undefined) {
            // 输的情况
            if (balance < previousBalance) {
                totalLosses++; // 总输次数加一
                console.log("输了，切换下注方向。");
                betDirection = betDirection === 1 ? 2 : 1; // 输了切换下注方向
            } else {
                totalWins++; // 总赢次数加一
                console.log("赢了，继续当前下注方向。");
            }
        }

        // 更新上一个余额
        previousBalance = balance;

        // 输出当前下注方向
        console.log(`当前下注方向: ${betDirection === 1 ? "上涨" : "下跌"}`);

        // 检查余额并设定下注金额
        let betAmount;
        if (balance < 10000) {
            console.log("余额低于 10,000，停止游戏。");
            break; // 余额低于 10,000，停止循环
        } else if (balance < 20000) {
            betAmount = 5000; // 余额低于 20,000，下注 5,000
        } else if (balance < 100000) {
            betAmount = getRandomBetAmount(10000); // 余额低于 100,000，下注 10,000 ± 2000
        } else if (balance < 500000) {
            betAmount = getRandomBetAmount(20000); // 余额低于 500,000，下注 20,000 ± 2000
        } else if (balance < 1000000) {
            betAmount = getRandomBetAmount(30000); // 余额低于 1,000,000，下注 30,000 ± 2000
        } else {
            betAmount = getRandomBetAmount(40000); // 余额大于 1,000,000，下注 40,000 ± 2000
        }

        // 下注
        const betResult = await placeBet(betAmount, betDirection);

        // 检测 token 是否失效
        if (betResult === "TOKEN_INVALID") {
            console.log("TOKEN 已失效，终止程序。");
            break; // 退出主循环
        }

        // 输出下注金额
        console.log(`本次下注金额: ${betAmount}`);

        // 输出累计的输赢次数
        console.log(`当前累计输的次数: ${totalLosses}, 当前累计赢的次数: ${totalWins}`);

        // 等待 12 到 15 秒之间的随机时间
        const waitTime = Math.floor(Math.random() * (15000 - 12000 + 1)) + 12000;
        console.log(`等待 ${waitTime / 1000} 秒后重新下注...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
}

// 启动主循环
mainLoop().then(() => {
    console.log("主循环结束");
}).catch(error => {
    console.error("主循环过程中发生错误:", error);
});
