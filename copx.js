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
        body: JSON.stringify({ token: token })
    });

    if (!response.ok) {
        console.error("网络响应不正常:", response.status);
        return null; // 返回 null 表示网络问题
    }

    const data = await response.json();
    if (data.error !== 0) {
        console.error("查询用户信息失败:", data.msg);
        if (data.msg === "TOKEN 失效" || data.error === 401) {
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
        body: JSON.stringify({ token: token, num: betAmount, gametype: direction })
    });

    const data = await response.json();
    if (data.error !== 0) {
        console.error("下注失败:", data.msg);
        if (data.msg === "TOKEN 失效" || data.error === 401) {
            console.log("TOKEN 失效，停止下注。");
            return "TOKEN_INVALID"; // 返回 token 失效标记
        }
    }
    console.log("下注结果:", data);
    return data; // 返回下注结果
}

// 主循环函数
async function mainLoop() {
    let previousBalance; // 存储上一个余额
    let betDirection = 1; // 初始下注方向：1表示上涨，2表示下跌
    let lossCount = 0; // 记录连续输的次数
    let winCount = 0; // 记录赢的次数
    let totalLossCount = 0; // 记录总输的次数

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
                totalLossCount++; // 增加总输的次数
                console.log("输了，当前连续输的次数:", lossCount);
                
                // 如果输的次数达到2次，切换下注方向
                if (lossCount >= 2) {
                    console.log("连续输了两次，切换下注方向。");
                    betDirection = betDirection === 1 ? 2 : 1; // 输了，切换方向
                    lossCount = 0; // 重置输的计数
                }
            } else {
                winCount++; // 赢了，增加赢的次数
                console.log("赢了，当前赢的次数:", winCount);
                lossCount = 0; // 赢了，重置输的计数
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

        // 检查连续输的次数，如果达到5次，等待60到120秒
        if (lossCount >= 5) {
            const waitTime = Math.floor(Math.random() * (120000 - 60000 + 1) + 60000);
            console.log(`连续输了5次，等待 ${waitTime / 1000} 秒...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            lossCount = 0; // 等待后重置输的计数
            continue; // 跳过本次下注，直接重新开始循环
        }

        // 输出赢和输的统计
        console.log(`赢的次数: ${winCount}, 输的次数: ${totalLossCount}`);

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
