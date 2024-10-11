// 获取币安和平台价格的函数
async function getPrices() {
    const binancePrice = await getBinancePrice(); // 获取币安价格
    const gamePrice = await getGamePrice(); // 获取游戏平台价格

    if (binancePrice !== null && gamePrice !== null) {
        priceHistory.push({
            timestamp: Date.now(),
            binancePrice: binancePrice,
            gamePrice: gamePrice
        });

        // 保留最近的数据（例如最多保留最近2分钟的数据）
        if (priceHistory.length > 120) { // 如果记录超过120条(相当于2分钟数据)，删除最早的数据
            priceHistory.shift();
        }
    }

    return { binancePrice, gamePrice };
}

// 移动平均线预测价格变化
function movingAveragePredictor() {
    if (priceHistory.length < 10) {
        return null; // 如果历史数据不足，返回空
    }

    // 计算移动平均线：以最后10次数据为窗口
    const recentPrices = priceHistory.slice(-10);
    const avgGamePrice = recentPrices.reduce((sum, data) => sum + data.gamePrice, 0) / recentPrices.length;
    const avgBinancePrice = recentPrices.reduce((sum, data) => sum + data.binancePrice, 0) / recentPrices.length;

    return { avgGamePrice, avgBinancePrice };
}

// 下注逻辑
async function placeBetBasedOnPrediction(binancePrice, gamePrice, prediction) {
    let betDirection = null;

    // 移动平均线预测涨跌
    if (prediction.avgGamePrice > gamePrice && binancePrice - gamePrice > 20) {
        betDirection = 1; // 预测价格上涨，且币安价格大于平台价格20，下注涨
        console.log("移动平均线预测上涨，且币安价格比平台价格高20，下注涨。");
    } else if (prediction.avgGamePrice < gamePrice && gamePrice - binancePrice > 10) {
        betDirection = 2; // 预测价格下跌，且币安价格小于平台价格10，下注跌
        console.log("移动平均线预测下跌，且币安价格比平台价格低10，下注跌。");
    } else {
        console.log("没有合适的下注机会，等待...");
        return; // 没有满足条件，不下注
    }

    // 如果有下注方向，计算下注金额并进行下注
    if (betDirection !== null) {
        let betAmount = getRandomBetAmount(currentBalance); // 根据当前余额计算下注金额

        // 进行下注
        const betResult = await placeBet(betAmount, betDirection);

        // 检测是否下注成功并输出结果
        if (betResult.error === 0) {
            console.log(`下注成功！金额: ${betAmount}，方向: ${betDirection === 1 ? "涨" : "跌"}`);
        } else {
            console.log("下注失败:", betResult.msg);
        }
    }
}

// 主循环函数
async function mainLoop() {
    let previousBalance; // 上次余额
    let totalLosses = 0; // 记录总输的次数
    let totalWins = 0; // 记录总赢的次数

    while (true) {
        // 查询用户余额
        currentBalance = await getUserInfo();

        // 检查余额是否低于 1000
        if (currentBalance < 1000) {
            console.log("余额低于 1000，停止操作。");
            break; // 终止脚本
        }

        // 收集价格数据
        const { binancePrice, gamePrice } = await getPrices();

        if (binancePrice === null || gamePrice === null) {
            console.log("获取价格失败，跳过本次操作。");
            continue;
        }

        // 移动平均线预测价格变化
        const prediction = movingAveragePredictor();

        if (prediction === null) {
            console.log("数据不足，跳过本次操作。");
            continue;
        }

        // 根据预测和条件执行下注
        await placeBetBasedOnPrediction(binancePrice, gamePrice, prediction);

        // 每次下注后更新赢亏记录
        if (previousBalance !== undefined) {
            if (currentBalance > previousBalance) {
                totalWins++;
                console.log("赢了！");
            } else {
                totalLosses++;
                console.log("输了！");
            }
        }

        // 更新上次余额
        previousBalance = currentBalance;

        // 输出当前输赢统计
        const winRate = (totalWins / (totalWins + totalLosses)) * 100;
        console.log(`当前累计赢数: ${totalWins}，输数: ${totalLosses}，胜率: ${winRate.toFixed(2)}%`);

        // 等待 1 秒再获取下一个价格并预测
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// 启动主循环
mainLoop().then(() => {
    console.log("主循环结束");
}).catch(error => {
    console.error("主循环过程中发生错误:", error);
});
