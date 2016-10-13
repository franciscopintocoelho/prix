import pygame

pygame.init()
pygame.mouse.set_visible(False)

screen = pygame.display.set_mode((0,0), pygame.FULLSCREEN)
screen.fill((0,0,0))

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    running = False

pygame.quit()