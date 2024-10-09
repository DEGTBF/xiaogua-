// 主循环函数
async function mainLoop() {
    let previousBalance; // 存储上一个余额
    let betDirection = 1; // 初始下注方向：1表示上涨，2表示下跌
    let lossCount = 0; // 记录连续输的次数
    let winCount = 0; // 记录连续赢的次数

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

        // 第一次查询余额时不做判断
        if (previousBalance !== undefined) {
            // 检查输赢
            if (balance < previousBalance) {
                lossCount++; // 输了，增加输的次数
                console.log("输了，当前连续输的次数:", lossCount);
                winCount = 0; // 赢的计数重置

                // 如果输的次数达到3次，切换下注方向
                if (lossCount >= 3) {
                    console.log("连续输了三次，切换下注方向。");
                    betDirection = betDirection === 1 ? 2 : 1; // 输了，切换方向
                    lossCount = 0; // 重置输的计数
                }
            } else {
                winCount++; // 赢了，增加赢的次数
                console.log("赢了，当前连续赢的次数:", winCount);
                lossCount = 0; // 输的计数重置

                // 如果赢的次数达到3次，切换下注方向
                if (winCount >= 3) {
                    console.log("连续赢了三次，切换下注方向。");
                    betDirection = betDirection === 1 ? 2 : 1; // 赢了，切换方向
                    winCount = 0; // 重置赢的计数
                }
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
            betAmount = 10000; // 余额低于 100,000，下注 10,000
        } else if (balance < 500000) {
            betAmount = 20000; // 余额低于 500,000，下注 20,000
        } else if (balance < 1000000) {
            betAmount = 30000; // 余额低于 1,000,000，下注 30,000
        } else {
            betAmount = 40000; // 余额大于 1,000,000，下注 40,000
        }

        // 下注
        const betResult = await placeBet(betAmount, betDirection);

        // 检测 token 是否失效
        if (betResult === "TOKEN_INVALID") {
            console.log("TOKEN 已失效，终止程序。");
            break; // 退出主循环
        }

        // 等待 12 到 15 秒之间的随机时间
        const waitTime = Math.floor(Math.random() * (15000 - 12000 + 1) + 12000);
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
