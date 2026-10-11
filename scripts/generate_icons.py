import os
from PIL import Image, ImageDraw

src_path = r"C:\Users\jaswant karun\.gemini\antigravity-ide\brain\f2f09a8b-c787-4a9e-a88b-4161e30398bb\.user_uploaded\media_1791731724211.jpg"
res_root = r"c:\Users\jaswant karun\CampusBite\android\app\src\main\res"
frontend_root = r"c:\Users\jaswant karun\CampusBite\frontend"

img = Image.open(src_path).convert("RGBA")

# Mipmap standard sizes
mipmap_sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

# Adaptive foreground sizes (108dp canvas)
foreground_sizes = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}

def make_round(im):
    size = im.size
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size[0], size[1]), fill=255)
    output = im.copy()
    output.putalpha(mask)
    return output

# 1. Update Mipmap icons
for folder, size in mipmap_sizes.items():
    folder_path = os.path.join(res_root, folder)
    os.makedirs(folder_path, exist_ok=True)
    
    # Standard square/squircle icon
    std_icon = img.resize((size, size), Image.Resampling.LANCZOS)
    std_icon.save(os.path.join(folder_path, "ic_launcher.png"), "PNG")
    
    # Round icon
    round_icon = make_round(std_icon)
    round_icon.save(os.path.join(folder_path, "ic_launcher_round.png"), "PNG")
    
    # Adaptive Foreground (108dp canvas with safe zone center)
    fg_size = foreground_sizes[folder]
    fg_canvas = Image.new("RGBA", (fg_size, fg_size), (0, 0, 0, 0))
    # Place logo within central 72dp (~66% of canvas)
    content_size = int(fg_size * 0.72)
    offset = (fg_size - content_size) // 2
    content = img.resize((content_size, content_size), Image.Resampling.LANCZOS)
    fg_canvas.paste(content, (offset, offset), content)
    fg_canvas.save(os.path.join(folder_path, "ic_launcher_foreground.png"), "PNG")
    print(f"Generated {folder}: {size}x{size} and foreground {fg_size}x{fg_size}")

# 2. Update Web & PWA assets
os.makedirs(os.path.join(frontend_root, "assets"), exist_ok=True)
img.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(frontend_root, "assets", "icon-512.png"), "PNG")
img.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(frontend_root, "assets", "icon-192.png"), "PNG")
img.resize((64, 64), Image.Resampling.LANCZOS).save(os.path.join(frontend_root, "favicon.png"), "PNG")
img.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(frontend_root, "assets", "app_icon.png"), "PNG")
print("Saved frontend web & PWA icons")
