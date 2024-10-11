// 更新后的 token
const token = "377e0b95f8c02a74107";

let winCount = 0; // 赢数
let loseCount = 0; // 输数
let totalBets = 0; // 总下注次数
let previousBinancePrices = []; // 存储最近的币安价格
let previousGamePrices = []; // 存储最近的游戏价格

// 使用WebSocket获取BTC价格
let currentBinancePrice = 0;

// 初始化WebSocket
const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');

ws.onmessage = function (event) {
    const data = JSON.parse(event.data);
    currentBinancePrice = Math.floor(parseFloat(data.p)); // 取整数

    // 保持最近0.5秒内的价格
    previousBinancePrices.push(currentBinancePrice);
    if (previousBinancePrices.length > 10) { // 每0.05秒获取1次，所以保存10个是0.5秒内的数据
        previousBinancePrices.shift();
    }
};

// 获取游戏内 BTC 价格的函数（多线程方式：使用Promise.all并发请求）
async function getGamePrices() {
    const requests = [getGamePrice(), getGamePrice(), getGamePrice()]; // 3线程请求
    const prices = await Promise.all(requests);
    const averagePrice = prices.reduce((a, b) => a + b) / prices.length; // 计算平均价格
    previousGamePrices.push(Math.floor(averagePrice));
    if (previousGamePrices.length > 10) { // 保存最近0.5秒的数据
        previousGamePrices.shift();
    }
    return Math.floor(averagePrice);
}

// 单次获取平台价格的函数
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
    return Math.floor(parseFloat(data.data.nowprice)); // 取整数
}

// 获取币安BTC价格的函数（多线程方式：使用Promise.all并发请求）
async function getBinancePrices() {
    const requests = [getBinancePrice(), getBinancePrice(), getBinancePrice()]; // 3线程请求
    const prices = await Promise.all(requests);
    const averagePrice = prices.reduce((a, b) => a + b) / prices.length; // 计算平均价格
    previousBinancePrices.push(Math.floor(averagePrice));
    if (previousBinancePrices.length > 10) { // 保存最近0.5秒的数据
        previousBinancePrices.shift();
    }
    return Math.floor(averagePrice);
}

// 模拟获取币安BTC的函数（从WebSocket模拟获取）
async function getBinancePrice() {
    return new Promise((resolve) => {
        resolve(currentBinancePrice); // 直接返回当前的币安价格
    });
}

// 查询用户余额的函数
async function getUserInfo() {
    const response = await fetch("https://copxgame.copx.ai/miniapp/User/UserInfo", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0"
        },
        body: JSON.stringify({ token: token })
    });

    if (!response.ok) {
        console.error("网络响应不正常:", response.status);
        return null; // 返回 null 表示网络问题
    }

    const data = await response.json();
    if (data.error !== 0) {
        console.error("查询用户信息失败:", data.msg);
        return null; // 返回 null 作为失败标记
    }

    console.log("用户余额:", Math.floor(data.data.vu)); // 输出用户余额取整数
    return Math.floor(data.data.vu); // 返回整数形式的余额
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
        return null; // 返回 null 表示下注失败
    }

    console.log("下注结果:", data);
    return data; // 返回下注结果
}

// 主循环函数
async function mainLoop() {
    let currentBalance; // 当前余额
    let previousBalance; // 上一个余额

    while (true) {
        // 查询用户余额
        currentBalance = await getUserInfo();

        // 余额低于1000时终止脚本
        if (currentBalance < 1000) {
            console.log("余额低于1000，终止程序。");
            break;
        }

        // 获取币安和平台的价格，每次多线程获取
        const [gamePrice, binancePrice] = await Promise.all([getGamePrices(), getBinancePrices()]);

        if (binancePrice === 0 || gamePrice === 0) {
            console.log("获取价格异常，跳过本次操作。");
            continue;
        }

        // 计算价格差
        const priceDifference = binancePrice - gamePrice;

        // 输出当前价格信息
        console.log(`当前币安价格: ${binancePrice}, 当前游戏价格: ${gamePrice}, 价格差: ${priceDifference}`);

        // 确定下注方向
        let betDirection;
        if (binancePrice >= Math.max(...previousBinancePrices) && binancePrice >= (gamePrice + 10)) {
            betDirection = 1; // 下注上涨
        } else if (binancePrice <= Math.min(...previousBinancePrices) && binancePrice <= (gamePrice - 10)) {
            betDirection = 2; // 下注下跌
        } else {
            console.log("不下注，等待机会。");
            continue; // 继续下一次循环
        }

        // 检查下注金额
        const betAmount = Math.floor(currentBalance * (Math.random() * (0.08) + 0.40)); // 计算下注金额

        // 下注
        const betResult = await placeBet(betAmount, betDirection);

        if (betResult === null) {
            console.log("下注失败，跳过本次操作。");
            continue;
        }

        console.log(`本次下注金额: ${betAmount}, 方向: ${betDirection === 1 ? "上涨" : "下跌"}`);

        // 等待15秒，期间检查余额变化
        await new Promise(resolve => setTimeout(resolve, 15000));

        // 获取最新余额
        previousBalance = currentBalance;
        currentBalance = await getUserInfo();

        // 判断输赢
        if (currentBalance > previousBalance) {
            winCount++;
            console.log("本次下注: 赢了！");
        } else {
            loseCount++;
            console.log("本次下注: 输了！");
        }

        totalBets++; // 统计下注次数

        // 输出当前输赢统计
        console.log(`当前余额: ${currentBalance}, 总下注次数: ${totalBets}, 赢的次数: ${winCount}, 输的次数: ${loseCount}, 胜率: ${(winCount / totalBets * 100).toFixed(0)}%`);

        // 每0.05秒重新获取
        await new Promise(resolve => setTimeout(resolve, 50));
    }
}

// 启动主循环
mainLoop().then(() => {
    console.log("主循环结束");
});
