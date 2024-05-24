import os
import wmill
import requests
import logging
from openai import OpenAI

logging.basicConfig(level=logging.INFO)


def translate_text(text, source_lang, target_lang, api_key):
    
    url = "https://google-translate1.p.rapidapi.com/language/translate/v2"
    payload = {
        "q": text,
        "target": target_lang,
        "source": source_lang
    }
    headers = {
        "content-type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "application/gzip",
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": "google-translate1.p.rapidapi.com"
    }

    try:
        response = requests.post(url, data=payload, headers=headers)
        response.raise_for_status() 
        translated_text = response.json().get('data', {}).get('translations', [{}])[0].get('translatedText', '')
        logging.info(f"Translation successful: {translated_text}")
        return translated_text
    except requests.exceptions.HTTPError as e:
        logging.error(f"HTTP error occurred: {e.response.status_code} - {e.response.reason}")
    except requests.exceptions.RequestException as e:
        logging.error(f"Request failed: {e}")
        return None
    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}")
        return None

    return None


def generate_image(prompt, model="dall-e-3", size="1024x1024", quality="standard", n=1):
    try:
        client = OpenAI()
        response = client.images.generate(
            model=model,
            prompt=prompt,
            size=size,
            quality=quality,
            n=n
        )
        if response.data and len(response.data) > 0:
            image_url = response.data[0].url
            logging.info(f"Image generated successfully: {image_url}")
            return image_url
        else:
            logging.error("No data received from image generation request.")
            return None
    except ValueError as e:
        logging.error(f"Validation error: {e}")
        return None
    except Exception as e:
        logging.error(f"Unexpected error occurred: {e}")
        return None

        
def main(data: dict):
    language = data.get('language')
    prompt = data.get('prompt')

    google_translate_api_key = ""
    if google_translate_api_key is None:
        raise ValueError("Google Translate API key not found in Windmill resources.")

    openai_api_key = wmill.get_variable("u/donald/OPENAI_API_KEY")
    if openai_api_key is None:
        raise ValueError("OpenAI API key not found in Windmill resources.")

    os.environ["OPENAI_API_KEY"] = openai_api_key

    target_lang = "en"

    print(prompt)
    translated_prompt = translate_text(prompt, language, target_lang, google_translate_api_key)
    if translated_prompt is None:
        raise ValueError("Failed to translate the prompt.")

    image_url = generate_image(translated_prompt)
    if image_url is None:
        raise ValueError("Failed to generate the image.")

    return {"image_url": image_url}