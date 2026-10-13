import tkinter as tk
from colorsys import hsv_to_rgb
from math import atan2, cos, hypot, pi, sin


APP_WIDTH = 1920
APP_HEIGHT = 1080
COLUMNS = 16
ROWS = 9
RAYS = 12

def gradient_color(position, phase):
    # A continuous, softly saturated palette with no hard color boundaries.
    hue = (0.48 + 0.30 * position + phase) % 1.0
    red, green, blue = hsv_to_rgb(hue, 0.42, 0.95)
    return "#{:02x}{:02x}{:02x}".format(
        round(red * 255), round(green * 255), round(blue * 255)
    )

app = tk.Tk()
app.title("Interactive Radiating Lines")
app.geometry(f"{APP_WIDTH}x{APP_HEIGHT}")
canvas = tk.Canvas(app, bg="black", highlightthickness=0)
canvas.pack(fill=tk.BOTH, expand=True)

# Create each line once and update its endpoints when the mouse moves.
patterns = []
for column in range(COLUMNS):
    for row in range(ROWS):
        position = 0.65 * column / (COLUMNS - 1) + 0.35 * row / (ROWS - 1)
        color = gradient_color(position, 0)
        lines = [canvas.create_line(0, 0, 0, 0, fill=color, width=1)
                 for _ in range(RAYS)]
        patterns.append((column, row, lines))

mouse_position = None
pending_frame = None
color_phase = 0.0
target_color_phase = 0.0


def render():
    global pending_frame, color_phase
    pending_frame = None
    # Ease toward the cursor-driven color so fast movements do not flash.
    color_phase += (target_color_phase - color_phase) * 0.15
    if abs(target_color_phase - color_phase) < 0.0001:
        color_phase = target_color_phase
    cell_width = canvas.winfo_width() / COLUMNS
    cell_height = canvas.winfo_height() / ROWS
    radius = min(cell_width, cell_height) / 2

    for column, row, lines in patterns:
        # Keep each pattern center fixed within its grid cell.
        cx = (column + 0.5) * cell_width
        cy = (row + 0.5) * cell_height
        position = 0.65 * column / (COLUMNS - 1) + 0.35 * row / (ROWS - 1)
        color = gradient_color(position, color_phase)
        rotation = 0
        influence = 0
        if mouse_position is not None:
            dx = mouse_position[0] - cx
            dy = mouse_position[1] - cy
            rotation = atan2(dy, dx)
            influence = max(0, 1 - hypot(dx, dy) / max(radius * 6, 1))

        for index, line in enumerate(lines):
            angle = 2 * pi * index / RAYS + rotation
            # Nearby rays stretch toward the cursor while centers stay fixed.
            length = radius * (1 + 0.35 * influence * cos(angle - rotation))
            ex = cx + cos(angle) * length
            ey = cy + sin(angle) * length
            canvas.coords(line, cx, cy, ex, ey)
            canvas.itemconfigure(line, fill=color)

    if color_phase != target_color_phase:
        request_render()


def request_render(event=None):
    global pending_frame
    if pending_frame is None:
        pending_frame = app.after(16, render)


def on_mouse_move(event):
    global mouse_position, target_color_phase
    mouse_position = (event.x, event.y)
    x_fraction = max(0, min(1, event.x / max(canvas.winfo_width(), 1)))
    y_fraction = max(0, min(1, event.y / max(canvas.winfo_height(), 1)))
    target_color_phase = 0.55 * x_fraction + 0.35 * y_fraction
    request_render()


canvas.bind("<Motion>", on_mouse_move)
canvas.bind("<Configure>", request_render)
request_render()
app.mainloop()
