from googletrans import Translator

def automatic_translation(text, target_language='zh-CN'):
    translator = Translator()
    translated = translator.translate(text, dest=target_language)
    return translated.text
