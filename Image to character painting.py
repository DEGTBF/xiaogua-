from PIL import Image

def image_to_ascii(image_path, width=100):
    image = Image.open(image_path)
    aspect_ratio = image.size[1] / image.size[0]
    height = int(width * aspect_ratio)
    resized_image = image.resize((width, height))
    grayscale_image = resized_image.convert('L')
    pixels = grayscale_image.getdata()
    ascii_chars = ''.join(['@' if pixel > 127 else ' ' for pixel in pixels])
    ascii_lines = [ascii_chars[i:i+width] for i in range(0, len(ascii_chars), width)]
    ascii_art = '\n'.join(ascii_lines)
    return ascii_art

