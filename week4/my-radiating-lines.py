import tkinter as tk
from math import atan2, cos, hypot, pi, sin

import seaborn as sns


APP_WIDTH = 1920
APP_HEIGHT = 1080
COLUMNS = 16
ROWS = 9
RAYS = 12
palette = list(sns.color_palette("coolwarm", 16).as_hex())

app = tk.Tk()
app.title("Interactive Radiating Lines")
app.geometry(f"{APP_WIDTH}x{APP_HEIGHT}")
canvas = tk.Canvas(app, bg="black", highlightthickness=0)
canvas.pack(fill=tk.BOTH, expand=True)

# Create each line once and update its endpoints when the mouse moves.
patterns = []
for column in range(COLUMNS):
    for row in range(ROWS):
        color = palette[(column + row) % len(palette)]
        lines = [canvas.create_line(0, 0, 0, 0, fill=color, width=1)
                 for _ in range(RAYS)]
        patterns.append((column, row, lines))

mouse_position = None
pending_frame = None


def render():
    global pending_frame
    pending_frame = None
    cell_width = canvas.winfo_width() / COLUMNS
    cell_height = canvas.winfo_height() / ROWS
    radius = min(cell_width, cell_height) / 2

    for column, row, lines in patterns:
        # Keep each pattern center fixed within its grid cell.
        cx = (column + 0.5) * cell_width
        cy = (row + 0.5) * cell_height
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


def request_render(event=None):
    global pending_frame
    if pending_frame is None:
        pending_frame = app.after(16, render)


def on_mouse_move(event):
    global mouse_position
    mouse_position = (event.x, event.y)
    request_render()


canvas.bind("<Motion>", on_mouse_move)
canvas.bind("<Configure>", request_render)
request_render()
app.mainloop()
