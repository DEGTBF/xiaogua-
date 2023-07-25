import time
import random

def delay_print(text, delay=0.03):
    for char in text:
        print(char, end='', flush=True)
        time.sleep(delay)
    print()

class Character:
    def __init__(self, name, health, attack):
        self.name = name
        self.health = health
        self.attack = attack

    def __str__(self):
        return self.name

class Player(Character):
    def __init__(self, name):
        super().__init__(name, 100, 20)
        self.level = 1
        self.exp = 0
        self.inventory = {}

    def add_item(self, item, quantity=1):
        if item.name in self.inventory:
            self.inventory[item.name] += quantity
        else:
            self.inventory[item.name] = quantity

    def remove_item(self, item, quantity=1):
        if item.name in self.inventory:
            if self.inventory[item.name] >= quantity:
                self.inventory[item.name] -= quantity
                return True
            else:
                return False
        else:
            return False

class Item:
    def __init__(self, name, description):
        self.name = name
        self.description = description

class Enemy(Character):
    def __init__(self, name, health, attack, exp_reward):
        super().__init__(name, health, attack)
        self.exp_reward = exp_reward

def show_inventory(player):
    print("\n你的背包：")
    for item_name, quantity in player.inventory.items():
        print(f"{item_name}: {quantity}个")

def choose_action():
    print("\n你可以做以下操作：")
    print("1. 查看角色状态")
    print("2. 查看背包")
    print("3. 组建队伍")
    print("4. 进行战斗")
    print("5. 接受任务")
    print("6. 退出游戏")
    while True:
        try:
            choice = int(input("请输入你的选择（1/2/3/4/5/6）："))
            if 1 <= choice <= 6:
                return choice
            else:
                print("无效的选择，请重新输入。")
        except ValueError:
            print("无效的输入，请重新输入。")

def show_character_status(player):
    print(f"\n{name}等级：{player.level}")
    print(f"生命值：{player.health}")
    print(f"攻击力：{player.attack}")
    print(f"经验值：{player.exp}/{player.level * 100}")

def build_team(player):
    team = []
    while len(team) < 3:
        print("\n可以选择以下队员：")
        for i, enemy in enumerate(enemies, start=1):
            print(f"{i}. {enemy}")
        try:
            choice = int(input("请选择队员序号（输入0退出选择）："))
            if 0 <= choice <= len(enemies):
                if choice == 0:
                    break
                else:
                    team.append(enemies[choice - 1])
            else:
                print("无效的选择，请重新输入。")
        except ValueError:
            print("无效的输入，请重新输入。")
    return team

def fight(player, enemy):
    delay_print(f"\n你遭遇了{enemy.name}，开始战斗！")

    while player.health > 0 and enemy.health > 0:
        delay_print(f"\n你的生命值：{player.health}  {enemy.name}的生命值：{enemy.health}")
        choice = input("你要攻击（A）还是逃跑（E）？").lower()
        if choice == "a":
            player.attack_enemy(enemy)
            enemy.attack_player(player)
        elif choice == "e":
            delay_print("你逃跑了。")
            break
        else:
            delay_print("无效的选择，请重新输入。")

    if player.health <= 0:
        delay_print("你被击败了，游戏结束。")
        exit()
    else:
        delay_print(f"你战胜了{enemy.name}，获得了{enemy.exp_reward}经验值。")
        player.exp += enemy.exp_reward
        if player.exp >= player.level * 100:
            player.level_up()

def accept_quest(player):
    quest_item = Item("宝藏地图", "指示宝藏所在地的地图")
    player.add_item(quest_item)
    delay_print("你接受了任务：寻找宝藏。")
    delay_print(f"你获得了{quest_item.name}，它将帮助你找到宝藏的位置。")

def level_up(player):
    player.exp -= player.level * 100
    player.level += 1
    player.health = 100
    player.attack += 5
    delay_print(f"恭喜你升级了！你的等级提升到了{player.level}级。生命值和攻击力得到了增加。")

def play_game():
    player_name = input("请输入你的角色名字：")
    player = Player(player_name)
    
    enemies = [
        Enemy("黑风怪", 60, 15, 30),
        Enemy("铁扇公主", 80, 20, 50),
        Enemy("白骨精", 100, 25, 80),
        Enemy("牛魔王", 120, 30, 100)
    ]

    delay_print(f"欢迎来到《水浒传》游戏，{player_name}！")
    delay_print("你将在这个世界中体验不同的冒险和挑战。")

    while True:
        show_character_status(player)
        action = choose_action()

        if action == 1:
            show_character_status(player)
        elif action == 2:
            show_inventory(player)
        elif action == 3:
            team = build_team(player)
            delay_print("你组建了一个队伍：")
            for member in team:
                delay_print(f"{member}")
        elif action == 4:
            if not team:
                delay_print("你还没有组建队伍，不能进行战斗。")
            else:
                enemy = random.choice(enemies)
                fight(player, enemy)
        elif action == 5:
            accept_quest(player)
        elif action == 6:
            delay_print("谢谢你玩《水浒传》游戏，再见！")
            exit()
