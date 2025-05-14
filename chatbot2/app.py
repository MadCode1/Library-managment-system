# from flask import Flask, render_template, request
# from transformers import AutoModelForCausalLM, AutoTokenizer
# import torch
#
# # Load the pretrained model and tokenizer
# model_name = "microsoft/DialoGPT-medium"
# tokenizer = AutoTokenizer.from_pretrained(model_name)
# model = AutoModelForCausalLM.from_pretrained(model_name)
#
# # Initialize the Flask app
# app = Flask(__name__)
#
# # Function to generate chatbot responses
# def get_chatbot_response(user_input):
#     new_user_input_ids = tokenizer.encode(user_input + tokenizer.eos_token, return_tensors='pt')
#     chat_history_ids = model.generate(new_user_input_ids, max_length=1000, pad_token_id=tokenizer.eos_token_id, no_repeat_ngram_size=2, top_k=50, top_p=0.95, temperature=0.7, do_sample=True)
#     bot_output = tokenizer.decode(chat_history_ids[:, new_user_input_ids.shape[-1]:][0], skip_special_tokens=True)
#     return bot_output
#
# # Home route - renders the chat page
# # @app.route("/")
# # def home():
# #     return render_template("index.html")
#
# # Ask route - handles user input and generates the response
# @app.route("/ask", methods=["POST"])
# def ask():
#     user_input = request.form["user_input"]
#     response = get_chatbot_response(user_input)
#     return render_template("index.html", user_input=user_input, response=response)
#
# # Run the Flask app
# if __name__ == "__main__":
#     app.run(debug=True)

from flask import Flask, request, jsonify
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

# Load the pretrained model
model_name = "microsoft/DialoGPT-medium"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

# Flask app
app = Flask(__name__)

# Book data for custom response (optional)
book_data = {
    "the silent patient": "The Silent Patient is a psychological thriller by Alex Michaelides about a woman who stops speaking after a violent incident.",
    "it ends with us": "It Ends With Us is a contemporary romance novel by Colleen Hoover dealing with love, trauma, and personal growth.",
    "project hail mary": "Project Hail Mary is a sci-fi novel by Andy Weir where a lone astronaut must save humanity from extinction.",
    "verity": "Verity is a romantic thriller by Colleen Hoover, filled with dark secrets, a mysterious manuscript, and intense emotional conflict.",
    "lessons in chemistry": "Lessons in Chemistry by Bonnie Garmus features a brilliant female chemist in the 1960s who becomes a TV cooking star while challenging societal norms.",
    "introduction to algorithms": "Introduction to Algorithms by Cormen, Leiserson, Rivest, and Stein is a widely used textbook for studying algorithms in computer science.",
    "digital logic and computer design": "Digital Logic and Computer Design by M. Morris Mano explains the basics of logic circuits and how computers work from the ground up.",
    "fundamentals of thermodynamics": "Fundamentals of Thermodynamics by Sonntag and Borgnakke provides a strong foundation in thermodynamic principles for mechanical engineering.",
    "engineering mechanics": "Engineering Mechanics by R.C. Hibbeler covers statics and dynamics essential for civil, mechanical, and aerospace engineering students.",
    "signals and systems": "Signals and Systems by Alan V. Oppenheim offers a deep understanding of signal processing concepts in electrical engineering.",
    "microelectronic circuits": "Microelectronic Circuits by Sedra and Smith is a foundational text on analog and digital circuit design.",
    "control systems engineering": "Control Systems Engineering by Norman S. Nise introduces modern control theory for electrical and electronics engineering students.",
    "mechanical vibrations": "Mechanical Vibrations by S.S. Rao discusses the theory and practical applications of vibrational analysis in engineering.",
    "fluid mechanics": "Fluid Mechanics by Frank M. White is a classic book used to understand the behavior of fluids and their applications in engineering.",
    "harry potter": "Harry Potter is a series of fantasy novels written by J.K. Rowling. It follows the story of a young wizard and his journey at Hogwarts.",
    "the hobbit": "The Hobbit is a fantasy novel by J.R.R. Tolkien about the adventures of Bilbo Baggins, a hobbit who goes on a quest with dwarves.",
    "1984": "1984 is a dystopian novel by George Orwell that explores a totalitarian regime under constant surveillance.",
    "to kill a mockingbird": "To Kill a Mockingbird is a novel by Harper Lee that deals with serious issues like racial injustice and moral growth.",
    "the great gatsby": "The Great Gatsby is a novel by F. Scott Fitzgerald about the mysterious millionaire Jay Gatsby and his obsession with Daisy Buchanan.",
    "pride and prejudice": "Pride and Prejudice is a romantic novel by Jane Austen that critiques social class and marriage in 19th century England.",
    "the alchemist": "The Alchemist is a novel by Paulo Coelho about a shepherd's journey to fulfill his personal legend and find treasure.",
    "the da vinci code": "The Da Vinci Code is a mystery thriller novel by Dan Brown involving symbology, secret societies, and religious history.",
    "the lord of the rings": "The Lord of the Rings is a high fantasy epic by J.R.R. Tolkien, following the quest to destroy the One Ring.",
    "the catcher in the rye": "The Catcher in the Rye is a novel by J.D. Salinger that explores teenage alienation and rebellion.",
    "the fault in our stars": "The Fault in Our Stars is a novel by John Green about two teenagers with cancer who fall in love.",
    "animal farm": "Animal Farm is a political allegory by George Orwell depicting the rise of tyranny through the story of farm animals.",
    "the chronicles of narnia": "The Chronicles of Narnia is a fantasy series by C.S. Lewis set in the magical land of Narnia.",
    "moby dick": "Moby-Dick is a novel by Herman Melville about Captain Ahab's obsession with hunting a giant white whale.",
    "sherlock holmes": "Sherlock Holmes is a detective series by Arthur Conan Doyle featuring the brilliant sleuth solving complex cases.",
    "percy jackson": "Percy Jackson is a series by Rick Riordan about a boy who discovers he's a demigod and embarks on mythological quests.",
    "the hunger games": "The Hunger Games is a dystopian series by Suzanne Collins where teenagers fight in a deadly televised competition.",
    "a game of thrones": "A Game of Thrones is the first book in the fantasy series A Song of Ice and Fire by George R.R. Martin, known for its complex political intrigue.",
    "the girl with the dragon tattoo": "The Girl with the Dragon Tattoo is a mystery thriller by Stieg Larsson involving an investigative journalist and a hacker.",
    "the kite runner": "The Kite Runner is a novel by Khaled Hosseini that explores friendship, betrayal, and redemption in Afghanistan."
}


# Chatbot response function
def get_chatbot_response(user_input):
    for book in book_data:
        if book in user_input.lower():
            return book_data[book]

    input_ids = tokenizer.encode(user_input + tokenizer.eos_token, return_tensors='pt')
    chat_history_ids = model.generate(
        input_ids,
        max_length=1000,
        pad_token_id=tokenizer.eos_token_id,
        no_repeat_ngram_size=2,
        top_k=50,
        top_p=0.95,
        temperature=0.7,
        do_sample=True
    )
    bot_output = tokenizer.decode(chat_history_ids[:, input_ids.shape[-1]:][0], skip_special_tokens=True)
    return bot_output


# POST API endpoint for chatbot
@app.route("/api/ask", methods=["POST"])
def ask_api():
    data = request.get_json()
    print(data)
    if not data or 'message' not in data:
        return jsonify({"error": "Invalid request, 'message' key is required."}), 400

    user_input = data['message']
    response = get_chatbot_response(user_input)
    return jsonify({"response": response})



if __name__ == "__main__":
    app.run(debug=True)
