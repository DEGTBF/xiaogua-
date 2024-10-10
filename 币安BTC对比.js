// 更新后的 token
const token = "377e0b95f8c02a74107fc55c0e6bda07";

// 币安 API 获取 BTC 价格的函数
async function getBinancePrice() {
    const response = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
    const data = await response.json();
    return parseFloat(data.price);
}

// 获取游戏内 BTC 价格的函数
async function getGamePrice() {
    const response = await fetch("https://copxgame.copx.ai/miniapp/User/GamePrice", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0"
        },
        body: JSON.stringify({ token: token })
    });

    const data = await response.json();
    if (data.error !== 0) {
        console.error("获取游戏价格失败:", data.msg);
        return null;
    }
    return parseFloat(data.data.nowprice); // 从 data.nowprice 获取并转换为数字
}

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
    let currentBalance; // 当前余额
    let totalLosses = 0; // 记录总输的次数
    let totalWins = 0; // 记录总赢的次数
    let previousPrice; // 存储上一个币安价格

    while (true) {
        // 查询用户余额
        currentBalance = await getUserInfo();

        // 检测 token 是否失效
        if (currentBalance === "TOKEN_INVALID") {
            console.log("TOKEN 已失效，终止程序。");
            break; // 退出主循环
        }

        // 如果余额查询失败，则继续下一次循环
        if (currentBalance === null) {
            console.log("查询用户信息失败，跳过本次操作。");
            continue;
        }

        // 获取币安和游戏的 BTC 价格
        const binancePrice = await getBinancePrice();
        const gamePrice = await getGamePrice();

        if (binancePrice === null || gamePrice === null) {
            console.log("获取价格失败，跳过本次操作。");
            continue;
        }

        // 判断当前阶段
        let currentStage = binancePrice >= previousPrice ? "上涨" : "下跌"; // 确定当前阶段
        if (previousPrice === undefined) {
            currentStage = "上涨"; // 初始化阶段为上涨
        }
        previousPrice = binancePrice; // 更新上一个价格

        // 确定下注方向
        let betDirection;
        if (currentStage === "上涨") {
            betDirection = binancePrice > gamePrice ? 1 : 2; // 上涨阶段
        } else {
            betDirection = binancePrice < gamePrice ? 1 : 2; // 下跌阶段
        }

        // 输出当前阶段信息
        console.log(`当前阶段: ${currentStage}, 当前币安价格: ${binancePrice}, 游戏价格: ${gamePrice}, 下注方向: ${betDirection === 1 ? "上涨" : "下跌"}`);

        // 检查余额并设定下注金额
        let betAmount;
        if (currentBalance < 10000) {
            console.log("余额低于 10,000，停止游戏。");
            break; // 余额低于 10,000，停止循环
        } else if (currentBalance < 20000) {
            betAmount = 5000; // 余额低于 20,000，下注 5,000
        } else if (currentBalance < 100000) {
            betAmount = getRandomBetAmount(10000); // 余额低于 100,000，下注 10,000 ± 2000
        } else if (currentBalance < 500000) {
            betAmount = getRandomBetAmount(20000); // 余额低于 500,000，下注 20,000 ± 2000
        } else if (currentBalance < 1000000) {
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

        // 判断输赢
        if (previousBalance !== undefined) {
            if (currentBalance > previousBalance) {
                totalWins++; // 赢
                console.log("赢了！");
            } else {
                totalLosses++; // 输
                console.log("输了！");
            }
        }

        // 更新上一个余额
        previousBalance = currentBalance;

        // 输出当前输赢统计
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
