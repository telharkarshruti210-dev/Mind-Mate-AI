import os
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from groq import Groq

app = Flask(__name__)
CORS(app)

API_KEY = os.environ.get("GROQ_API_KEY", "PASTE_YOUR_KEY_HERE")
client = Groq(api_key=API_KEY)

# --- PAGE ROUTES ---
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/details')
def details():
    return render_template('details.html')

@app.route('/age')
def age():
    return render_template('age.html')

@app.route('/ai')
def ai_intro():
    return render_template('ai.html')

@app.route('/chat_page')
def chat_page():
    return render_template('chat.html')

# --- BACKEND LOGIC (API) ---
@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get("message")
        username = data.get("username", "Friend")

        if not user_message:
            return jsonify({"reply": "I'm listening. Kuch toh bolo!"})

        # Groq Llama 3 Model setup
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system", 
                    "content": f"You are MindMate, a kind and supportive mental health AI. The user's name is {username}. Speak in a friendly mix of Hindi and English (Hinglish). Keep responses short and comforting."
                },
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        reply_text = completion.choices[0].message.content
        return jsonify({"reply": reply_text})

    except Exception as e:
        print(f"ERROR: {e}")
        return jsonify({"reply": "Oops! Thoda network issue hai, ek baar phir koshish karein."})

if __name__ == '__main__':
    app.run(port=5000, debug=True)