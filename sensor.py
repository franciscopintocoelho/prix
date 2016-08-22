#Libraries
from __future__ import division
from decimal import *
import RPi.GPIO as GPIO
import time

#GPIO Mode (BOARD / BCM)
GPIO.setmode(GPIO.BCM)

#set GPIO Pins
GPIO_TRIGGER = 23
GPIO_ECHO = 24

#set GPIO direction (IN / OUT)
GPIO.setup(GPIO_TRIGGER, GPIO.OUT)
GPIO.setup(GPIO_ECHO, GPIO.IN)

def distance():
        # set Trigger to HIGH
        GPIO.output(GPIO_TRIGGER, True)

        # set Trigger after 0.01ms to LOW
        time.sleep(0.00001)
        GPIO.output(GPIO_TRIGGER, False)

        StartTime = time.time()
        StopTime = time.time()

        # save StartTime
        while GPIO.input(GPIO_ECHO) == 0:
                StartTime = time.time()

        # save time of arrival
        while GPIO.input(GPIO_ECHO) == 1:
                StopTime = time.time()

        # time difference between start and arrival
        TimeElapsed = StopTime - StartTime
        # multiply with the sonic speed (34300 cm/s)
        # and divide by 2, because there and back
        distance = (TimeElapsed * 34300) / 2

        return distance

if __name__ == '__main__':
        try:
                while True:
                        dist = distance()
                        print dist
                        time.sleep(0.1)
        # Reset by pressing CTRL + C
        except KeyboardInterrupt:
                print("Program stopped by User")
                GPIO.cleanup()


















^G Get Help                     ^O WriteOut                     ^R Read File                    ^Y Prev Page                    ^K Cut Text                     ^C Cur Pos
^X Exit                         ^J Justify                      ^W Where Is                     ^V Next Page                    ^U UnCut Text                   ^T To Spell
