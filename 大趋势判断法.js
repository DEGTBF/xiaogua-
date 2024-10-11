// 更新后的 token
const token = "377e0b95f8c02a74107fc55c0e6bda07";

let priceHistory = []; // 用来存储历史价格数据
let winCount = 0; // 赢数
let loseCount = 0; // 输数

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
    return parseFloat(data.data.nowprice);
}

// 获取币安 BTC 价格的函数 (这里需要通过API获取币安价格)
async function getBinancePrice() {
    // 这里应该调用 Binance 的 API 获取 BTC 价格
    // 假设有个现成的获取 Binance 价格的函数
    // return await fetchBinanceBTCPrice(); 
    return 50000; // 示例: 假设币安的价格是50000
}

// 收集历史价格数据的函数，每秒获取一次价格
async function collectPriceData() {
    const gamePrice = await getGamePrice();
    const binancePrice = await getBinancePrice();

    if (gamePrice !== null && binancePrice !== null) {
        priceHistory.push({
            timestamp: Date.now(),
            gamePrice: gamePrice,
            binancePrice: binancePrice
        });

        // 保留最近的数据（例如最多保留最近60秒的数据）
        if (priceHistory.length > 60) {
            priceHistory.shift(); // 移除最早的数据
        }
    }
}

// 使用移动平均线预测未来价格（基于过去10秒数据）
function predictPrice() {
    if (priceHistory.length < 10) {
        return null; // 如果历史数据不足，返回空
    }

    // 计算移动平均线 (过去10秒的平均值)
    const recentPrices = priceHistory.slice(-10).map(data => data.gamePrice);
    const movingAverage = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;

    return movingAverage;
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

    const data = await response.json();
    if (data.error !== 0) {
        console.error("查询用户信息失败:", data.msg);
        return null;
    }

    return parseFloat(data.data.vu);
}

// 判断下注输赢
function checkWinOrLose(predictedPrice, actualPrice, direction) {
    // 如果方向为 1 (上涨)，实际价格高于预测价格，则赢
    if (direction === 1 && actualPrice > predictedPrice) {
        return true;
    }

    // 如果方向为 2 (下跌)，实际价格低于预测价格，则赢
    if (direction === 2 && actualPrice < predictedPrice) {
        return true;
    }

    // 否则为输
    return false;
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
            gametype: direction
        })
    });

    const data = await response.json();
    if (data.error !== 0) {
        console.error("下注失败:", data.msg);
        return "TOKEN_INVALID";
    }

    return data;
}

// 下注逻辑
async function betBasedOnPrediction() {
    const predictedPrice = predictPrice();
    const actualPrice = await getGamePrice();
    const binancePrice = await getBinancePrice();

    if (!predictedPrice || !actualPrice || !binancePrice) {
        return;
    }

    console.log(`预测价格: ${predictedPrice}, 游戏实际价格: ${actualPrice}, 币安价格: ${binancePrice}`);

    let direction = null;

    // 根据移动平均线预测和币安与平台的价格差进行下注
    if (predictedPrice > actualPrice && binancePrice - actualPrice > 20) {
        direction = 1; // 预测上涨，且币安价格比平台高20，下注涨
        console.log("条件满足：预测涨，币安价格大于平台价格20，下注涨。");
    } else if (predictedPrice < actualPrice && actualPrice - binancePrice > 10) {
        direction = 2; // 预测下跌，且平台价格比币安高10，下注跌
        console.log("条件满足：预测跌，平台价格大于币安价格10，下注跌。");
    } else {
        console.log("条件不满足，不下注。");
    }

    return direction;
}

// 主循环函数
async function mainLoop() {
    let currentBalance;

    while (true) {
        // 查询用户余额
        currentBalance = await getUserInfo();

        // 余额低于1000时终止脚本
        if (currentBalance < 1000) {
            console.log("余额低于1000，终止程序。");
            break;
        }

        // 收集价格数据
        await collectPriceData();

        // 下注预测
        const betDirection = await betBasedOnPrediction();
        const betAmount = Math.floor(currentBalance * 0.1); // 假设下注金额为当前余额的10%

        if (betDirection && betAmount > 0) {
            const betResult = await placeBet(betAmount, betDirection);

            if (betResult === "TOKEN_INVALID") {
                console.log("TOKEN 已失效，终止程序。");
                break;
            }

            console.log(`下注金额: ${betAmount}`);

            // 等待10秒，期间每秒收集价格并更新预测
            for (let i = 0; i < 10; i++) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                await collectPriceData();
                const predictedPrice = predictPrice();
                console.log(`等待期间预测价格: ${predictedPrice}`);
            }

            // 获取最新价格并判断输赢
            const actualPrice = await getGamePrice();
            const predictedPrice = predictPrice();

            const isWin = checkWinOrLose(predictedPrice, actualPrice, betDirection);

            if (isWin) {
                winCount++;
                console.log("本次下注: 赢了！");
            } else {
                loseCount++;
                console.log("本次下注: 输了！");
            }

            // 更新当前用户余额
            currentBalance = await getUserInfo();

            // 输出当前用户信息
            console.log(`当前余额: ${currentBalance}`);
            console.log(`赢数: ${winCount}, 输数: ${loseCount}, 赢率: ${(winCount / (winCount + loseCount) * 100).toFixed(2)}%`);
        }

        // 等待下一次下注
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// 启动主循环
mainLoop().then(() => {
    console.log("主循环结束");
}).catch(error => {
    console.error("主循环过程中发生错误:", error);
});
