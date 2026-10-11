#Mini Maple Story

import random
import time

# Player presets
player1 = {"job": "Warrior", "health": 100, "mana": 100, "level": 1, "experience": 0}
player2 = {"job": "Mage", "health": 100, "mana": 100, "level": 1, "experience": 0}
player3 = {"job": "Archer", "health": 100, "mana": 100, "level": 1, "experience": 0}
player4 = {"job": "Rogue", "health": 100, "mana": 100, "level": 1, "experience": 0}
player5 = {"job": "Pirate", "health": 100, "mana": 100, "level": 1, "experience": 0}

# Map definitions
maps = {
    "map1": "Henesys",
    "map2": "Ellinia",
    "map3": "Perion",
    "map4": "Kerning City",
    "map5": "Lith Harbor"
}

job_start_maps = {
    "Warrior": maps["map3"],      # Perion
    "Mage": maps["map2"],         # Ellinia
    "Archer": maps["map1"],       # Henesys
    "Rogue": maps["map4"],        # Kerning City
    "Pirate": maps["map5"]        # Lith Harbor
}

# Monster list
monsters = [
    {
        "name": "Slime",
        "hp": 30,
        "min_damage": 5,
        "max_damage": 10,
        "exp": 15,
        "gold": 10,
        "art": r"""
           (  .      )
          (   Slime   )
         (_____________)
        """
    },
    {
        "name": "Green Mushroom",
        "hp": 40,
        "min_damage": 7,
        "max_damage": 12,
        "exp": 20,
        "gold": 15,
        "art": r"""
            .-"''"-.
           /        \
          |  o    o  |
           '-.____.-'
             ||  ||
        """
    },
    {
        "name": "Ribbon Pig",
        "hp": 50,
        "min_damage": 8,
        "max_damage": 15,
        "exp": 25,
        "gold": 20,
        "art": r"""
           (?>  __  
           (oo)/  \====> [Ribbon]
            \__/\_/
               ""
        """
    },
    {
        "name": "Stump",
        "hp": 60,
        "min_damage": 10,
        "max_damage": 18,
        "exp": 30,
        "gold": 25,
        "art": r"""
             |---|
            / O O \
           |   v   |
          /|       |\
         / |_______| \
        """
    },
    {
        "name": "Octopus",
        "hp": 70,
        "min_damage": 12,
        "max_damage": 20,
        "exp": 35,
        "gold": 30,
        "art": r"""
            .-.
           (o.o)
          ((   ))
         /""'|'""\
        """
    },
    {
        "name": "Wild Boar",
        "hp": 85,
        "min_damage": 15,
        "max_damage": 22,
        "exp": 45,
        "gold": 40,
        "art": r"""
           /\__/\
          (  o.o )>====
          /  --  \ 
         (________)
        """
    },
    {
        "name": "Jr. Yeti",
        "hp": 100,
        "min_damage": 18,
        "max_damage": 25,
        "exp": 55,
        "gold": 50,
        "art": r"""
           /\_/\
          ( o o )
          /  v  \
         /  ___  \
        (___/ \___)
        """
    },
    {
        "name": "Drake",
        "hp": 130,
        "min_damage": 22,
        "max_damage": 30,
        "exp": 70,
        "gold": 65,
        "art": r"""
           /^ ^\
          ( O O )   __/\
           \ - /___/  --/
           /  ____   /
          (__/    \__)
        """
    },
    {
        "name": "Tauromacis",
        "hp": 160,
        "min_damage": 25,
        "max_damage": 35,
        "exp": 90,
        "gold": 80,
        "art": r"""
          (___)  (___)
           (o o)(o o)
           /   \/   \
          |  \____/  |
          \__________/
        """
    },
    {
        "name": "Balrog",
        "hp": 200,
        "min_damage": 30,
        "max_damage": 45,
        "exp": 120,
        "gold": 100,
        "art": r"""
          (\_/)      (\_/)
          ( @ @ )   ( @ @ )
          /\___/\   /\___/\
         (   X   ) (   X   )
          \_____/   \_____/
        """
    }
]

# Store items
store = {
    "1": {"name": "Red Potion", "price": 20, "heal_hp": 30, "heal_mp": 0},
    "2": {"name": "Blue Potion", "price": 20, "heal_hp": 0, "heal_mp": 30},
    "3": {"name": "Elixir", "price": 50, "heal_hp": 50, "heal_mp": 50}
}

def print_title_art():
    title_art = r"""
 ___  ___ _____ _   _ _____   ___  ___  ___ ______ _      _____    _____ _____ _____ ______ __   __
 |  \/  ||_   _| \ | |_   _|  |  \/  | / _ \| ___ \ |    |  ___|  /  ___|_   _|  _  || ___ \\ \ / /
 | .  . |  | | |  \| | | |    | .  . |/ /_\ \ |_/ / |    | |__    \ `--.  | | | | | || |_/ / \ V / 
 | |\/| |  | | | . ` | | |    | |\/| ||  _  |  __/| |    |  __|    `--. \ | | | | | ||    /   \ /  
 | |  | | _| |_| |\  |_| |_   | |  | || | | | |   | |____| |___   /\__/ / | | \ \_/ /| |\ \   | |  
 \_|  |_/ \___/\_| \_/\___/   \_|  |_/\_| |_/\_|  \_____/\____/   \____/  \_/  \___/ \_| \_|  \_/                                                                                                 
    """
    print("\n" + "=" * 135)
    print(title_art)
    print("=" * 135 + "\n")
    time.sleep(0.5)

def get_player_name():
    player_name = input("Enter your player name: ").strip()
    while not player_name:
        player_name = input("Name cannot be empty. Enter your player name: ").strip()
    return player_name

def choose_job():
    print("\nChoose your job:")
    print("1. Warrior")
    print("2. Mage")
    print("3. Archer")
    print("4. Rogue")
    print("5. Pirate")
    choice = input("Enter 1, 2, 3, 4, or 5: ").strip()

    if choice == "1":
        return "Warrior"
    elif choice == "2":
        return "Mage"
    elif choice == "3":
        return "Archer"
    elif choice == "4":
        return "Rogue"
    elif choice == "5":
        return "Pirate"
    else:
        print("Invalid choice. Please try again.")
        return choose_job()

def create_player():
    name = get_player_name()
    job = choose_job()
    start_map = job_start_maps[job]
    
    return {
        "name": name,
        "job": job,
        "health": 100,
        "mana": 100,
        "level": 1,
        "experience": 0,
        "gold": 0,        
        "current_map": start_map
    } 

def print_story_intro(player):
    job = player["job"]
    name = player["name"]
    start_map = player["current_map"]

    print(f"\nLong ago, a new adventurer appeared in Maple World...")
    time.sleep(1)

    if job == "Warrior":
        print(f"Bracing through the harsh winds of the rocky mountains, {name} grips a heavy sword.")
        print(f"Your journey begins in [{start_map}], the sanctuary of brave warriors!")
    elif job == "Mage":
        print(f"Deep inside the mystical forest, {name} feels the ancient power of mana awakening.")
        print(f"You arrive at [{start_map}], the giant tree city where mages study the arcana!")
    elif job == "Archer":
        print(f"Standing over peaceful grasslands, {name} readies a sturdy bow.")
        print(f"You enter [{start_map}], the village of archers filled with mushroom houses!")
    elif job == "Rogue":
        print(f"Beneath the dim neon shadows of the city, {name}'s sharp dagger glints in the dark.")
        print(f"You step into [{start_map}], the backstreets where shadows gather!")
    elif job == "Pirate":
        print(f"Smelling the cool ocean breeze, {name} prepares to set sail for vast new worlds.")
        print(f"Your voyage starts at [{start_map}], the bustling port of sailors and swashbucklers!")

    time.sleep(1.5)
    print(f"\n>>> You have successfully arrived at [{start_map}]! <<<")
    print("=" * 135)

def check_level_up(player):
    if player["experience"] >= 100:
        player["level"] += 1
        player["experience"] -= 100
        player["health"] = 100  # Fully restores HP/MP upon leveling up
        player["mana"] = 100
        print("\n" + "*" * 40)
        print(f"  ★ LEVEL UP! You reached Level {player['level']}! ★  ")
        print("  Your HP and MP have been fully restored!")
        print("*" * 40)

def open_store(player):
    while True:
        print("\n" + "=" * 45)
        print(f"         ★ ITEM STORE ★ (Gold: {player['gold']} Meso)")
        print("=" * 45)
        for key, item in store.items():
            print(f"{key}. {item['name']:<12} | Price: {item['price']} Gold | (HP: +{item['heal_hp']}, MP: +{item['heal_mp']})")
        print("4. Back to Main Menu")
        print("=" * 45)

        choice = input("Select an item to buy (1-4): ").strip()

        if choice in store:
            selected_item = store[choice]
            if player["gold"] >= selected_item["price"]:
                player["gold"] -= selected_item["price"]
                player["health"] = min(100, player["health"] + selected_item["heal_hp"])
                player["mana"] = min(100, player["mana"] + selected_item["heal_mp"])

                print(f"\nYou bought and used {selected_item['name']}!")
                print(f"Current HP: {player['health']}/100 | MP: {player['mana']}/100 | Remaining Gold: {player['gold']}")
            else:
                print(f"\nNot enough gold! You need {selected_item['price']} gold, but you only have {player['gold']}.")

        elif choice == "4":
            print("\nLeaving the store...")
            break
        else:
            print("Invalid input. Please enter a valid number.")

def explore(player):
    # Randomly pick a monster from the list
    monster = random.choice(monsters)

    print(f"\nYou explore around {player['current_map']}...")
    print(f"A wild [{monster['name']}] appeared in {player['current_map']}!")
    print(monster["art"])
    
    while True:
        print("What will you do?")
        print("1. Attack")
        print("2. Run Away")
        
        choice = input("Select an action (1 or 2): ").strip()
        
        if choice == "1":
            hp_loss = random.randint(monster["min_damage"], monster["max_damage"])
            mp_loss = random.randint(5, 10)
            gain_exp = monster["exp"]
            gain_gold = monster["gold"]

            player["health"] = max(0, player["health"] - hp_loss)
            player["mana"] = max(0, player["mana"] - mp_loss)
            player["experience"] += gain_exp
            player["gold"] += gain_gold

            print(f"\n{player['name']} attacks the {monster['name']}!")
            print(f"The {monster['name']} struck back! You took {hp_loss} damage and spent {mp_loss} MP.")
            print(f"You defeated the {monster['name']} and gained {gain_exp} EXP and {gain_gold} Gold!")

            if player["health"] <= 0:
                print("\nYou ran out of HP and collapsed... Game Over!")
                return False

            check_level_up(player)
            break

        elif choice == "2":
            if random.choice([True, False]):
                print(f"\nYou successfully ran away back to safety!")
                break
            else:
                print(f"\nYou tried to run away, but the {monster['name']} blocked your path!")

        else:
            print("Invalid input. Please enter 1 or 2.")
            
    return True

def check_status(player):
    print("\n" + "=" * 35)
    print("         ★ PLAYER STATUS ★         ")
    print("=" * 35)
    print(f" Name        : {player['name']}")
    print(f" Job         : {player['job']}")
    print(f" Level       : {player['level']}")
    print(f" Health (HP) : {player['health']} / 100")
    print(f" Mana (MP)   : {player['mana']} / 100")
    print(f" Experience  : {player['experience']} / 100")
    print(f" Gold        : {player['gold']} Meso")
    print(f" Current Map : {player['current_map']}")
    print("=" * 35)

def main_game_loop(player):
    while True:
        print(f"\n[Location: {player['current_map']}] | Name: {player['name']} ({player['job']}) | LV: {player['level']} | HP: {player['health']} | MP: {player['mana']} | Gold: {player['gold']}")
        print("1. Explore")
        print("2. Check Status")
        print("3. Store")
        print("4. Quit Game")

        choice = input("Select an action (1-4): ").strip()
        
        if choice == "1":
            is_alive = explore(player)
            if not is_alive:
                break
        elif choice == "2":
            check_status(player)
        elif choice == "3":
            open_store(player)
        elif choice == "4":
            print("\nExiting the game. See you on your next adventure!")
            break
        else:
            print("Invalid input. Please try again.")

def start_adventure():
    print_title_art()          
    player = create_player()  
    print_story_intro(player) 
    main_game_loop(player)

# Run the game
if __name__ == "__main__":
    start_adventure()