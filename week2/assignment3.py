# Assignment 3

# Taking Pictures in NYC

# User inputs

place = input("Where do you want to take pictures in NYC? ")
time = int(input("What time do you want to take pictures? "))
subject = input("What do you want to take pictures of? ")
lens = input("What lens do you want to use? ")
aperture = float(input("What aperture do you want to use? "))
shutter_speed = input("What shutter speed do you want to use? ")
iso = int(input("What ISO do you want to use? "))

# Boolean variable

isWeekend = False

# Story using concatenation

story = "I want to take pictures of " + subject
story = story + " in " + place
story = story + " at " + str(time)
story = story + " using a " + lens + " lens."
story = story + " My aperture is " + str(aperture)
story = story + ", my shutter speed is " + shutter_speed
story = story + ", and my ISO is " + str(iso) + "."

# Show the story

print(story)
