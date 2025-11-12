from PIL import Image, ImageDraw, ImageFont
import os

def create_extension_icon(size, filename):
    img = Image.new('RGBA', (size, size), (76, 175, 80, 255))
    draw = ImageDraw.Draw(img)
    
    draw.ellipse([size//4, size//4, 3*size//4, 3*size//4], fill=(255, 255, 255, 255))
    
    font_size = max(size//4, 8)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        try:
            font = ImageFont.load_default()
        except:
            font = None
    
    text = "W"
    if font:
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = (size - text_width) // 2
        y = (size - text_height) // 2 - 2
        draw.text((x, y), text, fill=(76, 175, 80, 255), font=font)
    
    img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

if __name__ == "__main__":
    os.makedirs('icons', exist_ok=True)
    
    sizes = [16, 32, 48, 128]
    for size in sizes:
        create_extension_icon(size, f'icons/icon{size}.png')
    
    print("All icons created successfully!")