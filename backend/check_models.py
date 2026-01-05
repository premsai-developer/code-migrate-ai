import google.generativeai as genai

# PASTE YOUR KEY HERE
genai.configure(api_key="AIzaSyAdpOk8yBA0By6RjkY11T9j2rJMW91Mgq0")

print("Listing available models...")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)