import time
import random

class Character:
    def __init__(self, name, health, attack_power, defense_power):
        self.name = name
        self.health = health
        self.attack_power = attack_power
        self.defense_power = defense_power

    def take_damage(self, damage):
        self.health -= damage
        if self.health <= 0:
            self.health = 0

    def attack(self, target):
        damage = self.attack_power - target.defense_power
        if damage > 0:
            target.take_damage(damage)
            return damage
        return 0

class Player(Character):
    def __init__(self, name):
        super().__init__(name, health=100, attack_power=30, defense_power=20)
        self.experience = 0
        self.level = 1

    def level_up(self):
        self.level += 1
        self.attack_power += 10
        self.defense_power += 5

class Enemy(Character):
    def __init__(self, name, health, attack_power, defense_power, experience_reward):
        super().__init__(name, health, attack_power, defense_power)
        self.experience_reward = experience_reward

def delay_print(text, delay=0.03):
    for char in text:
        print(char, end='', flush=True)
        time.sleep(delay)
    print()

def fight(player, enemy):
    delay_print(f"{player.name}遭遇了{enemy.name}！")
    while player.health > 0 and enemy.health > 0:
        player_damage = player.attack(enemy)
        enemy_damage = enemy.attack(player)
        delay_print(f"{player.name}对{enemy.name}造成了{player_damage}点伤害，{enemy.name}剩余{enemy.health}生命值。")
        delay_print(f"{enemy.name}对{player.name}造成了{enemy_damage}点伤害，{player.name}剩余{player.health}生命值。")
        if enemy.health <= 0:
            player.experience += enemy.experience_reward
            player.level_up()
            delay_print(f"{player.name}战胜了{enemy.name}！获得了{enemy.experience_reward}点经验值。")
            break
        elif player.health <= 0:
            delay_print(f"{player.name}被{enemy.name}击败，游戏结束。")
            exit()

def explore(player):
    delay_print(f"{player.name}踏上了冒险之路...")
    enemies = [
        Enemy("豹子头林冲", health=50, attack_power=25, defense_power=10, experience_reward=20),
        Enemy("黑旋风李逵", health=60, attack_power=30, defense_power=15, experience_reward=30),
        Enemy("托塔天王秦明", health=70, attack_power=35, defense_power=20, experience_reward=40)
    ]
    enemy = random.choice(enemies)
    fight(player, enemy)

def main():
    player_name = input("请输入你的名字：")
    player = Player(player_name)

    delay_print(f"欢迎来到《水浒传》冒险游戏，{player_name}！")
    delay_print("你将在这个游戏中经历各种冒险，与英雄豪杰战斗。")

    while True:
        explore(player)

if __name__ == "__main__":
    main()
